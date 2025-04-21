import { api, Query } from "encore.dev/api";
import Votes from "../models/votes.model";
import { VotesResponse } from "../interfaces/responses/explorerApiResponses";
import { getValidatorsFromDb } from "../common/dbQueries";

type GetVotesByProposalParams = {
  chainId: string,
  proposalId: string,
  limit?: Query<number>,
  page?: Query<number>,
  validator?: Query<boolean>,
  option?: Query<string>, // Filter by specific vote option
}

// Paginated endpoint to get votes by proposal.
export const getVotesByProposal = api(
  { expose: true, method: "GET", path: "/explorer/:chainId/proposals/:proposalId/votes" },
  async (
    { chainId, proposalId, limit = 30, page = 1, validator = false, option }: GetVotesByProposalParams): Promise<VotesResponse> => {

    let result;
    const options = {
      page: page || 1,
      limit: limit || 30,
      sort: { height: -1 }, // Sort final results by height
      projection: { _id: false, __v: false },
      lean: true,
    };

    if (validator) {
      const vals = await getValidatorsFromDb(chainId);
      const valAddresses = vals.map(v => v.accountAddress);
      let matchQuery: any = { chainId, proposalId, voter: { $in: valAddresses } };
      if (option) matchQuery = {...matchQuery, option}

      const aggregate = Votes.aggregate([
        { $match: matchQuery },
        { $sort: { height: -1 } }, // Sort by height to get the latest vote first
        {
          $group: {
            _id: "$voter", // Group by voter
            latestVote: { $first: "$$ROOT" } // Get the first document (latest vote) for each voter
          }
        },
        { $replaceRoot: { newRoot: "$latestVote" } }, // Promote the latestVote document to the root
        { $project: options.projection } // Apply the same projection
      ]);

      result = await Votes.aggregatePaginate(aggregate, options);
    } else {
      let matchQuery: any = { chainId, proposalId };
      if (option) matchQuery = {...matchQuery, option}
      result = await Votes.paginate(
        matchQuery,
        options
      );
    }

    return {
      votes: result.docs,
      total: result.totalDocs,
    };
  }
);