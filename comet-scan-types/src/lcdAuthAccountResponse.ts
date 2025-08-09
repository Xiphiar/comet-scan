export interface LcdAuthAccount {
  account: BaseAccount | ModuleAccount | v1beta1ContinuousVestingAccount;
}

export interface ModuleAccount {
  '@type': '/cosmos.auth.v1beta1.ModuleAccount'
  base_account: BaseAccountDetails
  name: string
  permissions: any[]
}

export interface BaseAccountDetails {
  address: string
  pub_key: {
    "@type": string
    key: string
  }
  account_number: string
  sequence: string
}

export interface BaseAccount extends BaseAccountDetails {
  '@type': '/cosmos.auth.v1beta1.BaseAccount'
}
  

export interface v1beta1ContinuousVestingAccount {
  '@type': '/cosmos.vesting.v1beta1.ContinuousVestingAccount'
  base_vesting_account: {
    base_account: BaseAccountDetails
    delegated_free: Array<any>
    delegated_vesting: Array<any>
    end_time: string
    original_vesting: Array<{
      amount: string
      denom: string
    }>
  }
  start_time: string
}