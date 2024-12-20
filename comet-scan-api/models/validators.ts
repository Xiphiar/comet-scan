import mongoose from "mongoose";
import { Validator } from "../interfaces/models/validators.interface";

const validatorSchema = new mongoose.Schema<Validator>({
    chainId: {
        type: String,
        required: true,
        index: true,
    },
    operatorAddress: {
        type: String,
        required: true,
        lowercase: true,
        unique: true,
    },
    accountAddress: {
        type: String,
        required: true,
        lowercase: true,
        unique: true,
    },
    signerAddress: {
        type: String,
        required: true,
        lowercase: true,
        unique: true,
    },
    hexAddress: {
        type: String,
        required: true,
        uppercase: true,
    },
    commission: {
        type: {},
        required: true,
    },
    consensusPubkey: {
        type: {},
        required: true,
    },
    descriptions: {
        type: [{}],
        required: true,
    },
    jailingEvents: {
        type: [{}],
        required: true,
    },
    minimumSelfDelegation: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        required: true,
    },
    delegatedAmount: {
        type: String,
        required: true,
    },
    delegatorShares: {
        type: String,
        required: true,
    },
    selfBondedAmount: {
        type: String,
        required: true,
    }
});

const Validators = mongoose.model<Validator>('Validators', validatorSchema);

export default Validators;