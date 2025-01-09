import mongoose from "mongoose";
import { ContractVerification } from "../interfaces/verification.interface";

const contractVerificationsSchema = new mongoose.Schema<ContractVerification>({
    chain_id: {
        type: String,
        required: true,
        index: true,
    },
    code_id: {
        type: String,
        required: true,
        index: true,
    },
    repo: {
        type: String,
        required: true,
    },
    commit_hash: {
        type: String,
        required: true,
    },
    result_hash: {
        type: String,
        required: true,
    },
    builder: {
        type: String,
        required: true,
    },
    verified: {
        type: Boolean,
        required: true,
    },
    code_zip: {
        type: Buffer,
        required: false,
    },
});

const ContractVerifications = mongoose.model<ContractVerification>('ContractVerifications', contractVerificationsSchema, 'contract_verifications');

export default ContractVerifications;