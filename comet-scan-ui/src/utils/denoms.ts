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