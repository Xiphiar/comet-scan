import { ChainConfig } from "../interfaces/config.interface";

const CosmosHub: ChainConfig = {
    id: 'cosmos',
    chainId: 'cosmoshub-4',
    name: 'Cosmos Hub',
    bondingDenom: 'uatom',
    bondingDecimals: 6,
    bondingDisplayDenom: 'ATOM',
    logoFile: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/cosmoshub/images/atom.svg',
    prefix: 'cosmos',
    govVersion: 'v1',
    ibcVersion: 'v1',
    sdkVersion: '50',
    rpc: 'https://cosmos-rpc.polkachu.com',
    lcds: [
        'https://cosmos-api.ibs.team',
        'https://cosmos-api.stakeandrelax.net',
        'https://cosmos-lcd.easy2stake.com',
        'https://rest-cosmoshub.ecostake.com',
        'https://public.stakewolle.com/cosmos/cosmoshub/rest',
        'https://cosmoshub.lava.build:443',
        'https://rest.lavenderfive.com:443/cosmoshub',
        'https://cosmos-lcd.quickapi.com:443',
        'https://cosmoshub-api.cosmosrescue.dev',
    ],
    frontendLcd: 'https://cosmos-api.ibs.team',
    startHeight: 24_860_000,
    features: ['cosmwasm', 'no_denom_trace'],
    isTestnet: false,
    pruneBlocksAfter: 500_000,
    pruneTransactions: true,
    enableWalletConnect: false,
}

const Osmosis: ChainConfig = {
    id: 'osmosis',
    chainId: 'osmosis-1',
    name: 'Osmosis',
    bondingDenom: 'uosmo',
    bondingDecimals: 6,
    bondingDisplayDenom: 'OSMO',
    logoFile: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/osmosis/images/osmo.svg',
    prefix: 'osmo',
    govVersion: 'v1',
    ibcVersion: 'v1',
    sdkVersion: '50',
    rpc: 'http://192.168.1.42:42657',
    lcds: [
        'http://192.168.1.42:42317',
        'https://lcd.osmosis.zone',
        'https://osmosis-api.chainroot.io',
        'https://rest.cros-nest.com/osmosis',
        'https://rest-osmosis.ecostake.com',
        'https://osmosis-api.polkachu.com',
        'https://public.stakewolle.com/cosmos/osmosis/rest',
        'https://osmosis-lcd.quickapi.com:443',
        'https://rest.lavenderfive.com:443/osmosis',
    ],
    frontendLcd: 'https://lcd.osmosis.zone',
    startHeight: 33_131_445,
    features: ['cosmwasm'],
    isTestnet: false,
    pruneBlocksAfter: 500_000,
    pruneTransactions: true,
    enableWalletConnect: false,
}

const SecretNetwork: ChainConfig = {
    id: 'secret',
    chainId: 'secret-4',
    name: 'Secret Network',
    bondingDenom: 'uscrt',
    bondingDecimals: 6,
    bondingDisplayDenom: 'SCRT',
    logoFile: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/secretnetwork/images/scrt.svg',
    prefix: 'secret',
    govVersion: 'v1',
    ibcVersion: 'v1',
    sdkVersion: '50',
    rpc: 'http://192.168.1.42:41657',
    lcds: [
        'http://192.168.1.42:41317',
        'https://secret-4.api.trivium.network:1317'
    ],
    frontendLcd: 'https://secret-4.api.trivium.network:1317',
    startHeight: 17_550_000,
    features: ['secretwasm', 'tokens', 'featured_tokens'],
    isTestnet: false,
    enableWalletConnect: true,
}

const SecretNetworkPulsar3: ChainConfig = {
    id: 'secret-testnet',
    chainId: 'pulsar-3',
    name: 'Secret Network (Testnet)',
    bondingDenom: 'uscrt',
    bondingDecimals: 6,
    bondingDisplayDenom: 'SCRT',
    logoFile: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/secretnetwork/images/scrt.svg',
    prefix: 'secret',
    govVersion: 'v1',
    ibcVersion: 'v1',
    sdkVersion: '50',
    rpc: 'https://pulsar.rpc.secretnodes.com',
    lcds: ['https://pulsar.lcd.secretnodes.com'],
    frontendLcd: 'https://pulsar.lcd.secretnodes.com',
    startHeight: 8_310_000,
    features: ['secretwasm', 'no_contract_parsing', 'tokens'],
    isTestnet: true,
    enableWalletConnect: true,
    pruneBlocksAfter: 500_000,
    pruneTransactions: true,
}

