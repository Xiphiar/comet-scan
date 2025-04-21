import { VoteOption } from "../interfaces/models/proposals.interface";
import { VotesResponse } from "../interfaces/responses/explorerApiResponses";
import http from "./apiClient";

// Function to fetch votes for a specific proposal
export const getVotesByProposal = async (
  chainId: string,
  proposalId: string,
  limit: number = 30,
  page: number = 1,
  validator: boolean = false,
  option?: VoteOption,
): Promise<VotesResponse> => {
  const { data } = await http.get(
    `/explorer/${chainId}/proposals/${proposalId}/votes`,
    {
      headers: {
        "Content-Type": "application/json",
      },
      // Pass page and validator as query parameters if they are provided
      params: {
        limit,
        page,
        validator,
        option,
      },
    }
  );
  return data;
};
