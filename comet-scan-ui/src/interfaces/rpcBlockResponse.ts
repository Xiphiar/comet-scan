export type RpcBlockResponse = {
    jsonrpc: string
    id: number
    result: {
      block_id: {
        hash: string
        parts: {
          total: number
          hash: string
        }
      }
      block: {
        header: {
          version: {
            block: string
          }
          chain_id: string
          height: string
          time: string
          last_block_id: {
            hash: string
            parts: {
              total: number
              hash: string
            }
          }
          last_commit_hash: string
          data_hash: string
          validators_hash: string
          next_validators_hash: string
          consensus_hash: string
          app_hash: string
          last_results_hash: string
          evidence_hash: string
          proposer_address: string
          encrypted_random: {
            random: string
            proof: string
          }
        }
        data: {
          txs: string[]
        }
        evidence: {
          evidence: any[]
        }
        last_commit: {
          height: string
          round: number
          block_id: {
            hash: string
            parts: {
              total: number
              hash: string
            }
          }
          signatures: {
            block_id_flag: number
            validator_address: string
            timestamp: string
            signature: string
          }[];
        }
      }
    }
}