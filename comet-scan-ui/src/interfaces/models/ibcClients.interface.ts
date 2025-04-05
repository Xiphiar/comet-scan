export interface IbcClient {
    _id: string;
    chainId: string;
    clientId: string;
    counterpartyChainId: string;
    status: 'Active' | 'Expired'
}