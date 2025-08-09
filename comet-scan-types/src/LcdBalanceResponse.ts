import { Coin } from "./models/blocks.interface"

export interface LcdBalancesResponse {
  balances: Coin[];
  pagination: {
    next_key: string
    total: string
  }
}


export type LcdBalance = {
  balance: Coin
}
  