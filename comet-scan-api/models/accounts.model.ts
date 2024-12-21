import mongoose from "mongoose";
import { Account } from "../interfaces/models/accounts.interface";

const accountsSchema = new mongoose.Schema<Account>({
    chainId: {
        type: String,
        required: true,
        index: true,
    },
    address: {
        type: String,
        required: true,
        index: true,
    },
    accountType: {
        type: String,
        required: true,
    },
    pubKeyType: {
        type: String,
        required: false,
    },
    pubKeyBase64: {
        type: String,
        required: false,
    },
    accountNumber: {
        type: String,
        required: true,
    },
    label: {
        type: String,
        required: false,
    },
    firstTransactionHash: {
        type: String,
        required: true,
    },
    firstTransactionBlock: {
        type: Number,
        required: true,
        index: true,
    },
    firstTransactionTime: {
        type: Date,
        required: true,
        index: true
    },
    balanceInBondingDenom: {
        type: String,
        required: true,
        index: true,
    },
    balanceUpdateTime: {
        type: Date,
        required: true,
        index: true,
    }
});

const Accounts = mongoose.model<Account>('Accounts', accountsSchema);

export default Accounts;