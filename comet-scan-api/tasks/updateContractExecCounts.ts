import Chains from "../config/chains";
import { ChainConfig } from "../interfaces/config.interface";
import Contracts from "../models/contracts.model";
import Transactions from "../models/transactions";

const contractExecCountsRunning = new Map<string, boolean>();
const updateExecutedCountsForChain = async (config: ChainConfig) => {

    // Check if this task is already running for this chain
    const running = contractExecCountsRunning.get(config.chainId);
    if (running) {
        console.log(`Contract executed counts task already running for ${config.chainId}`)
        return;
    }
    contractExecCountsRunning.set(config.chainId, true);

    console.log(`Updating contract executed counts on ${config.chainId}`)
    try {
        if (config.features.includes('secretwasm') || config.features.includes('cosmwasm')) {
            const contracts = await Contracts.find({ chainId: config.chainId }).lean();
            for (const {_id, contractAddress} of contracts) {
                const executions = await Transactions.find({ chainId: config.chainId, executedContracts: contractAddress }).countDocuments();
                await Contracts.findByIdAndUpdate(_id, { executions })
            }
        }
        console.log(`Done updating contract executed counts on ${config.chainId}`)
    } catch (err: any) {
        console.error(`Failed to update contract executed counts on ${config.chainId}:`, err, err.toString())
    } finally {
        contractExecCountsRunning.set(config.chainId, false);
    }
}

// Update counts for all chains in parallel
export const updateContractExecutedCountsForAllChains = async () => {
    const promises: Promise<void>[] = Chains.map(c => updateExecutedCountsForChain(c));
    await Promise.all(promises)
}