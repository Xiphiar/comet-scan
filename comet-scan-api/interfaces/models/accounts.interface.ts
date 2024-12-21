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
    
    balanceInBondingDenom: string;
    balanceUpdateTime: Date;
}