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
}

export type LcdTxSearchResponse = {
  txs: {
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
  }[]
  tx_responses: {
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
  }[]
  pagination: {
    next_key: string | null;
    total: string;
  }
}

  