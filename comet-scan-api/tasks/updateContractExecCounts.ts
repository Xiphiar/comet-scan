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
                // TODO if pruning is enabled for a chain, this number will be the amount of executions within the pruning period.
                // If we add a `executionsBlockHeight` field to the contract object, we can count the number of executions since
                // that height and add it to the executions count instead of replacing, so we can keep a running total.
                // TODO also we need a way to count executions when there are multiple execute messages that execute the same contract,
                // in that case it should count as multiple executions but currently it would only increase the count by one.
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