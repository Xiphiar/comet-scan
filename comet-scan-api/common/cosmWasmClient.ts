import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { SecretNetworkClient } from "secretjs";
import Chains from "../config/chains";

const cosmwasmClientCache = new Map<string, CosmWasmClient>();
const secretWasmClientCache = new Map<string, SecretNetworkClient>();

export const getCosmwasmClient = async (rpc: string): Promise<CosmWasmClient> => {
    const cached = cosmwasmClientCache.get(rpc);
    if (cached) return cached;

    const client = await CosmWasmClient.connect(rpc);
    cosmwasmClientCache.set(rpc, client);
    return client;
}

export const getSecretWasmClient = async (chainId: string, archive = false): Promise<SecretNetworkClient> => {
    const chainConfig = Chains.find(c => c.chainId === chainId);
    if (!chainConfig) throw `Chain ${chainId} not found in config.`

    const lcd = (archive && chainConfig.archiveLcd) ? chainConfig.archiveLcd : chainConfig.lcds[0];

    const cached = secretWasmClientCache.get(lcd);
    if (cached) return cached;

    const client = new SecretNetworkClient({
        url: lcd,
        chainId
    })
    secretWasmClientCache.set(chainConfig.lcds[0], client);
    return client;
}