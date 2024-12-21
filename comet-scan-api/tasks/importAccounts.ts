import { base64PubkeyToAddress, pubkeyToAddress } from "secretjs";
import { Transaction } from "../interfaces/models/transactions.interface";
import Blocks from "../models/blocks";
import KvStore, { KV } from "../models/kv"
import { getChainConfig } from "../config/chains";
import axios, { Axios } from "axios";
import { LcdTxSearchResponse } from "../interfaces/lcdTxResponse";
import Transactions from "../models/transactions";
import { Block } from "../interfaces/models/blocks.interface";
import Accounts from "../models/accounts.model";
import { Account } from "../interfaces/models/accounts.interface";
import { BaseAccountDetails, LcdAuthAccount } from "../interfaces/lcdAuthAccountResponse";
import { importTransactionsForBlock } from "./importTransactions";
import { processBlock } from "./importBlocks";
import { LcdBalance } from "../interfaces/LcdBalanceResponse";

const key = 'accounts-import-processed-block'

const importAccountsForChain = async (chainId: string) => {
    try {
        console.log(`Importing accounts on ${chainId}...`)
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

        while (highestProcessed < highestBlockInDb.height) {
            await importAccountsForBlock(chainId, highestProcessed + 1);
            highestProcessed++
            await KvStore.findByIdAndUpdate(document?._id, { value: highestProcessed.toString() })
        }
        console.log(`Done importing accounts on ${chainId}!`)
    } catch (err: any) {
        console.error(`Failed to import accounts on ${chainId}:`, err.toString())
    }
}

export const importAccountsForBlock = async (chainId: string, blockHeight: number) => {
    // console.log(`Importing accounts for block ${blockHeight} on ${chainId}`)
    const config = getChainConfig(chainId);
    let block: Block | null = await Blocks.findOne({ height: blockHeight }).lean();
    if (!block) {
        await processBlock(chainId, config.rpc, blockHeight);
        block = await Blocks.findOne({ height: blockHeight }).lean();
    }
    if (!block) {
        throw `Block ${blockHeight} not found in DB for ${chainId}`;
    }
    if (!block.transactionsCount) return;

    // get block TXs from DB
    let txs: Transaction[] = await Transactions.find({ chainId, blockHeight }).lean();
    if (txs.length !== block.transactionsCount) {
        await importTransactionsForBlock(chainId, blockHeight);
        txs = await Transactions.find({ chainId, blockHeight }).lean();
        // throw `Transactions not yet imported on block ${blockHeight} on ${chainId}`
    }

    for (const tx of txs) {
        const allAddresses = [...tx.signers, ...tx.senders, ...tx.recipients]
        const addresses: string[] = [];
        for (const addr of allAddresses) {
            if (!addresses.includes(addr)) addresses.push(addr);
        };

        for (const address of addresses) {
            const existingAccount = await Accounts.findOne({ chainId, address }).lean();
            if (existingAccount) {
                let update: any = {};

                // Update firstSeen if this block is earlier than the previous value
                if (blockHeight < existingAccount.firstTransactionBlock) update = {
                    ...update,
                    firstTransactionHash: tx.hash,
                    firstTransactionBlock: tx.blockHeight,
                    firstTransactionTime: tx.timestamp,
                }

                // Update current balance if this block is later than the previous balance update height
                if (block.timestamp.valueOf() > existingAccount.balanceUpdateTime.valueOf()) {
                    const balanceUpdateTime = new Date();
                    const {data: balanceResponse} = await axios.get<LcdBalance>(`${config.lcd}/cosmos/bank/v1beta1/balances/${address}/by_denom?denom=${config.bondingDenom}`);
                    update = {
                        ...update,
                        balanceInBondingDenom: balanceResponse.balance.amount,
                        balanceUpdateTime,
                    }
                }

                await Accounts.findByIdAndUpdate(existingAccount._id, update);
            } else if (!existingAccount) {
                // otherwise add non-existant accounts
                const {data} = await axios.get<LcdAuthAccount>(`${config.lcd}/cosmos/auth/v1beta1/accounts/${address}`);
                const baseAccount: BaseAccountDetails = data.account["@type"] === '/cosmos.auth.v1beta1.ModuleAccount' ? data.account.base_account : data.account;
                const balanceUpdateTime = new Date();
                const {data: balanceResponse} = await axios.get<LcdBalance>(`${config.lcd}/cosmos/bank/v1beta1/balances/${address}/by_denom?denom=${config.bondingDenom}`);

                
                const newAccount: Account = {
                    chainId,
                    address,
                    accountType: data.account["@type"],
                    pubKeyType: baseAccount.pub_key?.["@type"],
                    pubKeyBase64: baseAccount.pub_key?.key,
                    accountNumber: baseAccount.account_number,
                    label: undefined,
                    
                    firstTransactionHash: tx.hash,
                    firstTransactionBlock: tx.blockHeight,
                    firstTransactionTime: tx.timestamp,

                    balanceInBondingDenom: balanceResponse.balance.amount,
                    balanceUpdateTime: balanceUpdateTime,
                };
                await Accounts.create(newAccount);
            }
        }
    }
}

export default importAccountsForChain;