// Basic contract info to use on non-contract pages
export interface LightWasmContract {
    chainId: string;
    contractAddress: string;
    label: string;
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
}

// Full contract info stored in the database. This info is displayed on AllContractsPage and SingleContractPage
export interface WasmContract extends LightWasmContract {
    codeId: string;
    creator: string;
    created?: {
        block_height: string;
        tx_index: string;
    },
    ibc_port_id?: string;
    admin?: string;
    executions: number;
}