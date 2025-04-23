import { getLatestBlock, getOldestBlock } from "../common/dbQueries";
import Chains from "../config/chains";
import { ChainConfig } from "../interfaces/config.interface";
import Blocks from "../models/blocks";
import Transactions from "../models/transactions";
import { addVoteToDb, processTxMessages } from "./common";
import { getExecutedContractsForTx } from "./importTransactions";

const addExecutedContractsToTransactions = async (config: ChainConfig) => {
    if (!config.features.includes('secretwasm') && !config.features.includes('cosmwasm')) return;
    console.log(`Starting task "Add Executed Contracts to Transactions" on ${config.chainId}`)
    try {
        const latest = await getLatestBlock(config.chainId);
        const oldest = await getOldestBlock(config.chainId);
        if (!latest || !oldest) throw 'Unable to get latest and oldest block';
        console.log(`Block Range: ${oldest.height.toLocaleString()} - ${latest.height.toLocaleString()}`)

        const totalBlocks = latest.height - oldest.height;

        let current = oldest.height;
        while (current < latest.height) {
            if (current % 1000 === 0) console.log(((current - oldest.height) / totalBlocks * 100).toFixed(2), '%')
            const txs = await Transactions.find({ chainId: config.chainId, blockHeight: current }).lean();
            for (const tx of txs) {
                if (tx.executedContracts?.length) continue;
                const executedContracts = getExecutedContractsForTx(config, tx.transaction.tx_response);
                if (executedContracts.length) await Transactions.findByIdAndUpdate(tx._id, { $set: { executedContracts } })
            }
        current++;
        }


        console.log(`Finished task "Add Executed Contracts to Transactions" on ${config.chainId}`)
    } catch (err: any) {
        console.log(`Task "Add Executed Contracts to Transactions" on ${config.chainId} failed:`, err.toString())
    }
}

export const addExecutedContractsToTransactionsForAllChains = async () => {
    for (const chain of Chains) {
        await addExecutedContractsToTransactions(chain);
    }
}

const addBlockTimesToExistingBlocks = async (config: ChainConfig) => {
    console.log(`Starting task "Adding Block Times to Existing Blocks" on ${config.chainId}`)
    try {
        const latest = await getLatestBlock(config.chainId);
        const oldest = await getOldestBlock(config.chainId);
        if (!latest || !oldest) throw 'Unable to get latest and oldest block';
        console.log(`Block Range: ${oldest.height.toLocaleString()} - ${latest.height.toLocaleString()}`)

        const totalBlocks = latest.height - oldest.height;

        let currentHeight = oldest.height;
        let previousTimestamp: Date | undefined = undefined;
        while (currentHeight < latest.height) {
            if (currentHeight % 1000 === 0) console.log(((currentHeight - oldest.height) / totalBlocks * 100).toFixed(2), '%')

            const block = await Blocks.findOne({ chainId: config.chainId, height: currentHeight }).lean();
            if (!block) {
                currentHeight++;
                continue;
            }
            if (!previousTimestamp) {
                currentHeight++;
                previousTimestamp = block.timestamp;
                continue;
            }
            if (block.blockTime) {
                currentHeight++;
                previousTimestamp = block.timestamp;
                continue;
            }

            // Time since previous block in MS
            const blockTime = block.timestamp.valueOf() - previousTimestamp.valueOf();

            await Blocks.findByIdAndUpdate(block._id, { $set: { blockTime } });
            currentHeight++;
            previousTimestamp = block.timestamp;
        }
    } catch (err: any) {
        console.log(`Task "Adding Block Times to Existing Blocks" on ${config.chainId} failed:`, err.toString())
    }
};

export const addBlockTimesToExistingBlocksForAllChains = async () => {
    for (const chain of Chains) {
        await addBlockTimesToExistingBlocks(chain);
    }
}

const parseVotesFromTransactions = async ({chainId}: ChainConfig) => {
    try {
        const latest = await getLatestBlock(chainId);
        const oldest = await getOldestBlock(chainId);
        if (!latest) throw 'Could not find latest block';
        if (!oldest) throw 'Could not find oldest block';

        const total = latest.height - oldest.height;
        console.log(`Found ${total} blocks to process: ${oldest.height} - ${latest.height}`)

        // Loop through all blocks, oldest to newest since newer votes will overwrite previous votes
        for (let i = oldest.height; i <= latest.height; i++) {
            const percent = ((i - oldest.height) / total) * 100
            console.log('Parsing', chainId, i, `${percent.toFixed(2)}%`);

            const txs = await Transactions.find({ chainId, blockHeight: i }).lean();
            if (!txs.length) continue;

            for (const tx of txs) {
                await processTxMessages(tx);
            }

        }
    } catch (err: any) {
        console.error(`Migration Failed: Error parsing votes from transactions on ${chainId}:`, err, err.toString())
    }
}

export const parseVotesFromTransactionsForAllChains = async () => {
    for (const chain of Chains) {
        parseVotesFromTransactions(chain);
    }
}