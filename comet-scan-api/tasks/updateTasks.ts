import Chains from "../config/chains";
import { ChainConfig } from "../interfaces/config.interface";
import importAccountsForChain from "./importAccounts";
import updateContractsForChain from "./importContracts";
import { updateProposalsForChain } from "./updateProposals";
import { updateValidatorsForChain } from "./updateValidators";

const updateRunning = new Map<string, boolean>();

const runUpdateTasksForChain = async (chain: ChainConfig) => {
    const running = updateRunning.get(chain.chainId);
    if (running) {
        console.log(`Update task already running for ${chain.chainId}`)
        return;
    }
    updateRunning.set(chain.chainId, true);

    try {
        await updateValidatorsForChain(chain);
        await updateProposalsForChain(chain);
    } catch (err: any) {
        console.error(`Update tasks error on ${chain.chainId}: ${err.toString()}`)
    } finally {
        updateRunning.set(chain.chainId, false);
    }
}

export const runUpdateTasks = async () => {
    console.log('\n\n')
    const promises: Promise<void>[] = Chains.map(c => runUpdateTasksForChain(c));
    await Promise.all(promises)
    console.log('\n\n')
}