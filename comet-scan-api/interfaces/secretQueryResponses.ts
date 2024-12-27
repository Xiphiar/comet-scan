export interface TokenInfoResponse {
    token_info: {
        name: string,
        symbol: string,
        decimals: number,
        total_supply?: string,
    }
}


export interface NftContractInfoResponse {
    contract_info: {
        name: string,
        symbol: string,
    }
}