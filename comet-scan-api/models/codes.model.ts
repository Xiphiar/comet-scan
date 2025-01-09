import mongoose from "mongoose";
import { WasmCode } from "../interfaces/models/codes.interface";

const codesSchema = new mongoose.Schema<WasmCode>({
    chainId: {
        type: String,
        required: true,
        index: true,
    },
    codeId: {
        type: String,
        required: true,
    },
    codeHash: {
        type: String,
        required: true,
    },
    creator: {
        type: String,
        required: false,
        lowercase: true,
    },
    source: {
        type: String,
        required: false,
    },
    builder: {
        type: String,
        required: false,
    },
});

const Codes = mongoose.model<WasmCode>('Codes', codesSchema);

export default Codes;