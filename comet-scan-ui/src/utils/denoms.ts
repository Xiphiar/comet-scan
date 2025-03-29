import { Coin } from "../interfaces/models/blocks.interface";
import { truncateString } from "./format";
import { FrontendChainConfig } from "../interfaces/config.interface";

export interface DenomDetails {
    denom: string;
    symbol: string;
    decimals: number;
    image?: string;
    // TODO add name and image
}

const Denoms: DenomDetails[] = [
    {
        denom: 'uscrt',
        symbol: 'SCRT',
        decimals: 6,
    },
    {
        denom: 'ujkl',
        symbol: 'JKL',
        decimals: 6,
    },
    {
        denom: 'uatom',
        symbol: 'ATOM',
        decimals: 6,
    },
    {
        denom: 'uosmo',
        symbol: 'OSMO',
        decimals: 6,
    },
    {
        denom: 'uusdc',
        symbol: 'USDC',
        decimals: 6,
    },
    {
        denom: 'udvpn',
        symbol: 'DVPN',
        decimals: 6,
    },
    {
        denom: 'untrn',
        symbol: 'NTRN',
        decimals: 6,
    },
    {
        denom: 'utia',
        symbol: 'TIA',
        decimals: 6,
    },
    {
        denom: 'uaxl',
        symbol: 'AXL',
        decimals: 6,
    },
    {
        denom: 'adydx',
        symbol: 'DYDX',
        decimals: 18,
    },
    {
        denom: 'usei',
        symbol: 'SEI',
        decimals: 6,
    },
    {
        denom: 'usaga',
        symbol: 'SAGA',
        decimals: 6,
    },
    {
        denom: 'uom',
        symbol: 'OM',
        decimals: 6,
    },
    {
        denom: 'afet',
        symbol: 'FET',
        decimals: 18,
    },
    {
        denom: 'aarch',
        symbol: 'ARCH',
        decimals: 18,
    },
    {
        denom: 'adym',
        symbol: 'DYM',
        decimals: 18,
    },
    {
        denom: 'uusd',
        symbol: 'USTC',
        decimals: 6,
    },
    {
        denom: 'inj',
        symbol: 'INJ',
        decimals: 18,
    },
    {
        denom: 'uumee',
        symbol: 'UMEE',
        decimals: 6,
    },
]

export const getDenomDetails = async (denom: string, chainConfig: FrontendChainConfig): Promise<DenomDetails> => {
    // If this is an ibc/ denom, we need to parse the original denom then lookup that
    if (denom.startsWith('ibc/')) {
        denom = await getDenomTrace(chainConfig.chainId, denom, chainConfig);
    }

    const details = Denoms.find(d => d.denom === denom);
    return details || {
        decimals: 1,
        denom,
        symbol: denom.length > 15 ? truncateString(denom) : denom,
    }
}

/**
 * E.g. `"1uscrt"` => `{amount:"1",denom:"uscrt"}`
 */
export const stringToCoin = (coinAsString: string): Coin | undefined => {
    const regexMatch = coinAsString.match(/^(\d+)([a-z]+)$/);
  
    if (regexMatch === null) {
        return undefined;
        // throw new Error(`cannot extract denom & amount from '${coinAsString}'`);
    }
  
    return { amount: regexMatch[1], denom: regexMatch[2] };
};
  
/**
 * E.g. `"1uscrt"` => `{amount:"1",denom:"uscrt"}`
 */
export const coinFromString = stringToCoin;

export const combineCoins = (data: Coin[][]): Coin[] => {
    const all = new Map<string, number>();

    data.forEach(coins => {
        (coins || []).forEach(coin => {
            const currentAmount = all.get(coin.denom) || 0;
            all.set(coin.denom, currentAmount + parseInt(coin.amount))
        })
    });

    const toReturn: Coin[] = [];

    all.forEach((value, key) => {
        toReturn.push({
            denom: key,
            amount: value.toString(),
        })
    })

    return toReturn;
}

export const getDenomTrace = async (chainId: string, denomHash: string, chainConfig: FrontendChainConfig): Promise<string> => {
    try {
        const key = `${chainId}-denom-trace-${denomHash}`;
        
        // Check localStorage cache first
        const cached = localStorage.getItem(key);
        if (cached) return cached;

        // If not in cache, fetch from chain's LCD
        const cleanHash = denomHash.replace('ibc/', '');
        const url = `${chainConfig.lcd}/ibc/${chainConfig.ibcVersion === 'v1' ? 'apps' : 'applications'}/transfer/${chainConfig.ibcVersion}/denom_traces/${cleanHash}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch denom trace');
        
        const data = await response.json();
        const denom = data.denom_trace.base_denom;
        
        // Cache the result
        localStorage.setItem(key, denom);
        return denom;
    } catch (err: any) {
        console.error(`Failed to get Denom Trace on ${chainId}:`, err.toString());
        return denomHash;
    }
}