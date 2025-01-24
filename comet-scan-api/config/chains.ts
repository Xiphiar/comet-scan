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
    govVersion: 'v1',
    ibcVersion: 'v1',
    sdkVersion: '50',
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
    ibcVersion: 'v1',
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
    ibcVersion: 'v1',
    sdkVersion: 'pre-50',
    rpc: 'https://jackal.api.trivium.network:26657',
    lcd: 'https://jackal.api.trivium.network:1317',
    startHeight: 10_838_000,
    features: ['cosmwasm']
}

const Sentinel: ChainConfig = {
    id: 'sentinel',
    chainId: 'sentinelhub-2',
    name: 'Sentinel',
    bondingDenom: 'udvpn',
    bondingDecimals: 6,
    bondingDisplayDenom: 'DVPN',
    logoFile: 'sentinel.svg',
    prefix: 'sent',
    govVersion: 'v1beta1',
    ibcVersion: 'v1',
    sdkVersion: 'pre-50',
    // rpc: 'http://192.168.1.42:40657',
    // lcd: 'http://192.168.1.42:40317',
    rpc: 'https://rpc.sentinel.quokkastake.io',
    lcd: 'https://api.sentinel.quokkastake.io',
    startHeight: 19_550_000,
    features: ['cosmwasm']
}

const IrisNet: ChainConfig = {
    id: 'irisnet',
    chainId: 'irishub-1',
    name: 'IRISnet',
    bondingDenom: 'uiris',
    bondingDecimals: 6,
    bondingDisplayDenom: 'IRIS',
    logoFile: 'irisnet.svg',
    prefix: 'iaa',
    govVersion: 'v1',
    ibcVersion: 'v1',
    sdkVersion: 'pre-50',
    rpc: 'https://mainnet-iris-rpc.konsortech.xyz',
    lcd: 'https://mainnet-iris-api.konsortech.xyz',
    startHeight: 28_490_000,
    pruneBlocksAfter: 500_000,
    pruneTransactions: false,
    features: []
}

const Chains: ChainConfig[] = [
    SecretNetwork,
    SecretNetworkPulsar3,
    Jackal,
    Sentinel,
    IrisNet,
];

Chains.forEach(chain => {
    if (Chains.filter(c => c.chainId === chain.chainId).length > 1) throw `Found duplicate configured chain ${chain.chainId}`
})

export default Chains;

export const getChainConfig = (chainId: string): ChainConfig | undefined => {
    const config = Chains.find(c => c.chainId === chainId);
    // if (!config) throw `Chain config not found for ${chainId}`;
    return config;
}