export interface Snip20TokenInfoResponse {
    token_info: {
        name: string,
        symbol: string,
        decimals: number,
        total_supply?: string,
    }
}


export interface Snip721ContractInfoResponse {
    contract_info: {
        name: string,
        symbol: string,
    }
}