const Jackal: ChainConfig = {
    id: 'jackal',
    chainId: 'jackal-1',
    name: 'Jackal Protocol',
    bondingDenom: 'ujkl',
    bondingDecimals: 6,
    bondingDisplayDenom: 'JKL',
    logoFile: '/logos/jackal.svg',
    prefix: 'jkl',
    govVersion: 'v1beta1',
    ibcVersion: 'v1',
    sdkVersion: 'pre-50',
    rpc: 'http://35.193.64.216:26657',
    lcds: [
        'https://jackal.api.kjnodes.com',
        'https://m-jackal.api.utsa.tech',
        'https://rest.lavenderfive.com:443/jackal',
        'https://public.stakewolle.com/cosmos/jackal/rest',
        'https://public.stakewolle.com/cosmos/jackal/rest',
        'https://jkl.api.m.stavr.tech',
        'https://jackal-api.polkachu.com',
        'https://jackal-api.kleomedes.network'
    ],
    frontendLcd: 'https://jkl.api.m.stavr.tech',
    startHeight: 10_838_000,
    features: ['cosmwasm'],
    isTestnet: false,
    enableWalletConnect: false,
    pruneBlocksAfter: 1_000_000,
    pruneTransactions: true,
}

const Sentinel: ChainConfig = {
    id: 'sentinel',
    chainId: 'sentinelhub-2',
    name: 'Sentinel',
    bondingDenom: 'udvpn',
    bondingDecimals: 6,
    bondingDisplayDenom: 'DVPN',
    logoFile: '/logos/sentinel.svg',
    prefix: 'sent',
    govVersion: 'v1beta1',
    ibcVersion: 'v1',
    sdkVersion: 'pre-50',
    rpc: 'http://192.168.1.42:40657',
    lcds: [
        'http://192.168.1.42:40317',
        'https://public.stakewolle.com/cosmos/sentinel/rest',
        'https://api.sentinel.quokkastake.io',
        'https://sentinel-api.ibs.team:443',
        'https://api-sentinel.chainvibes.com:443',
        'https://api.dvpn.roomit.xyz',
        'https://api.ro.mathnodes.com:443',
        'https://api.noncompliant.network:443',
        'https://api.dvpn.me:443',
        'https://sentinel.declab.pro:443',
        'https://sentinel.api.nodeshub.online:443',
        'https://api.sentineldao.com',
        'https://sentinel-rest.publicnode.com'
    ],
    frontendLcd: 'https://sentinel-api.ibs.team:443',
    startHeight: 19_550_000,
    features: ['cosmwasm'],
    isTestnet: false,
    enableWalletConnect: false,
    pruneBlocksAfter: 500_000,
    pruneTransactions: true,
}

// const IrisNet: ChainConfig = {
//     id: 'irisnet',
//     chainId: 'irishub-1',
//     name: 'IRISnet',
//     bondingDenom: 'uiris',
//     bondingDecimals: 6,
//     bondingDisplayDenom: 'IRIS',
//     logoFile: '/logos/irisnet.svg',
//     prefix: 'iaa',
//     govVersion: 'v1',
//     ibcVersion: 'v1',
//     sdkVersion: 'pre-50',
//     rpc: 'https://mainnet-iris-rpc.konsortech.xyz',
//     lcd: 'https://mainnet-iris-api.konsortech.xyz',
//     startHeight: 28_490_000,
//     pruneBlocksAfter: 500_000,
//     pruneTransactions: false,
//     features: []
// }

const Chains: ChainConfig[] = [
    CosmosHub,
    Osmosis,
    SecretNetwork,
    SecretNetworkPulsar3,
    Jackal,
    Sentinel,
    // IrisNet,
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
