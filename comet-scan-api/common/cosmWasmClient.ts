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

export const getSecretWasmClient = async (chainId: string): Promise<SecretNetworkClient> => {
    const chainConfig = Chains.find(c => c.chainId === chainId);
    if (!chainConfig) throw `Chain ${chainId} not found in config.`

    const cached = secretWasmClientCache.get(chainConfig.lcds[0]);
    if (cached) return cached;

    const client = new SecretNetworkClient({
        url: chainConfig.lcds[0],
        chainId
    })
    secretWasmClientCache.set(chainConfig.lcds[0], client);
    return client;
}