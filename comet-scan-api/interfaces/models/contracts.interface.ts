export interface SecretWasmContract {
    chainId: string;
    contractAddress: string;
    codeId: string;
    creator: string;
    label: string;
    created?: {
        block_height: string;
        tx_index: string;
    },
    ibc_port_id?: string;
    admin?: string;
    tokenInfo?: {
        name: string;
        symbol: string;
        decimals: number;
        totalSupply?: string;
        permitSupport: boolean;
    },
    nftInfo?: {
        name: string;
        symbol: string;
        numTokens: number;
    }
    executions: number;
}