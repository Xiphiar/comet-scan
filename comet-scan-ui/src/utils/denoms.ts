import { Coin } from "../interfaces/models/blocks.interface";
import { weiFormatNice } from "./coin";
import { truncateString } from "./format";

export interface DenomDetails {
    denom: string;
    symbol: string;
    decimals: number;
    image?: string;
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
    }
]

export const getDenomDetails = (denom: string): DenomDetails => {
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
        coins.forEach(coin => {
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