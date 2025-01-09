import { Transaction } from "../interfaces/models/transactions.interface";
import Blocks from "../models/blocks";
import KvStore from "../models/kv"
import { getChainConfig } from "../config/chains";
import axios, { AxiosError } from "axios";
import Transactions from "../models/transactions";
import { Block, Coin } from "../interfaces/models/blocks.interface";
import Accounts from "../models/accounts.model";
import { Account, Delegation, Unbonding } from "../interfaces/models/accounts.interface";
import { BaseAccountDetails, LcdAuthAccount } from "../interfaces/lcdAuthAccountResponse";
import { importTransactionsForBlock } from "./importTransactions";
import { processBlock } from "./importBlocks";
import { LcdBalance, LcdBalancesResponse } from "../interfaces/LcdBalanceResponse";
import { LcdDelegationsResponse, LcdUnbondingResponse } from "../interfaces/lcdBondingResponse";
import { ChainConfig } from "../interfaces/config.interface";
import { ibcDenom } from "secretjs";
import { getDenomTrace } from "../common/chainQueries";

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

        console.log(`Need to import accounts for ${highestBlockInDb.height - highestProcessed} blocks on ${chainId}`)

        while (highestProcessed < highestBlockInDb.height) {
            await importAccountsForBlock(chainId, highestProcessed + 1);
            highestProcessed++
            await KvStore.findByIdAndUpdate(document?._id, { value: highestProcessed.toString() })
        }
        console.log(`Done importing accounts on ${chainId}!`)
    } catch (err: any) {
        console.error(`Failed to import accounts on ${chainId}:`, err.toString())
        // console.trace(err);
    }
}

export const importAccountsForBlock = async (chainId: string, blockHeight: number) => {
    // console.log(`Importing accounts for block ${blockHeight} on ${chainId}`)
    const config = getChainConfig(chainId);
    if (!config) throw `Config not found for ${chainId}`;

    let block: Block | null = await Blocks.findOne({ chainId, height: blockHeight }).lean();
    if (!block) {
        await processBlock(chainId, config.rpc, blockHeight);
        block = await Blocks.findOne({ chainId, height: blockHeight }).lean();
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
            await importAccount(config.chainId, address, tx);
        }
    }
}

export const importAccount = async (chainId: string, address: string, tx?: Transaction): Promise<Account | null> => {
    const config = getChainConfig(chainId);
    if (!config) throw `Config not found for ${chainId}`;

    try {
        const existingAccount = await Accounts.findOne({ chainId, address }, { _id: false, __v: false }).lean();
        if (existingAccount) {
            let update: any = {};

            // Update firstSeen if this block is earlier than the previous value
            if (tx && tx.blockHeight < (existingAccount.firstTransactionBlock || 0)) update = {
                ...update,
                firstTransactionHash: tx.hash,
                firstTransactionBlock: tx.blockHeight,
                firstTransactionTime: tx.timestamp,
            }

            // Update current balances if this block is later than the previous balance update height
            if ((tx?.timestamp || new Date()).valueOf() > existingAccount.balanceUpdateTime.valueOf()) {
                const { balanceUpdateTime, delegations, heldBalanceInBondingDenom, totalBalanceInBondingDenom, totalDelegatedBalance, totalUnbondingBalance, unbondings, nativeAssets } = await getBalancesForAccount(config, address);

                update = {
                    ...update,
                    heldBalanceInBondingDenom,
                    delegations,
                    totalDelegatedBalance,
                    unbondings,
                    totalUnbondingBalance,
                    totalBalanceInBondingDenom,
                    balanceUpdateTime,
                    nativeAssets
                }
            }

            if (!Object.keys(update).length) return existingAccount;

            const updatedAccount = await Accounts.findOneAndUpdate({ chainId, address }, { $set: update }, { new: true, lean: true });
            return updatedAccount!;
        } else {
            // otherwise add non-existant accounts
            const {data} = await axios.get<LcdAuthAccount>(`${config.lcd}/cosmos/auth/v1beta1/accounts/${address}`);
            if (data.account["@type"] !== '/cosmos.auth.v1beta1.BaseAccount' && data.account["@type"] !== '/cosmos.auth.v1beta1.ModuleAccount') {
                console.log(`Found unknown account type ${data.account["@type"]} on ${chainId}`);
                return null;
            }
            const baseAccount: BaseAccountDetails = data.account["@type"] === '/cosmos.auth.v1beta1.ModuleAccount' ? data.account.base_account : data.account;
            const { balanceUpdateTime, delegations, heldBalanceInBondingDenom, totalBalanceInBondingDenom, totalDelegatedBalance, totalUnbondingBalance, unbondings, nativeAssets } = await getBalancesForAccount(config, address);

            const newAccount: Account = {
                chainId,
                address,
                accountType: data.account["@type"],
                pubKeyType: baseAccount.pub_key?.["@type"],
                pubKeyBase64: baseAccount.pub_key?.key,
                accountNumber: baseAccount.account_number,
                label: undefined,
                
                firstTransactionHash: tx?.hash,
                firstTransactionBlock: tx?.blockHeight,
                firstTransactionTime: tx?.timestamp,

                heldBalanceInBondingDenom,
                delegations,
                totalDelegatedBalance,
                unbondings,
                totalUnbondingBalance,
                totalBalanceInBondingDenom,
                balanceUpdateTime,

                nativeAssets,
                tokenAssets: [],
            };
            const createdAccount = await Accounts.create(newAccount);
            const { _id, ...clean } = createdAccount.toObject();
            return clean;
        }
    } catch (err: any) {
        console.error(`Failed to import account ${address} on ${chainId}:`, err.toString())
        return null;
    }
}

