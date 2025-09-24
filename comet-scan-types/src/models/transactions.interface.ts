import { LcdTxResponse } from "../lcdTxResponse";

export interface Transaction {
    chainId: string;
    hash: string;
    blockHeight: number;
    blockHash: string;
    timestamp: Date;
    signers: string[];
    senders: string[];
    recipients: string[];
    executedContracts: string[];
    messageTypes: string[] | undefined;
    feePayer?: string;
    feeGranter?: string;
    gasLimit: number;
    gasUsed: number;
    succeeded: boolean;
    transaction: LcdTxResponse;
}