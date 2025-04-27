import { getSecretNftContractInfo, getSecretNftTokenCount, getSecretTokenInfo, getSecretTokenPermitSupport } from "../common/chainQueries";
import { getSecretWasmClient } from "../common/cosmWasmClient";
import Chains, { getChainConfig } from "../config/chains";
import { ChainConfig } from "../interfaces/config.interface";
import { WasmCode } from "../interfaces/models/codes.interface";
import { WasmContract } from "../interfaces/models/contracts.interface";
import { NftContractInfoResponse, TokenInfoResponse } from "../interfaces/secretQueryResponses";
import Codes from "../models/codes.model";
import Contracts from "../models/contracts.model";
import Transactions from "../models/transactions";
import { LcdCosmWasmCodesResponse, LcdCosmWasmContractInfoResponse } from "../interfaces/lcdCosmwasmResponses";
import { getLcdClient } from "../config/clients";
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