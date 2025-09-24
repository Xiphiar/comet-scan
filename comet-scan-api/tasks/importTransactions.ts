import { base64PubkeyToAddress } from "secretjs";
import { Transaction, LcdTxSearchResponse, LcdTxSearchResult, LcdTxSearchTx, MsgLog, TxEvent, Block, ChainConfig } from "@comet-scan/types";
import Blocks from "../models/blocks";
import { getChainConfig } from "../config/chains";
import Transactions from "../models/transactions";
import { processBlock } from "./importBlocks";
import { getLcdClient } from "../config/clients";
import { processTxMessages } from "./common";

export const importTransactionsForBlock = async (chainId: string, blockHeight: number) => {
    // console.log(`Importing transactions for block ${blockHeight} on ${chainId}`)
    const config = getChainConfig(chainId);
    if (!config) throw `Config not found for ${chainId}`;

    const lcdClient = getLcdClient(chainId);

    let block: Block | null = await Blocks.findOne({ chainId, height: blockHeight }).lean();
    if (!block) {
        await processBlock(chainId, config.rpc, blockHeight);
        block = await Blocks.findOne({ chainId, height: blockHeight }).lean();
        // throw `Block ${blockHeight} not found in DB for ${chainId}`;
    }
    if (!block) {
        throw `Block ${blockHeight} not found in DB for ${chainId}`;
    }
    if (!block.transactionsCount) return;

    // const txs = await client.query.txsQuery(`tx.height=${blockHeight}`);

    const allTxs: LcdTxSearchTx[] = [];
    const allResults: LcdTxSearchResult[] = [];

    // Can cosmos stop changing the fucking API?!
    // Some chains use offset via `pagination.offset`, but some (cosmoshub-4) uses pages via `page` ?!?!?
    // What kind of bullshit is this?! Fuck it, we'll just pass both, fucking cosmos devs.
    // They better not fucking change the max or default limit to something lower than 100.
    let page = 1; // Page doesnt start at 0, page 1 is first page.
    let offset = 0;
    while (true) {
        if (offset > block.transactionsCount) throw `TX offset is greater than expected TX count. Did cosmos fuck with pagination again?`

        const data = await lcdClient.get<LcdTxSearchResponse>(
            `/cosmos/tx/v1beta1/txs`,
            {
                params: {
                    'events': config.sdkVersion === 'pre-50' ? 'tx.height=' + blockHeight : undefined,
                    'query': config.sdkVersion === 'pre-50' ? undefined : 'tx.height=' + blockHeight,
                    'pagination.offset': offset,
                    'page': page,
                }
            },
            (result) => {
                if (result.txs.length !== result.tx_responses.length) {
                    throw `Block ${blockHeight} on ${chainId}: TX query returned ${result.txs.length} txs but ${result.tx_responses.length} tx_results.`
                }

                if (block.transactionsCount > 0 && result.txs.length === 0) {
                    throw `Block ${blockHeight} on ${chainId}: TX query returned 0 txs but the block has ${block.transactionsCount} txs.`
                }

                return true;
            }
        );
        allTxs.push(...data.txs);
        allResults.push(...data.tx_responses);
        if (data.txs.length < 100) break;
        if (allTxs.length === block.transactionsCount) break;
        offset = allTxs.length;
        page++;
    }
    
    if (allTxs.length !== block.transactionsCount) throw `Block ${blockHeight} on ${chainId} has ${block.transactionsCount} transactions but ${allTxs.length} were returned by LCD.`


    for (const index in allTxs) {
        const tx = allTxs[index];
        const txResponse = allResults[index];

        // Spam filter
        if (tx.body.memo.toLowerCase().includes('airdrop')) continue;

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

        const executedContracts = getExecutedContractsForTx(config, txResponse);

        const messageTypes: string[] = [];
        for (const message of tx.body.messages) {
            if (!messageTypes.includes(message["@type"])) messageTypes.push(message["@type"])
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
            messageTypes,
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
        await processTxMessages(newTx);
    }    
}

// TODO If there are multiple messages executing the same contract(s), that should count as multiple executions.
// Need to figure out how to handle that case here and in updateContractExecCounts.ts
export const getExecutedContractsForTx = (
    config: ChainConfig,
    txResponse: {
        logs: MsgLog[]
        events: TxEvent[]
    }
): string[] => {
    const executedContracts: string[] = [];
    if (config.features.includes('secretwasm')) {
        if (txResponse.logs?.length) {
            for (const msgLogs of txResponse.logs) {
                const wasmEvent = msgLogs.events.find(e => e.type === 'wasm');
                if (!wasmEvent) continue;
                for (const attribute of wasmEvent.attributes) {
                    if (attribute.key === 'contract_address' && !executedContracts.includes(attribute.value)) executedContracts.push(attribute.value);
                }
            }
        } else {
            const wasmEvents = txResponse.events.filter(e => e.type === 'wasm');
            for (const wasmEvent of wasmEvents) {
                const addressAttributes = wasmEvent.attributes.filter(a => a.key === 'contract_address');
                addressAttributes.forEach(a => {
                    if (!executedContracts.includes(a.value)) executedContracts.push(a.value);
                })
            }
        }
    } else if (config.features.includes('cosmwasm')) {
        // Non-Secret chains should have logs available. Logs are sorted by message index and not base64 encoded,
        // so are easier to use. For now lets assume logs will be available. If we find a case where they are not,
        // we can add a case to use events instead.
        for (const msgLogs of txResponse.logs) {
            const executeEvents = msgLogs.events.filter(mle => mle.type === 'execute');
            for (const executeEvent of executeEvents) {
                const contractAddressAttributes = executeEvent.attributes.filter(a => a.key === '_contract_address' || a.key === 'contract_address');
                for (const {value} of contractAddressAttributes) {
                    if (!executedContracts.includes(value)) executedContracts.push(value);
                }
            }
        }
    }

    return executedContracts;
}