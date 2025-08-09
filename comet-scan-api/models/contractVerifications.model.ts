import mongoose from "mongoose";
import { ContractVerification } from "@comet-scan/types";

const contractVerificationsSchema = new mongoose.Schema<ContractVerification>({
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
    code_zip: {
        type: Buffer,
        required: false,
    },
});

const ContractVerifications = mongoose.model<ContractVerification>('ContractVerifications', contractVerificationsSchema, 'contract_verifications');

export default ContractVerifications;