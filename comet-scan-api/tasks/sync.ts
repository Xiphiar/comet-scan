import axios from "axios";
import { ChainConfig, RpcStatusResponse } from "@comet-scan/types";
import Blocks from "../models/blocks";
import { processBlock } from "./importBlocks"
import { importTransactionsForBlock } from "./importTransactions";
import Chains from "../config/chains";
import KvStore from "../models/kv";

const isSyncing = new Map<string, boolean>();

// Imports block, txs, and updates accounts in one function
export const syncBlock = async (config: ChainConfig, height: number) => {
    console.log(`Syncing block ${height} on ${config.chainId}`)
    await processBlock(config.chainId, config.rpc, height);

    console.log(`Syncing transactions for block ${height} on ${config.chainId}`)
    await importTransactionsForBlock(config.chainId, height);
}

const syncChain = async (config: ChainConfig) => {
    const {chainId, rpc, startHeight: _startHeight} = config;
    console.log(`Starting sync task for ${chainId}`)
    const running = isSyncing.get(chainId);
    if (running) {
        console.log(`Sync task already running for ${chainId}`)
        return;
    }
    isSyncing.set(chainId, true);

    try {
        const highestInDb = await Blocks.findOne({ chainId }).sort('-height').lean();
        

        const {data: currentStatus} = await axios.get<RpcStatusResponse>(`${rpc}/status`);
        if (currentStatus.result.node_info.network !== chainId) throw `Status returned by RPC does not belong to ${chainId}`
        const rpcEarliestHeight = parseInt(currentStatus.result.sync_info.earliest_block_height);
        const rpcLatestHeight = parseInt(currentStatus.result.sync_info.latest_block_height);
        const startHeight = highestInDb?.height || _startHeight || rpcEarliestHeight;
        if (rpcEarliestHeight > startHeight) throw `RPC earliest block ${rpcEarliestHeight} is higher than start height ${startHeight}`;

        const toFetch: number[] = [];
        let heightToFetch = startHeight;
        while (heightToFetch <= rpcLatestHeight) {
            toFetch.push(heightToFetch)
            heightToFetch++;
        }

        console.log(`Syncing ${toFetch.length} blocks on ${chainId}`)
        for (const h of toFetch) {
            await syncBlock(config, h)
        }

        console.log(`Sync task finished for ${chainId}!`)
    } catch (err: any) {
        console.error(`Sync error on ${chainId}: ${err.toString()}`, err)
    } finally {
        isSyncing.set(chainId, false);
    }
}

export const syncAllChains = async () => {
    console.log('\n\n')
    const promises: Promise<void>[] = Chains.map(c => syncChain(c));
    await Promise.all(promises)
    console.log('\n\n')
}

// const acc_key = 'accounts-import-processed-block'
// const tx_key = 'txs-import-processed-block'
// export const syncMigrate = async () => {
//     for (const chain of Chains) {
//         console.log(`Migrate Sync ${chain.chainId}`)
//         const highestBlock = (await Blocks.findOne({ chainId: chain.chainId }).sort('-height').lean())?.height;
//         if (!highestBlock) continue;
//         const highestAccBlock = (await KvStore.findOne({ chainId: chain.chainId, key: acc_key }).lean())?.value;
//         const highestTxBlock = (await KvStore.findOne({ chainId: chain.chainId, key: tx_key }).lean())?.value;

//         let oldest: number = highestBlock;
//         if (highestTxBlock && parseInt(highestTxBlock) < oldest) oldest = parseInt(highestTxBlock);
//         if (highestAccBlock && parseInt(highestAccBlock) < oldest) oldest = parseInt(highestAccBlock);

//         let newest: number = highestBlock;
//         if (highestTxBlock && parseInt(highestTxBlock) > newest) newest = parseInt(highestTxBlock);
//         if (highestAccBlock && parseInt(highestAccBlock) > newest) newest = parseInt(highestAccBlock);

//         console.log({
//             chainId: chain.chainId,
//             highestBlock,
//             highestAccBlock,
//             highestTxBlock,
//             oldest,
//             newest
//         })


//         const toFetch: number[] = [];
//         let heightToFetch = oldest;
//         while (heightToFetch <= newest) {
//             toFetch.push(heightToFetch)
//             heightToFetch++;
//         }
//         console.log(`Need to update ${toFetch.length} blocks on ${chain.chainId}`)

//         for (const h of toFetch) {
//             await syncBlock(chain, h)
//         }
//         await KvStore.findOneAndDelete({ key: tx_key })
//         await KvStore.findOneAndDelete({ key: acc_key })
//         console.log(`Migrate Sync Finished ${chain.chainId}`)
//     }

    
//     console.log(`Migrate Sync Complete`)
// }