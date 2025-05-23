import { Transaction } from "../interfaces/models/transactions.interface";
import Blocks from "../models/blocks";
import { getChainConfig } from "../config/chains";
import Transactions from "../models/transactions";
import { Block, Coin } from "../interfaces/models/blocks.interface";
import Accounts from "../models/accounts.model";
import { Account, Delegation, Unbonding } from "../interfaces/models/accounts.interface";
import { BaseAccountDetails, LcdAuthAccount, ModuleAccount, v1beta1ContinuousVestingAccount } from "../interfaces/lcdAuthAccountResponse";
import { importTransactionsForBlock } from "./importTransactions";
import { LcdBalance, LcdBalancesResponse } from "../interfaces/LcdBalanceResponse";
import { LcdDelegationsResponse, LcdUnbondingResponse } from "../interfaces/lcdBondingResponse";
import { ChainConfig } from "../interfaces/config.interface";
import { getDenomTrace } from "../common/chainQueries";
import KvStore from "../models/kv";
import { syncBlock } from "./sync";
import { getLcdClient } from "../config/clients";

const key = 'accounts-import-processed-block'
export const updateAccountsV2 = async ({chainId}: ChainConfig) => {
    console.log(`Updating accounts on ${chainId}...`)
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

    // Get a list of unique accounts in this range
    const updates: AddressUpdate[] = [];
    while (highestProcessed < highestBlockInDb.height) {
        // Get list of unique accounts in the TX
        const accounts = await getAccountsForBlock(chainId, highestProcessed + 1);

        // Add accounts to the updates array if it is not already present
        for (const account of accounts){
            if (updates.findIndex(a => a.address === account.address) === -1) {
                updates.push(account)
            }
        }
        highestProcessed++
    }
    
    console.log(`Need to update ${updates.length} accounts on ${chainId}`)
    for (const i in updates){
        const {address, tx} = updates[i];
        if (parseInt(i) % 10 === 0) console.log(`${parseInt(i) / updates.length * 100}%`)
        await importAccount(chainId, address, tx);
    }
    await KvStore.findByIdAndUpdate(document?._id, { value: highestProcessed.toString() })

    console.log('Done updating accounts on', chainId)
}

type AddressUpdate = {
    address: string;
    tx: Transaction;
}
export const getAccountsForBlock = async (chainId: string, blockHeight: number): Promise<AddressUpdate[]> => {
    const config = getChainConfig(chainId);
    if (!config) throw `Config not found for ${chainId}`;

    let block: Block | null = await Blocks.findOne({ chainId, height: blockHeight }).lean();
    if (!block) {
        await syncBlock(config, blockHeight);
        block = await Blocks.findOne({ chainId, height: blockHeight }).lean();
    }
    if (!block) {
        throw `Block ${blockHeight} not found in DB for ${chainId}`;
    }
    if (!block.transactionsCount) return [];

    // get block TXs from DB
    let txs: Transaction[] = await Transactions.find({ chainId, blockHeight }).lean();
    if (txs.length !== block.transactionsCount) {
        await importTransactionsForBlock(chainId, blockHeight);
        txs = await Transactions.find({ chainId, blockHeight }).lean();
        // throw `Transactions not yet imported on block ${blockHeight} on ${chainId}`
    }

    const addressesToUpdate: AddressUpdate[] = [];
    for (const tx of txs) {

        // Spam filter
        if (tx.transaction.tx.body.memo.toLowerCase().includes('airdrop')) continue;

        const allAddresses = [...tx.signers, ...tx.senders, ...tx.recipients]
        for (const addr of allAddresses) {
            if (addressesToUpdate.findIndex(a => a.address === addr) === -1) addressesToUpdate.push({
                address: addr,
                tx
            })
        };
    }

    return addressesToUpdate;
}

// export const importAccountsForBlock = async (chainId: string, blockHeight: number) => {
//     // console.log(`Importing accounts for block ${blockHeight} on ${chainId}`)
//     const config = getChainConfig(chainId);
//     if (!config) throw `Config not found for ${chainId}`;

//     let block: Block | null = await Blocks.findOne({ chainId, height: blockHeight }).lean();
//     if (!block) {
//         await processBlock(chainId, config.rpc, blockHeight);
//         block = await Blocks.findOne({ chainId, height: blockHeight }).lean();
//     }
//     if (!block) {
//         throw `Block ${blockHeight} not found in DB for ${chainId}`;
//     }
//     if (!block.transactionsCount) return;

