import Chains from "../config/chains";
import { ChainConfig } from "@comet-scan/types";
import { updateCosmWasmContracts } from './cosmwasm.tasks'
import { updateSecretWasmContracts } from './secretwasm.tasks'

const contractImportRunning = new Map<string, boolean>();
const updateContractsForChain = async (config: ChainConfig) => {
    const running = contractImportRunning.get(config.chainId);
    if (running) {
        console.log(`Contract import task already running for ${config.chainId}`)
        return;
    }
    contractImportRunning.set(config.chainId, true);

    try {
        if (config.features.includes('secretwasm')) {
            await updateSecretWasmContracts(config);
        } else if (config.features.includes('cosmwasm')) {
            await updateCosmWasmContracts(config);
        } else {
            console.log(`Skipping contract updates on ${config.chainId}`)
        }

        console.log('Done importing contracts on', config.chainId);
    } catch (err: any) {
        console.error('Failed to import contracts on', config.chainId, err.toString())
        console.trace(err)
    } finally {
        contractImportRunning.set(config.chainId, false);
    }
}

export const updateContractsForAllChains = async () => {
    const promises: Promise<void>[] = Chains.map(c => updateContractsForChain(c));
    await Promise.all(promises)
}