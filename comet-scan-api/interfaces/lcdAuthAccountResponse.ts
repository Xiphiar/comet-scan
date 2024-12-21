export interface LcdAuthAccount {
  account: BaseAccount | ModuleAccount;
}

export interface ModuleAccount {
  '@type': '/cosmos.auth.v1beta1.ModuleAccount'
  base_account: BaseAccountDetails
  name: string
  permissions: any[]
}

export interface BaseAccountDetails {
  address: string
  pub_key: any
  account_number: string
  sequence: string
}

export interface BaseAccount extends BaseAccountDetails {
  '@type': '/cosmos.auth.v1beta1.BaseAccount'
}
  