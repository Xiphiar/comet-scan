import { Vote } from "../interfaces/models/votes.interface";
import Votes from "../models/votes.model";

export const addVoteToDb = async (chainId: string, blockHeight: number, timestamp: Date, voteMsg: any) => {
    const newVote: Vote = {
        chainId,
        proposalId: voteMsg.proposal_id,
        voter: voteMsg.voter,
        option: voteMsg.option,
        metadata: voteMsg.metadata || undefined,
        height: blockHeight,
        timestamp: timestamp,
    };
    // Assuming each account only votes once per block. If they vote on the same prop multiple times in a single block/tx,
    // only the last vote will be recorded in the DB, which is OK since that will be their effective vote.
    await Votes.findOneAndReplace(
        { chainId, proposalId: voteMsg.proposal_id, voter: voteMsg.voter, height: blockHeight },
        newVote,
        { upsert: true, lean: true }
    );
}