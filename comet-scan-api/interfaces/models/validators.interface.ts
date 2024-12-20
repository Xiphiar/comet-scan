export interface Validator {
    chainId: string;
    commission: {
        max_change_rate: string;
        max_rate: string;
        rates: {
            rate: string;
            updateTime: Date;
        }[],
    }
    consensusPubkey: {
        type?: string;
        key?: string; //Base64
    }
    descriptions: {
        details?: string;
        identity?: string;
        moniker?: string;
        security_contact?: string;
        website?: string;
        updateTime: Date;
    }[],
    jailingEvents: {
        jailTime: Date;
        unjailTime: Date;
        amountSlashed: string;
        denomSlashed: string;
    }[],
    minimumSelfDelegation: string;
    operatorAddress: string;
    accountAddress: string;
    signerAddress: string;
    hexAddress: string;
    status: ValidatorBondStatus;
    delegatedAmount: string;
    delegatorShares: string;
    selfBondedAmount: string;
}

export type ValidatorBondStatus = 'BOND_STATUS_BONDED' | 'BOND_STATUS_UNBONDED' | 'BOND_STATUS_UNBONDING';