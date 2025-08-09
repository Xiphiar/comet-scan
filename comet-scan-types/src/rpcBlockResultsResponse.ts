export type RpcBlockResultsResponse = {
    jsonrpc: string
    id: number
    result: {
      height: string
      txs_results: {
        code: number
        data: string
        log: string
        info: string
        gas_wanted: string
        gas_used: string
        events: {
          type: string
          attributes: {
            key: string
            value: string
            index: boolean
          }[]
        }[]
        codespace: string
      }[] | null;
      begin_block_events: {
        type: string
        attributes: {
          key: string
          value?: string
          index: boolean
        }[]
      }[] | null;
      end_block_events: any[] | null;
      validator_updates: any[] | null;
      consensus_param_updates: {
        block: {
          max_bytes: string
          max_gas: string
        }
        evidence: {
          max_age_num_blocks: string
          max_age_duration: string
          max_bytes: string
        }
        validator: {
          pub_key_types: string[]
        }
      }
    }
  }
