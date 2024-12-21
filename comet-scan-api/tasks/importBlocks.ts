import axios from "axios";
import Blocks from "../models/blocks";
import RpcStatusResponse from "../interfaces/rpcStatusResponse";
import pMap from "p-map";
import { Coin, decodeTxRaw } from "@cosmjs/proto-signing";
import { importTransactionsForBlock } from "./importTransactions";
import { RpcBlockResponse } from "../interfaces/rpcBlockResponse";
import { RpcBlockResultsResponse } from "../interfaces/rpcBlockResultsResponse";
import { Block } from "../interfaces/models/blocks.interface";
import { ChainConfig } from "../interfaces/config.interface";

// const limit = pLimit(10);

const importBlocks = async ({chainId, rpc, startHeight: _startHeight = 0}: ChainConfig) => {
    console.log(`Starting block import on ${chainId}`);
    try {
        let startHeight = _startHeight;
        let highestInDb = await Blocks.findOne({ chainId }).sort('-height').lean();
        if (highestInDb) startHeight = highestInDb.height + 1;

        const {data: currentStatus} = await axios.get<RpcStatusResponse>(`${rpc}/status`);
        if (currentStatus.result.node_info.network !== chainId) throw `Status returned by RPC does not belong to ${chainId}`
        const rpcEarliestHeight = parseInt(currentStatus.result.sync_info.earliest_block_height);
        const rpcLatestHeight = parseInt(currentStatus.result.sync_info.latest_block_height);
        if (rpcEarliestHeight > startHeight) throw `RPC earliest block ${rpcEarliestHeight} is higher than star height ${startHeight}`;

        const toFetch: number[] = [];
        let heightToFetch = startHeight;
        while (heightToFetch <= rpcLatestHeight) {
            toFetch.push(heightToFetch)
            heightToFetch++;
        }
        await processList(toFetch, chainId, rpc);


        // Find missing heights since configures _startHeight
        // console.log('Looking for missing blocks...')
        highestInDb = await Blocks.findOne({ chainId }).sort('-height').lean();
        // console.log('Heighest height after import:', highestInDb?.height);
        const _existingHeights = await Blocks.aggregate([
            { 
                $group: { 
                    _id: null, 
                    heights: { $push: "$height" } 
                }
            },
            { 
                $addFields: { 
                    // missing: { $setDifference: [ { $range: [ 15321001, 17111985 ] }, "$nos" ] } 
                    // range: { $range: [ _startHeight, highestInDb?.height ] }, 
                } 
            }
        ])
        const existingHeights: number[] = _existingHeights[0].heights;
        const missingHeights: number[] = [];
        for (let i = _startHeight; i < (highestInDb?.height || _startHeight+1); i++) {
            if (!existingHeights.includes(i)) missingHeights.push(i)
        }
        // console.log('Missing', missingHeights.length, 'blocks!')
        await processList(missingHeights, chainId, rpc);

        console.log(`Done importing blocks on ${chainId}!`)

    } catch (err: unknown) {
        console.log(`Error importing blocks for chain ${chainId}:`, err?.toString?.() || err)
    }
}

const processList = async (toFetch: number[], chainId: string, rpc: string) => {
    console.log(`Importing ${toFetch.length} blocks on ${chainId}`)
    const mapper = async (h: number) => await processBlock(chainId, rpc, h);
    await pMap(toFetch, mapper, {concurrency: 4});
}


export const processBlock = async (chainId: string, rpc: string, heightToFetch: number) => {
    // try {
        // console.log(`Fetching block ${heightToFetch} on ${chainId}`)
        const {data: block} = await axios.get<RpcBlockResponse>(`${rpc}/block`, {
            params: {
                height: heightToFetch
            }
        });
        if (block.result.block.header.chain_id !== chainId) throw `Block returned by RPC does not belong to ${chainId}`
        const {data: blockResults} = await axios.get<RpcBlockResultsResponse>(`${rpc}/block_results`, {
            params: {
                height: heightToFetch
            }
        });

        const txs_results = blockResults.result.txs_results || [];
        const totalGasWanted = txs_results.reduce((sum, tx_result) => sum + parseInt(tx_result.gas_wanted), 0);
        const totalGasUsed = txs_results.reduce((sum, tx_result) => sum + parseInt(tx_result.gas_used), 0);
        const decodedTransactions = block.result.block.data.txs.map(tx => decodeTxRaw(Buffer.from(tx, 'base64')));
        const totalFeesMap = new Map<string, bigint>();
        decodedTransactions.forEach(tx => {
            if (!tx.authInfo.fee) return;
            tx.authInfo.fee.amount.forEach(feeCoin => {
                const existingAmount = totalFeesMap.get(feeCoin.denom) || 0n;
                totalFeesMap.set(feeCoin.denom, existingAmount + BigInt(feeCoin.amount));
            })
        })
        const totalFees: Coin[] = [];
        totalFeesMap.forEach((amount, denom) => {
            totalFees.push({
                amount: amount.toString(),
                denom,
            });
        })

        const newDocument: Block = {
            chainId,
            height: heightToFetch,
            hash: block.result.block_id.hash,
            timestamp: new Date(block.result.block.header.time),
            block,
            blockResults,
            // transactions: decodedTransactions,
            transactionsCount: txs_results.length,
            totalGasWanted,
            totalGasUsed,
            totalFees,
        };

        await Blocks.findOneAndReplace({ chainId, height: heightToFetch }, newDocument, { upsert: true });
        // await importTransactionsForBlock(chainId, heightToFetch);

    // } catch(err: any) {
    //     console.error(`Error processing block ${heightToFetch} on ${chainId}:`, err.toString())
    // }
}

export default importBlocks;