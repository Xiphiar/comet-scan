export type LcdCosmWasmCodesResponse = {
    code_infos: CosmWasmCodeInfo[]
    pagination: {
        next_key: any
        total: string
    }
}

export interface CosmWasmCodeInfo {
    code_id: string
    creator: string
    data_hash: string
    instantiate_permission: {
        permission: string
        address: string
        addresses: Array<any>
    }
}
  

export type LcdCosmWasmContractInfoResponse = {
    address: string
    contract_info: {
      code_id: string
      creator: string
      admin: string
      label: string
      created: {
        block_height: string
        tx_index: string
      }
      ibc_port_id: string
      extension: any | null
    }
}