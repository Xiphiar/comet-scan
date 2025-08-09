import { RpcBlockResponse } from "../rpcBlockResponse";
import { RpcBlockResultsResponse } from "../rpcBlockResultsResponse";
import { ProposerInfo, Validator } from "./validators.interface";

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
    // MS since last block
    blockTime: number | undefined;
    // transactions: DecodedTxRaw[];
    transactionsCount: number,
    totalGasWanted: number,
    totalGasUsed: number,
    totalFees: Coin[],
}

export interface BlockWithProposer extends Block {
    proposer: ProposerInfo | null;
}