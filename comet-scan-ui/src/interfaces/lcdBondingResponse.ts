export type LcdDelegationsResponse = {
    delegation_responses: LcdDelegation[]
    pagination: {
      next_key: string
      total: string
    }
}

export interface LcdDelegation {
    delegation: {
      delegator_address: string
      validator_address: string
      shares: string
    }
    balance: {
      denom: string
      amount: string
    }
}
  

export type LcdUnbondingResponse = {
    unbonding_responses: UnbondingDelegation[];
    pagination: {
      next_key: string
      total: string
    }
}

export interface UnbondingDelegation {
    delegator_address: string
    validator_address: string
    entries: Array<{
      creation_height: string
      completion_time: string
      initial_balance: string
      balance: string
    }>
  }