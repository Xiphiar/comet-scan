import { AxiosError } from "axios";
import { VoteOption } from "../interfaces/models/proposals.interface";
import { VotesResponse } from "../interfaces/responses/explorerApiResponses";
import { TokenInfoResponse } from "../interfaces/secretQueryResponses";
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

// Get token info, using localStorage as a cache.
export const getTokenInfoWithCache = async (
  chainId: string,
  contractAddress: string,
): Promise<TokenInfoResponse | undefined> => {
  // Try to get data from cache
  const cacheKey = `token_info_${chainId}_${contractAddress}`;
  const cached = localStorage.get(cacheKey);
  if (cached === 'undefined') return undefined;
  else if (cached) return JSON.parse(cached);

  // Else try to get data from backend
  try {
    const { data } = await http.get(
      `/explorer/${chainId}/tokens/${contractAddress}/token_info`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    // Cache the response so we don't need to make another request for the same token
    localStorage.set(cacheKey, JSON.stringify(data));
    return data;
  } catch (err) {
    // If the backend returns 404, cache 'undefined' and return undefined so we don't keep sending requests for this token.
    if ((err as AxiosError).response.status === 404) localStorage.set(cacheKey, 'undefined');
    return undefined;
  }
};
