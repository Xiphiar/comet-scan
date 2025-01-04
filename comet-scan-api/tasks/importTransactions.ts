import { base64PubkeyToAddress, pubkeyToAddress } from "secretjs";
import { Transaction } from "../interfaces/models/transactions.interface";
import Blocks from "../models/blocks";
import KvStore, { KV } from "../models/kv"
import { getChainConfig } from "../config/chains";
import axios from "axios";
import { LcdTxSearchResponse, LcdTxSearchResult, LcdTxSearchTx } from "../interfaces/lcdTxResponse";
import Transactions from "../models/transactions";
import { Block } from "../interfaces/models/blocks.interface";
import { processBlock } from "./importBlocks";

const key = 'txs-import-processed-block'

const importTransactions = async (chainId: string) => {
    try {
        console.log(`Importing transactions on ${chainId}...`)
        // Get highest processed block from KVStore
        let document = await KvStore.findOne({ chainId, key }).lean();

        const highestBlockInDb = await Blocks.findOne({ chainId }).sort('-height').lean();
        if (!highestBlockInDb) {
            console.log('No blocks imported for', chainId)
            return;
        }
        
        let highestProcessed: number = parseInt(document?.value || '0');

        if (!highestProcessed) {
            let lowestBlockInDb = await Blocks.findOne({ chainId }).sort('height').lean();
            if (!lowestBlockInDb) {
                console.log('No blocks imported for', chainId)
                return;
            }
            highestProcessed = lowestBlockInDb.height;
            document = await KvStore.create({ chainId, key, value: highestProcessed.toString() });
        }

        console.log(`Need to import transactions for ${highestBlockInDb.height - highestProcessed} blocks on ${chainId}`)

        while (highestProcessed < highestBlockInDb.height) {
            await importTransactionsForBlock(chainId, highestProcessed + 1);
            highestProcessed++
            await KvStore.findByIdAndUpdate(document?._id, { value: highestProcessed.toString() })
        }
        console.log(`Done importing transactions on ${chainId}!`)
    } catch (err: any) {
        console.error(`Failed to import transactions on ${chainId}:`, err.toString())
    }
}