export default importAccountsForChain;

interface AccountBalances {
    heldBalanceInBondingDenom: string;
    delegations: Delegation[];
    totalDelegatedBalance: string;
    unbondings: Unbonding[];
    totalUnbondingBalance: string;
    totalBalanceInBondingDenom: string;
    balanceUpdateTime: Date;
    nativeAssets: Coin[];
}
const getBalancesForAccount = async (config: ChainConfig, address: string): Promise<AccountBalances> => {
    const balanceUpdateTime = new Date();
    const {data: balanceResponse} = await axios.get<LcdBalance>(`${config.lcd}/cosmos/bank/v1beta1/balances/${address}/by_denom?denom=${config.bondingDenom}`);
    const {data: allBalancesResponse} = await axios.get<LcdBalancesResponse>(`${config.lcd}/cosmos/bank/v1beta1/balances/${address}`);
    const { data: _delegations } = await axios.get<LcdDelegationsResponse>(`${config.lcd}/cosmos/staking/v1beta1/delegations/${address}`);
    const { data: _unbondings } = await axios.get<LcdUnbondingResponse>(`${config.lcd}/cosmos/staking/v1beta1/delegators/${address}/unbonding_delegations`);

    const delegations = _delegations.delegation_responses.map(d => {
        return {
           validatorAddress: d.delegation.validator_address,
           shares: d.delegation.shares,
           amount: d.balance.amount, 
        }
    })
    const totalDelegatedBalance = delegations.reduce(
        (sum, delegation) => sum + BigInt(delegation.amount),
        0n,
    )

    const unbondings: Unbonding[] = [];
    for (const u of _unbondings.unbonding_responses) {
        for (const entry of u.entries) {
            unbondings.push({
                validatorAddress: u.validator_address,
                amount: entry.balance,
                creationHeight: entry.creation_height,
                completionTime: new Date(entry.completion_time)
            })
        }
    }
    const totalUnbondingBalance = unbondings.reduce(
        (sum, unbonding) => sum + BigInt(unbonding.amount),
        0n,
    )

    const totalbalance = totalDelegatedBalance + totalUnbondingBalance + BigInt(balanceResponse.balance.amount);

    const nativeAssets: Coin[] = [];
    for (const coin of allBalancesResponse.balances) {
        if (coin.denom.toLowerCase().startsWith('ibc/')) {
            // Trace denom
            const denom = await getDenomTrace(config.chainId, coin.denom);
            nativeAssets.push({
                denom,
                amount: coin.amount,
            })
        } else {
            nativeAssets.push(coin);
        }
    }

    return {
        heldBalanceInBondingDenom: balanceResponse.balance.amount,
        delegations,
        totalDelegatedBalance: totalDelegatedBalance.toString(),
        unbondings,
        totalUnbondingBalance: totalUnbondingBalance.toString(),
        totalBalanceInBondingDenom: totalbalance.toString(),
        balanceUpdateTime: balanceUpdateTime,
        nativeAssets,
    }
}