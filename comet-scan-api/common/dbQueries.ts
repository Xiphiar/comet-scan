import { Block } from "../interfaces/models/blocks.interface";
import { Proposal } from "../interfaces/models/proposals.interface";
import { Validator, ValidatorBondStatus } from "../interfaces/models/validators.interface";
import Blocks from "../models/blocks";
import Proposals from "../models/proposals";
import Transactions from "../models/transactions";
import Validators from "../models/validators";

export const getLatestBlock = async (chainId: string): Promise<Block | null> => {
    const block = await Blocks.findOne({ chainId }, { _id: false, __v: false }).sort('-height').lean();
    return block;
}

// Sorted by delegated amount, highest to smallest
export const getValidatorsFromDb = async (chainId: string, status?: ValidatorBondStatus): Promise<Validator[]> => {
    return await Validators.find({ chainId, status }, { __v: false, _id: false })
        .sort({delegatedAmount: -1})
        .collation({locale: "en_US", numericOrdering: true})
        .lean();
}

// Sorted by delegated amount, highest to smallest
export const getTopValidatorsFromDb = async (chainId: string, limit: number): Promise<Validator[]> => {
    return await Validators.find({ chainId, status: 'BOND_STATUS_BONDED' }, { __v: false, _id: false })
        .sort({delegatedAmount: -1})
        .collation({locale: "en_US", numericOrdering: true})
        .limit(limit)
        .lean();
}

export const getActiveValidatorsCount = async (chainId: string): Promise<number> => {
    return await Validators.countDocuments({ chainId, status: 'BOND_STATUS_BONDED' }, { __v: false, _id: false });
}

export const minuteMs = 60 * 1000;
export const hourMs = minuteMs * 60;
export const dayMs = hourMs * 24;
export const get24hTransactionsCount = async (chainId: string) => {
    const oneDayAgo = new Date(new Date().valueOf() - dayMs);
    return await Transactions.countDocuments({ chainId, timestamp: { $gte: oneDayAgo }})
}

export const get24hBlocksCount = async (chainId: string) => {
    const oneDayAgo = new Date(new Date().valueOf() - dayMs);
    return await Blocks.countDocuments({ chainId, timestamp: { $gte: oneDayAgo }})
}

// Sorted by proposal ID, highest to smallest
export const getProposalsFromDb = async (chainId: string, limit = 1000): Promise<Proposal[]> => {
    return await Proposals.find({ chainId }, { __v: false, _id: false })
        .sort({id: -1})
        .collation({locale: "en_US", numericOrdering: true})
        .limit(limit)
        .lean();
}