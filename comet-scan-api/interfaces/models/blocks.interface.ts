import { RpcBlockResponse } from "../rpcBlockResponse";
import { RpcBlockResultsResponse } from "../rpcBlockResultsResponse";
import { Validator } from "./validators.interface";

export interface Coin {
    readonly denom: string;
    readonly amount: string;
}

export interface Block {
    chainId: string;
    height: number;
    hash: string;
    timestamp: Date;
    block: RpcBlockResponse;
    blockResults: RpcBlockResultsResponse;
    // transactions: DecodedTxRaw[];
    transactionsCount: number,
    totalGasWanted: number,
    totalGasUsed: number,
    totalFees: Coin[],
}

export interface BlockWithProposer extends Block {
    proposer: Validator | null;
}