export interface ChainConfig {
    chainId: string;
    rpc: string;
    lcd: string;
    startHeight?: number;
    denom: string;
    denomDecimals: number;
    prefix: string;
    govVersion: 'v1' | 'v1beta1',
    sdkVersion: 'pre-50' | '50',
}

const SecretNetwork: ChainConfig = {
    chainId: 'secret-4',

    rpc: 'https://secret-4.api.trivium.network:26657',
    // rpc: 'http://66.85.149.163:26657',

    lcd: 'https://secret-4.api.trivium.network:1317',
    
    startHeight: 17_446_000,
    // startHeight: 17335290,
    denom: 'uscrt',
    denomDecimals: 6,
    prefix: 'secret',
    govVersion: 'v1beta1',
    sdkVersion: 'pre-50',
}

const SecretNetworkPulsar3: ChainConfig = {
    chainId: 'pulsar-3',
    rpc: 'https://pulsar-3.api.trivium.network:26657',
    lcd: 'https://pulsar-3.api.trivium.network:1317',
    startHeight: 8_243_000,
    denom: 'uscrt',
    denomDecimals: 6,
    prefix: 'secret',
    govVersion: 'v1',
    sdkVersion: '50',
}

const Jackal: ChainConfig = {
    chainId: 'jackal-1',
    rpc: 'https://jackal.api.trivium.network:26657',
    lcd: 'https://jackal.api.trivium.network:1317',
    startHeight: 10_774_000,
    denom: 'ujkl',
    denomDecimals: 6,
    prefix: 'jkl',
    govVersion: 'v1beta1',
    sdkVersion: 'pre-50',
}

const Chains: ChainConfig[] = [SecretNetwork, SecretNetworkPulsar3, Jackal];

export default Chains;

export const getChainConfig = (chainId: string): ChainConfig => {
    const config = Chains.find(c => c.chainId === chainId);
    if (!config) throw `Chain config not found for ${chainId}`;
    return config;
}