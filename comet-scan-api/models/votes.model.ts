import mongoose from "mongoose";
import { Vote } from "../interfaces/models/votes.interface";

const voteSchema = new mongoose.Schema<Vote>({
    chainId: {
        type: String,
        required: true,
        index: true,
    },
    proposalId: {
        type: String,
        required: true,
    },
    voter: {
        type: String,
        required: true,
    },
    option: {
        type: String,
        required: true,
    },
    metadata: {
        type: String,
        required: false,
    },
    height: {
        type: Number,
        required: true,
    },
    timestamp: {
        type: Date,
        required: true,
    }
});

voteSchema.index({ chainId: 1, proposalId: 1, voter: 1 });
voteSchema.index({ chainId: 1, option: 1 });
voteSchema.index({ chainId: 1, height: 1, timestamp: 1 });

const Votes = mongoose.model<Vote>('Votes', voteSchema);

export default Votes;