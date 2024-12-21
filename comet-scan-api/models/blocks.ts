import mongoose from "mongoose";
import { Block } from "../interfaces/models/blocks.interface";

const blocksSchema = new mongoose.Schema<Block>({
    chainId: {
        type: String,
        required: true,
        index: true,
    },
    height: {
        type: Number,
        required: true,
        index: true,
    },
    hash: {
        type: String,
        required: true,
        unique: true,
    },
    timestamp: {
        type: Date,
        required: true,
        index: true,
    },
    block: {
        type: {},
        required: true,
    },
    blockResults: {
        type: {},
        required: true,
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

const Blocks = mongoose.model<Block>('Blocks', blocksSchema);

export default Blocks;