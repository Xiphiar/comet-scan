import Chains from "../config/chains";
import { ChainConfig } from "../interfaces/config.interface";
import importAccountsForChain from "./importAccounts";
import importBlocks from "./importBlocks";
import importTransactions from "./importTransactions";

const importRunning = new Map<string, boolean>();

const runImportTasksForChain = async (chain: ChainConfig) => {
    console.log(`Starting import tasks for ${chain.chainId}`)
    const running = importRunning.get(chain.chainId);
    if (running) {
        console.log(`Import task already running for ${chain.chainId}`)
        return;
    }
    importRunning.set(chain.chainId, true);

    try {
        await importBlocks(chain);
        await importTransactions(chain.chainId);
        await importAccountsForChain(chain.chainId);
    } catch (err: any) {
        console.error(`Import tasks error on ${chain.chainId}: ${err.toString()}`)
    } finally {
        importRunning.set(chain.chainId, false);
    }
}

export const runImportTasks = async () => {
    console.log('\n\n')
    const promises: Promise<void>[] = Chains.map(c => runImportTasksForChain(c));
    await Promise.all(promises)
    console.log('\n\n')
}