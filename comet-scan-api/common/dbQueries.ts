import { Block, Proposal, Validator, ValidatorBondStatus } from "@comet-scan/types";
import Blocks from "../models/blocks";
import Contracts from "../models/contracts.model";
import Proposals from "../models/proposals";
import Transactions from "../models/transactions";
import Validators from "../models/validators";
import { Cache } from "./cache";

export const getLatestBlock = async (chainId: string): Promise<Block | null> => {
    const block = await Blocks.findOne({ chainId }, { _id: false, __v: false }).sort('-height').lean();
    return block;
}

export const getOldestBlock = async (chainId: string): Promise<Block | null> => {
    const block = await Blocks.findOne({ chainId }, { _id: false, __v: false }).sort('height').lean();
    return block;
}

// Sorted by delegated amount, highest to smallest
export const getValidatorsFromDb = async (chainId: string, statuses?: ValidatorBondStatus[]): Promise<Validator[]> => {
    let filter: any = {
        chainId,
    }
    if (statuses?.length) filter = {
        ...filter,
        status: {
            $in: statuses,
        }
    }
    return await Validators.find(filter, { __v: false, _id: false })
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
export const get24hTransactionsCount = async (chainId: string): Promise<number> => {
    const cacheKey = `24h-txs-count-${chainId}`;
    const cached = Cache.get<number>(cacheKey);
    if (cached) return cached;

    const oneDayAgo = new Date(new Date().valueOf() - dayMs);
    const result = await Transactions.countDocuments({ chainId, timestamp: { $gte: oneDayAgo }})
    Cache.set<number>(cacheKey, result, 3600);
    return result;
}

export const get24hBlocksCount = async (chainId: string) => {
    const cacheKey = `24h-blocks-count-${chainId}`;
    const cached = Cache.get<number>(cacheKey);
    if (cached) return cached;

    const oneDayAgo = new Date(new Date().valueOf() - dayMs);
    const result = await Blocks.countDocuments({ chainId, timestamp: { $gte: oneDayAgo }});
    Cache.set<number>(cacheKey, result, 3600);
    return result;
}

export const get24hContractExecutionsCount = async (chainId: string, contractAddress: string): Promise<number> => {
    const cacheKey = `24h-executions-count-${chainId}-${contractAddress}`;
    const cached = Cache.get<number>(cacheKey);
    if (cached) return cached;

    const oneDayAgo = new Date(new Date().valueOf() - dayMs);
    const result = await Transactions.find({ chainId, executedContracts: contractAddress, timestamp: { $gte: oneDayAgo } }).countDocuments();
    Cache.set<number>(cacheKey, result, 3600);
    return result;
}

export const get24hTotalExecutionsCount = async (chainId: string): Promise<number> => {
    const cacheKey = `24h-executions-count-${chainId}-total`;
    const cached = Cache.get<number>(cacheKey);
    if (cached) return cached;

    const oneDayAgo = new Date(new Date().valueOf() - dayMs);
    const result = await Transactions.find({ chainId, 'executedContracts.0': { $exists: true}, timestamp: { $gte: oneDayAgo } }).countDocuments();
    Cache.set<number>(cacheKey, result, 3600);
    return result;
}

export const getTotalExecutionsCount = async (chainId: string): Promise<number> => {
    const cacheKey = `total-executions-count-${chainId}`;
    const cached = Cache.get<number>(cacheKey);
    if (cached) return cached;

    // const result = await Transactions.find({ chainId, 'executedContracts.0': { $exists: true} }).countDocuments();
    const contracts = await Contracts.find({ chainId }).select({ executions: true }).lean();
    const result = contracts.reduce(
        (sum, contract) => sum + contract.executions,
        0
    )
    Cache.set<number>(cacheKey, result, 3600);
    return result;
}

// Sorted by proposal ID, highest to smallest
export const getProposalsFromDb = async (chainId: string, limit = 1000): Promise<Proposal[]> => {
    return await Proposals.find({ chainId }, { __v: false, _id: false })
        .sort({id: -1})
        .collation({locale: "en_US", numericOrdering: true})
        .limit(limit)
        .lean();
}