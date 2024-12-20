export interface Chain {
    id: string;
    name: string;
    chainId: string;
    bondingDenom: string;
    bondingDisplayDenom: string;
    bondingDecimals: number;
};

export const Chains: Chain[] = [
    {
        id: 'secret',
        name: 'Secret Network',
        chainId: 'secret-4',
        bondingDenom: 'uscrt',
        bondingDecimals: 6,
        bondingDisplayDenom: 'SCRT'
    },
    {
        id: 'secret-testnet',
        name: 'Secret Network Testnet',
        chainId: 'pulsar-3',
        bondingDenom: 'uscrt',
        bondingDecimals: 6,
        bondingDisplayDenom: 'SCRT'
    },
    {
        id: 'jackal',
        name: 'Jackal Protocol',
        chainId: 'jackal-1',
        bondingDenom: 'ujkl',
        bondingDecimals: 6,
        bondingDisplayDenom: 'JKL'
    }
]