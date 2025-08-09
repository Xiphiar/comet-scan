import mongoose from "mongoose";
import { Account } from "@comet-scan/types";

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
        required: false,
    },
    firstTransactionBlock: {
        type: Number,
        required: false,
        index: true,
    },
    firstTransactionTime: {
        type: Date,
        required: false,
        index: true
    },
    heldBalanceInBondingDenom: {
        type: String,
        required: true,
        index: true,
    },
    delegations: {
        type: [{}],
        required: true,
    },
    totalDelegatedBalance: {
        type: String,
        required: true,
        index: true,
    },
    unbondings: {
        type: [{}],
        required: true,
    },
    totalUnbondingBalance: {
        type: String,
        required: true,
        index: true,
    },
    totalBalanceInBondingDenom: {
        type: String,
        required: true,
        index: true,
    },
    balanceUpdateTime: {
        type: Date,
        required: true,
        index: true,
    },
    nativeAssets: {
        type: [{}],
        required: true,
    },
    tokenAssets: {
        type: [{}],
        required: true,
    }
});

accountsSchema.index({ chainId: 1, address: 1 });

const Accounts = mongoose.model<Account>('Accounts', accountsSchema);

export default Accounts;