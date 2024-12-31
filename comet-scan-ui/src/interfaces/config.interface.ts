export type ChainFeature = 'secretwasm' | 'cosmwasm' | 'no_contract_import';

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
}

export interface ChainConfig extends FrontendChainConfig {
    rpc: string;
    lcd: string;
    startHeight?: number;
}