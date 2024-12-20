import mongoose from "mongoose";
import { Proposal } from "../interfaces/models/proposals.interface";

const proposalSchema = new mongoose.Schema<Proposal>({
    chainId: {
        type: String,
        required: true,
        index: true,
    },
    id: {
        type: String,
        required: true,
        index: true,
    },
    title: {
        type: String,
        required: true,
    },
    summary: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        required: true,
        index: true,
    },
    proposer: {
        type: String,
        required: false,
        index: true,
    },
    proposalType: {
        type: String,
        required: true,
        index: true,
    },
    submitTime: {
        type: Date,
        required: true,
    },
    depositEndTime: {
        type: Date,
        required: true,
    },
    votingStartTime: {
        type: Date,
        required: true,
    },
    votingEndTime: {
        type: Date,
        required: true,
    },
    validatorVotes: {
        type: [{}],
        required: true,
    },
    proposal: {
        type: {},
        required: true,
    },
    expedited: {
        type: Boolean,
        required: true,
    }
});

const Proposals = mongoose.model<Proposal>('Proposals', proposalSchema);

export default Proposals;