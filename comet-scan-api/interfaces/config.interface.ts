export type ChainFeature =
    'secretwasm'
    | 'cosmwasm'
    | 'no_contract_import' // Don't import contracts, only import codes
    | 'no_contract_parsing'; // Import contracts, but don't check if they are a token or NFT collection

export interface FrontendChainConfig {
    id: string;
    chainId: string;
    name: string;
    bondingDenom: string;
    bondingDisplayDenom: string;
    bondingDecimals: number;
    logoFile?: string;
    prefix: string;
    govVersion: 'v1' | 'v1beta1',
    ibcVersion: 'v1' | 'v1beta1',
    sdkVersion: 'pre-50' | '50',
    features: ChainFeature[],
    // Number of blocks to keep, older blocks will be pruned
    pruneBlocksAfter?: number;
    // Weither to prune transactions of pruned blocks
    pruneTransactions?: boolean;
}

export interface ChainConfig extends FrontendChainConfig {
    rpc: string;
    lcds: string[];
    startHeight?: number;
}