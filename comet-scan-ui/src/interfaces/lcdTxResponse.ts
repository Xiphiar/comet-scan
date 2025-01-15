export type LogEvent = {
  type: string
  attributes: {
    key: string
    value: string
  }[]
}

export type MsgLog = {
  msg_index: number
  log: string
  events: LogEvent[]
}

export type TxEvent = {
  type: string
  attributes: {
    key: string
    value: string
    index: boolean
  }[]
}

export type LcdTxResponse = {
    tx: {
      body: {
        messages: ({ "@type": string } & any)[]
        memo: string
        timeout_height: string
        extension_options: any[]
        non_critical_extension_options: any[]
      }
      auth_info: {
        signer_infos: {
          public_key: {
            "@type": string
            key: string
          }
          mode_info: {
            single: {
              mode: string
            }
          }
          sequence: string
        }[]
        fee: {
          amount: {
            denom: string
            amount: string
          }[]
          gas_limit: string
          payer: string
          granter: string
        }
      }
      signatures: string[]
    }
    tx_response: {
      height: string
      txhash: string
      codespace: string
      code: number
      data: string
      raw_log: string
      logs: MsgLog[]
      info: string
      gas_wanted: string
      gas_used: string
      timestamp: string
      events: TxEvent[]
    }
}

export interface LcdTxSearchTx {
  body: {
    messages: any[]
    memo: string
    timeout_height: string
    extension_options: any[]
    non_critical_extension_options: any[]
  }
  auth_info: {
    signer_infos: {
      public_key: {
        "@type": string
        key: string
      }
      mode_info: {
        single: {
          mode: string
        }
      }
      sequence: string
    }[]
    fee: {
      amount: {
        denom: string
        amount: string
      }[]
      gas_limit: string
      payer: string
      granter: string
    }
  }
  signatures: string[]
}

export interface LcdTxSearchResult {
  height: string
  txhash: string
  codespace: string
  code: number
  data: string
  raw_log: string
  logs: {
    msg_index: number
    log: string
    events: {
      type: string
      attributes: {
        key: string
        value: string
      }[]
    }[]
  }[]
  info: string
  gas_wanted: string
  gas_used: string
  tx: {
    "@type": string
    body: {
      messages: any[]
      memo: string
      timeout_height: string
      extension_options: any[]
      non_critical_extension_options: any[]
    }
    auth_info: {
      signer_infos: {
        public_key: {
          "@type": string
          key: string
        }
        mode_info: {
          single: {
            mode: string
          }
        }
        sequence: string
      }[]
      fee: {
        amount: {
          denom: string
          amount: string
        }[]
        gas_limit: string
        payer: string
        granter: string
      }
    }
    signatures: string[]
  }
  timestamp: string
  events: {
    type: string
    attributes: {
      key: string
      value: string
      index: boolean
    }[]
  }[]
}

export type LcdTxSearchResponse = {
  txs: LcdTxSearchTx[]
  tx_responses: LcdTxSearchResult[]
  pagination: {
    next_key: string | null;
    total: string;
  }
}

  