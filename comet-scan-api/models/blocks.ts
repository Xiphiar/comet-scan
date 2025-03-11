import mongoose from "mongoose";
import { Block } from "../interfaces/models/blocks.interface";

const blocksSchema = new mongoose.Schema<Block>({
    chainId: {
        type: String,
        required: true,
    },
    height: {
        type: Number,
        required: true,
    },
    hash: {
        type: String,
        required: true,
        unique: true,
    },
    timestamp: {
        type: Date,
        required: true,
    },
    block: {
        type: {},
        required: true,
    },
    blockResults: {
        type: {},
        required: true,
    },
    blockTime: {
        type: Number,
        requred: false,
    },
    // transactions: {
    //     type: [{}],
    //     required: true,
    // },
    totalGasWanted: {
        type: Number,
        required: true,
    },
    totalGasUsed: {
        type: Number,
        required: true,
    },
    transactionsCount: {
        type: Number,
        required: true,
    },
    totalFees: {
        type: [{}],
        required: true,
    },
});

blocksSchema.index({ chainId: 1, height: -1, timestamp: -1 });

const Blocks = mongoose.model<Block>('Blocks', blocksSchema);

export default Blocks;