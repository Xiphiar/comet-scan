import { ChainConfig } from "../interfaces/config.interface";


const SecretNetwork: ChainConfig = {
    id: 'secret',
    chainId: 'secret-4',
    name: 'Secret Network',
    bondingDenom: 'uscrt',
    bondingDecimals: 6,
    bondingDisplayDenom: 'SCRT',
    logoFile: 'secret.png',
    prefix: 'secret',
    govVersion: 'v1beta1',
    sdkVersion: 'pre-50',
    rpc: 'https://secret-4.api.trivium.network:26657',
    lcd: 'https://secret-4.api.trivium.network:1317',
    startHeight: 17_550_000,
    features: ['secretwasm']
}

const SecretNetworkPulsar3: ChainConfig = {
    id: 'secret-testnet',
    chainId: 'pulsar-3',
    name: 'Secret Network (Testnet)',
    bondingDenom: 'uscrt',
    bondingDecimals: 6,
    bondingDisplayDenom: 'SCRT',
    logoFile: 'secret.png',
    prefix: 'secret',
    govVersion: 'v1',
    sdkVersion: '50',
    rpc: 'https://pulsar-3.api.trivium.network:26657',
    lcd: 'https://pulsar-3.api.trivium.network:1317',
    startHeight: 8_310_000,
    features: ['secretwasm', 'no_contract_import']
}

const Jackal: ChainConfig = {
    id: 'jackal',
    chainId: 'jackal-1',
    name: 'Jackal Protocol',
    bondingDenom: 'ujkl',
    bondingDecimals: 6,
    bondingDisplayDenom: 'JKL',
    logoFile: 'jackal.svg',
    prefix: 'jkl',
    govVersion: 'v1beta1',
    sdkVersion: 'pre-50',
    rpc: 'https://jackal.api.trivium.network:26657',
    lcd: 'https://jackal.api.trivium.network:1317',
    startHeight: 10_838_000,
    features: ['cosmwasm']
}

const Chains: ChainConfig[] = [
    // SecretNetwork,
    // SecretNetworkPulsar3,
    Jackal
];

Chains.forEach(chain => {
    if (Chains.filter(c => c.chainId === chain.chainId).length > 1) throw `Found duplicate configured chain ${chain.chainId}`
})

export default Chains;

export const getChainConfig = (chainId: string): ChainConfig => {
    const config = Chains.find(c => c.chainId === chainId);
    if (!config) throw `Chain config not found for ${chainId}`;
    return config;
}