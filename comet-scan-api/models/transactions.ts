import mongoose from "mongoose";
import { Transaction } from "../interfaces/models/transactions.interface";

const transactionsSchema = new mongoose.Schema<Transaction>({
    chainId: {
        type: String,
        required: true,
        index: true,
    },
    hash: {
        type: String,
        required: true,
        unique: true,
    },
    blockHeight: {
        type: Number,
        required: true,
        index: true,
    },
    blockHash: {
        type: String,
        required: true,
        index: true,
    },
    timestamp: {
        type: Date,
        required: true,
        index: true,
    },
    signers: {
        type: [String],
        required: true,
    },
    senders: {
        type: [String],
        required: true,
    },
    recipients: {
        type: [String],
        required: true,
    },
    feePayer: {
        type: String,
        required: false,
    },
    feeGranter: {
        type: String,
        required: false,
    },
    gasLimit: {
        type: Number,
        required: true,
    },
    gasUsed: {
        type: Number,
        required: true,
    },
    succeeded: {
        type: Boolean,
        required: true,
    },
    transaction: {
        type: {},
        required: true,
    },
});

const Transactions = mongoose.model<Transaction>('Transactions', transactionsSchema);

export default Transactions;