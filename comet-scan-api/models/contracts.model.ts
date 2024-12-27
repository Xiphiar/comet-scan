import mongoose from "mongoose";
import { SecretWasmContract } from "../interfaces/models/contracts.interface";

const secretContractsSchema = new mongoose.Schema<SecretWasmContract>({
    chainId: {
        type: String,
        required: true,
        index: true,
    },
    contractAddress: {
        type: String,
        required: true,
        index: true,
        lowercase: true,
    },
    codeId: {
        type: String,
        required: true,
        index: true,
    },
    creator: {
        type: String,
        required: true,
        index: true,
        lowercase: true,
    },
    label: {
        type: String,
        required: true,
    },
    created: {
        type: {},
        required: false,
    },
    ibc_port_id: {
        type: String,
        required: false,
    },
    admin: {
        type: String,
        required: false,
        index: true,
        lowercase: true,
    },
    tokenInfo: {
        type: {},
        required: false,
    },
    nftInfo: {
        type: {},
        required: false,
    },
    executions: {
        type: Number,
        required: true,
        index: true,
    }
});

const SecretContracts = mongoose.model<SecretWasmContract>('SecretContracts', secretContractsSchema);

export default SecretContracts;