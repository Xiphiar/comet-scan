import Blocks from "../models/blocks";
import { Block } from "@comet-scan/types";

interface QueryTopGasBlockProps {
    chainId: string;
    startDate?: Date;
    startHeight?: number;
    endDate?: Date;
    endHeight?: number;
}
export const queryTopGasBlocks = async ({chainId, startDate, startHeight, endDate, endHeight}: QueryTopGasBlockProps): Promise<Block[]> => {
    let query: any = { chainId };
    if (startDate) query = { ...query, timestamp: {$gte: startDate}}
    if (startHeight) query = { ...query, height: {$gte: startHeight}}
    if (endDate) query = { ...query, timestamp: {$lte: endDate}}
    if (endHeight) query = { ...query, height: {$lte: endHeight}}
    console.log(query)

    const topBlocks = await Blocks.find(query, {_id: 0, __v: 0}).sort('-totalGasUsed').limit(100).lean();
    return topBlocks;
}