import { getLatestBlock, getOldestBlock } from "../common/dbQueries";
import Chains from "../config/chains";
import { ChainConfig } from "../interfaces/config.interface";
import Transactions from "../models/transactions";
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