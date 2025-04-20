export interface Vote {
    chainId: string;
    proposalId: string;
    voter: string;
    option: string;
    metadata?: string;
    height: number;
    timestamp: Date;
}