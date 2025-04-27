import mongoose from "mongoose";
import { Transaction } from "../interfaces/models/transactions.interface";
import mongoosePaginate from 'mongoose-paginate-v2';

const transactionsSchema = new mongoose.Schema<Transaction>({
    chainId: {
        type: String,
        required: true,
    },
    hash: {
        type: String,
        required: true,
        unique: true,
    },
    blockHeight: {
        type: Number,
        required: true,
        index: -1,
    },
    blockHash: {
        type: String,
        required: true,
    },
    timestamp: {
        type: Date,
        required: true,
    },
    signers: {
        type: [String],
        required: true,
        index: true,
    },
    senders: {
        type: [String],
        required: true,
        index: true,
    },
    recipients: {
        type: [String],
        required: true,
        index: true,
    },
    executedContracts: {
        type: [String],
        required: true,
        // index: true,
    },
    feePayer: {
        type: String,
        required: false,
        index: true,
    },
    feeGranter: {
        type: String,
        required: false,
        index: true,
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

transactionsSchema.index({ chainId: 1, blockHeight: -1, timestamp: -1 });
transactionsSchema.index({ chainId: 1, executedContracts: -1, timestamp: -1 });
transactionsSchema.index({ chainId: 1, executedContracts: -1, blockHeight: -1 });
transactionsSchema.plugin(mongoosePaginate);

export interface TransactionDocument extends mongoose.Document, Transaction {}

const Transactions = mongoose.model<Transaction, mongoose.PaginateModel<Transaction>>('Transactions', transactionsSchema);


export default Transactions;