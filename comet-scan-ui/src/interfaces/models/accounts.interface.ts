export interface Account {
    chainId: string;
    address: string;
    accountType: string;
    pubKeyType?: string;
    pubKeyBase64?: string;
    accountNumber: string;
    label?: string;
    
    firstTransactionHash: string;
    firstTransactionBlock: number;
    firstTransactionTime: Date;
    
    heldBalanceInBondingDenom: string;
    delegations: Delegation[];
    totalDelegatedBalance: string;
    unbondings: Unbonding[];
    totalUnbondingBalance: string;
    totalBalanceInBondingDenom: string;
    balanceUpdateTime: Date;
}

export interface Delegation {
    validatorAddress: string;
    shares: string;
    amount: string;
}

export interface Unbonding {
    validatorAddress: string;
    creationHeight: string;
    completionTime: Date;
    amount: string;
}