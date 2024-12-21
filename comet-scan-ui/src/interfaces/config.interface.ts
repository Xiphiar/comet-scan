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
    sdkVersion: 'pre-50' | '50',
}

export interface ChainConfig extends FrontendChainConfig {
    rpc: string;
    lcd: string;
    startHeight?: number;
}