import mongoose from "mongoose";
import { WasmContract } from "../interfaces/models/contracts.interface";

const contractsSchema = new mongoose.Schema<WasmContract>({
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
        // index: true,
    }
});

contractsSchema.index({ chainId: 1, executions: -1 });

const Contracts = mongoose.model<WasmContract>('Contracts', contractsSchema);

export default Contracts;