//     // get block TXs from DB
//     let txs: Transaction[] = await Transactions.find({ chainId, blockHeight }).lean();
//     if (txs.length !== block.transactionsCount) {
//         await importTransactionsForBlock(chainId, blockHeight);
//         txs = await Transactions.find({ chainId, blockHeight }).lean();
//         // throw `Transactions not yet imported on block ${blockHeight} on ${chainId}`
//     }

//     const addressesToUpdate: {
//         address: string,
//         tx: Transaction,
//     }[] = [];
//     for (const tx of txs) {
//         const allAddresses = [...tx.signers, ...tx.senders, ...tx.recipients]
//         for (const addr of allAddresses) {
//             // if (!addresses.includes(addr)) addresses.push(addr);
//             if (addressesToUpdate.findIndex(a => a.address === addr) === -1) addressesToUpdate.push({
//                 address: addr,
//                 tx
//             })
//         };
//     }

//     // for (const {address, tx} of addressesToUpdate) {
//     //     await importAccount(config.chainId, address, tx);
//     // }

//     // Needs to have a lot of concurrency to keep up on some chains e.g. sentinel
//     const mapper = async (
//         {address, tx}:
//         {
//             address: string,
//             tx: Transaction,
//         }
//     ) => await importAccount(config.chainId, address, tx);
//     await pMap(addressesToUpdate, mapper, {concurrency: 16});
// }

export const importAccount = async (chainId: string, address: string, tx?: Transaction): Promise<Account | null> => {
    const config = getChainConfig(chainId);
    if (!config) throw `Config not found for ${chainId}`;

    const lcdClient = getLcdClient(chainId);

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

            const updatedAccount = await Accounts.findOneAndUpdate(
                { chainId, address }, // Filter
                { $set: update }, // Update
                { new: true, lean: true, projection: {_id: false, __v: false} }
            );
            return updatedAccount!;
        } else {
            // otherwise add non-existant accounts
            // TODO sometimes this will return 404 if the account hasn't made a tx (but has received), make the auth fields optional and import just balances.
            const data = await lcdClient.get<LcdAuthAccount>(`/cosmos/auth/v1beta1/accounts/${address}`);

            let baseAccount: BaseAccountDetails;
            switch (data.account["@type"]) {
                case '/cosmos.auth.v1beta1.BaseAccount':
                    baseAccount = data.account
                    break;
                case '/cosmos.auth.v1beta1.ModuleAccount':
                    baseAccount = (data.account as ModuleAccount).base_account
                    break;
                case '/cosmos.vesting.v1beta1.ContinuousVestingAccount':
                    baseAccount = (data.account as v1beta1ContinuousVestingAccount).base_vesting_account.base_account;
                    break;
                default :
                    console.log(`Found unknown account type ${data.account["@type"]} on ${chainId}`);
                    return null;
            }
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
            const createdAccount = await Accounts.findOneAndReplace(
                { chainId, address },
                newAccount,
                { upsert: true, new: true, lean: true, projection: {_id: false, __v: false} }
            );
            return createdAccount;
        }
    } catch (err: any) {
        console.error(`Failed to import account ${address} on ${chainId}:`, err.toString())
        if (err.toString().includes('Request failed with status code 404')) return null
        else throw new Error(`Failed to import account ${address} on ${chainId}: ${err.toString()}`)
    }
}

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
    const lcdClient = getLcdClient(config.chainId);

    const balanceUpdateTime = new Date();
    const balanceResponse = await lcdClient.get<LcdBalance>(`/cosmos/bank/v1beta1/balances/${address}/by_denom?denom=${config.bondingDenom}`);
    const allBalancesResponse = await lcdClient.get<LcdBalancesResponse>(`/cosmos/bank/v1beta1/balances/${address}`);
    const _delegations = await lcdClient.get<LcdDelegationsResponse>(`/cosmos/staking/v1beta1/delegations/${address}`);
    const _unbondings = await lcdClient.get<LcdUnbondingResponse>(`/cosmos/staking/v1beta1/delegators/${address}/unbonding_delegations`);

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
        // Only denom trace if the chain does NOT have the `no_denom_trace` feature
        if (coin.denom.toLowerCase().startsWith('ibc/') && !config.features.includes('no_denom_trace')) {
            try {
                // Trace denom
                const denom = await getDenomTrace(config.chainId, coin.denom);
                nativeAssets.push({
                    denom,
                    amount: coin.amount,
                })
            } catch (err) {
                // Do nothing, IBC assets aren't critical
            }
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