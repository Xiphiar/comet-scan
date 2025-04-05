// Setup LCD fallback clients

import AxiosFallbackClient from "../utils/axiosFallbackClient";
import Chains from "./chains";

const LcdFallbackClients = new Map<string, AxiosFallbackClient>();

for (const chain of Chains) {
    const fallbackClient = new AxiosFallbackClient(
        chain.lcds,
        {
            timeout: 15_000,
        }
    );
    LcdFallbackClients.set(chain.chainId, fallbackClient);
}

export const getLcdClient = (chainId: string): AxiosFallbackClient => {
    const c = LcdFallbackClients.get(chainId);
    if (!c) throw `LCD Client not found for ${chainId}`;
    return c
}