export const importTransactionsForBlock = async (chainId: string, blockHeight: number) => {
    // console.log(`Importing transactions for block ${blockHeight} on ${chainId}`)
    const config = getChainConfig(chainId);
    let block: Block | null = await Blocks.findOne({ height: blockHeight }).lean();
    if (!block) {
        await processBlock(chainId, config.rpc, blockHeight);
        block = await Blocks.findOne({ height: blockHeight }).lean();
        // throw `Block ${blockHeight} not found in DB for ${chainId}`;
    }
    if (!block) {
        throw `Block ${blockHeight} not found in DB for ${chainId}`;
    }
    if (!block.transactionsCount) return;

    // const txs = await client.query.txsQuery(`tx.height=${blockHeight}`);
    const allTxs: LcdTxSearchTx[] = [];
    const allResults: LcdTxSearchResult[] = [];
    const url = `${config.lcd}/cosmos/tx/v1beta1/txs?${config.sdkVersion === 'pre-50' ? 'events' : 'query'}=tx.height%3D${blockHeight}&pagination.limit%3D100`;
    let pageUrl = url;
    while (true) {
        const {data} = await axios.get<LcdTxSearchResponse>(pageUrl);
        if (data.txs.length !== data.tx_responses.length) {
            throw `Block ${blockHeight} on ${chainId} has ${data.txs.length} txs but ${data.tx_responses.length} tx_results were returned by LCD.`
        }
        allTxs.push(...data.txs);
        allResults.push(...data.tx_responses);
        if (data.txs.length < 100) break;
        pageUrl = `${url}&pagination.offset=${allTxs.length}`
    }
    
    if (allTxs.length !== block.transactionsCount) throw `Block ${blockHeight} on ${chainId} has ${block.transactionsCount} transactions but ${allTxs.length} were returned by LCD.`


    for (const index in allTxs) {
        const tx = allTxs[index];
        const txResponse = allResults[index];

        // Generate list of signer addresses
        const signers: string[] = [];
        for (const signerInfo of (tx.auth_info?.signer_infos || [])) {
            if (signerInfo.public_key['@type'] === '/cosmos.crypto.secp256k1.PubKey') {
                const address = base64PubkeyToAddress((signerInfo.public_key as any).key, config.prefix)
                signers.push(address);
            }
            if (signerInfo.public_key['@type'] === '/cosmos.crypto.multisig.LegacyAminoPubKey') {
                for (const key of (signerInfo.public_key as any).public_keys) {
                    if (key['@type'] !== '/cosmos.crypto.secp256k1.PubKey') continue;
                    const address =  base64PubkeyToAddress(key.key, config.prefix);
                    signers.push(address);
                }
            }
        };

        // Generate list of sender addresses
        const senders: string[] = [];
        (tx.body?.messages || [])
            .filter((msg: any) => !!msg.sender)
            .forEach((msg: any) => {
                if (!senders.includes(msg.sender)) senders.push(msg.sender)
            });

        // Generate list of addresses that received coins
        // cmVjZWl2ZXI= is 'receiver'
        const coinReceivedEvents = txResponse.events.filter(e => e.type === 'coin_received' && e.attributes.find(a => a.key === 'cmVjZWl2ZXI='));
        const recipients = coinReceivedEvents.map(cr_event =>
            Buffer.from(
                cr_event.attributes.find(a => a.key === 'cmVjZWl2ZXI=')!.value,
                'base64'
            ).toString('utf8')
        )

        const executedContracts: string[] = [];
        if (config.features.includes('secretwasm')) {
            for (const msgLogs of txResponse.logs) {
                const wasmEvent = msgLogs.events.find(e => e.type === 'wasm');
                if (!wasmEvent) continue;
                for (const attribute of wasmEvent.attributes) {
                    if (attribute.key === 'contract_address') executedContracts.push(attribute.value);
                }
            }
        } else if (config.features.includes('cosmwasm')) {
            // TODO
        }

        const newTx: Transaction = {
            chainId,
            hash: txResponse.txhash,
            blockHeight,
            blockHash: block.hash,
            timestamp: new Date(txResponse.timestamp),
            signers,
            senders,
            recipients,
            executedContracts,
            feePayer: tx.auth_info?.fee?.payer || undefined,
            feeGranter: tx.auth_info?.fee?.granter || undefined,
            gasLimit: parseInt(txResponse.gas_wanted),
            gasUsed: parseInt(txResponse.gas_used),
            succeeded: txResponse.code === 0,
            transaction: {
                tx,
                tx_response: txResponse,
            },
        }
        await Transactions.findOneAndReplace({ hash: txResponse.txhash }, newTx, { upsert: true });
    }    
}

export default importTransactions;

export const addExecutedContractsToTransactions = async (chainId: string) => {
    try {
        console.log('Migrating transactions on', chainId)
        const config = getChainConfig(chainId);

        const txs = await Transactions.find({ chainId, executedContracts: { $exists: false } });
        
        for (const {_id, transaction} of txs) {
            const executedContracts: string[] = [];
            if (config.features.includes('secretwasm')) {
                for (const msgLogs of transaction.tx_response.logs) {
                    const wasmEvent = msgLogs.events.find(e => e.type === 'wasm');
                    if (!wasmEvent) continue;
                    for (const attribute of wasmEvent.attributes) {
                        if (attribute.key === 'contract_address') executedContracts.push(attribute.value);
                    }
                }
            } else if (config.features.includes('cosmwasm')) {
                // TODO
            }

            await Transactions.findByIdAndUpdate(_id, { executedContracts })
        }

        console.log('Finished migrating transactions on', chainId)
    } catch (err: any) {
        console.error(`Failed to update transactions for ${chainId}:`, err.toString())
    }
}