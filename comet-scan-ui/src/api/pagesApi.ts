import { WasmContract } from "../interfaces/models/contracts.interface";
import { AllContractsPageResponse, AllProposalsPageResponse, AllTokensPageResponse, BlocksPageResponse, FeaturedTokensPageResponse, PaginatedTransactionsResponse, SingleAccountPageResponse, SingleBlockPageResponse, SingleCodePageResponse, SingleContractPageResponse, SingleProposalPageResponse, SingleTransactionPageResponse, SingleValidatorPageResponse, StatusPageResponse, TransactionsPageResponse, ValidatorsPageResponse } from "../interfaces/responses/explorerApiResponses";
import http from "./apiClient"

export const getOverviewPage = async (chainId: string) => {
    const {data} = await http.get(`/explorer/${chainId}/overview`,
        {
            headers: {
                'Content-Type': 'application/json'
            }
        }
    );
    return data;
}

export const getValidatorsPage = async (chainId: string): Promise<ValidatorsPageResponse> => {
    const {data} = await http.get(`/explorer/${chainId}/validators`,
        {
            headers: {
                'Content-Type': 'application/json'
            }
        }
    );
    return data;
}

export const getInactiveValidatorsPage = async (chainId: string): Promise<ValidatorsPageResponse> => {
    const {data} = await http.get(`/explorer/${chainId}/validators/inactive`,
        {
            headers: {
                'Content-Type': 'application/json'
            }
        }
    );
    return data;
}

export const getSingleValidatorPage = async (chainId: string, operatorAddress: string): Promise<SingleValidatorPageResponse> => {
    const {data} = await http.get(`/explorer/${chainId}/validators/${operatorAddress}`,
        {
            headers: {
                'Content-Type': 'application/json'
            }
        }
    );
    return data;
}

export const getRecentBlocksPage = async (chainId: string): Promise<BlocksPageResponse> => {
    const {data} = await http.get(`/explorer/${chainId}/blocks`,
        {
            headers: {
                'Content-Type': 'application/json'
            }
        }
    );
    return data;
}

export const getSingleBlockPage = async (chainId: string, blockHeight: number | string): Promise<SingleBlockPageResponse> => {
    const {data} = await http.get(`/explorer/${chainId}/blocks/${blockHeight}`,
        {
            headers: {
                'Content-Type': 'application/json'
            }
        }
    );
    return data;
}

export const getRecentTransactionsPage = async (chainId: string): Promise<TransactionsPageResponse> => {
    const {data} = await http.get(`/explorer/${chainId}/transactions`,
        {
            headers: {
                'Content-Type': 'application/json'
            }
        }
    );
    return data;
}

export const getPaginatedTransactionsPage = async (chainId: string, pageNumber = 1): Promise<PaginatedTransactionsResponse> => {
    const {data} = await http.get(`/explorer/${chainId}/transactions/page/${pageNumber}`,
        {
            headers: {
                'Content-Type': 'application/json'
            }
        }
    );
    return data;
}

export const getSingleTransactionPage = async (chainId: string, transactionHash: string): Promise<SingleTransactionPageResponse> => {
    const {data} = await http.get(`/explorer/${chainId}/transactions/${transactionHash}`,
        {
            headers: {
                'Content-Type': 'application/json'
            }
        }
    );
    return data;
}

export const getAllProposalsPage = async (chainId: string): Promise<AllProposalsPageResponse> => {
    const {data} = await http.get(`/explorer/${chainId}/proposals`,
        {
            headers: {
                'Content-Type': 'application/json'
            }
        }
    );
    return data;
}

export const getSingleProposalPage = async (chainId: string, proposalId: string): Promise<SingleProposalPageResponse> => {
    const {data} = await http.get(`/explorer/${chainId}/proposals/${proposalId}`,
        {
            headers: {
                'Content-Type': 'application/json'
            }
        }
    );
    return data;
}

export const getSingleAccountPage = async (chainId: string, accountAddress: string): Promise<SingleAccountPageResponse> => {
    const {data} = await http.get(`/explorer/${chainId}/accounts/${accountAddress}`,
        {
            headers: {
                'Content-Type': 'application/json'
            }
        }
    );
    return data;
}

export const getPaginatedAccountTransactions = async (chainId: string, accountAddress: string, pageNumber = 0): Promise<PaginatedTransactionsResponse> => {
    const {data} = await http.get(`/explorer/${chainId}/accounts/${accountAddress}/transactions/${pageNumber}`,
        {
            headers: {
                'Content-Type': 'application/json'
            }
        }
    );
    return data;
}

export const getAllContractsPage = async (chainId: string): Promise<AllContractsPageResponse> => {
    const {data} = await http.get(`/explorer/${chainId}/contracts`,
        {
            headers: {
                'Content-Type': 'application/json'
            }
        }
    );
    return data;
}

export const getSingleContractPage = async (chainId: string, contractAddress: string): Promise<SingleContractPageResponse> => {
    const {data} = await http.get(`/explorer/${chainId}/contracts/${contractAddress}`,
        {
            headers: {
                'Content-Type': 'application/json'
            }
        }
    );
    return data;
}

export const getAllTokensPage = async (chainId: string, page = 1): Promise<AllTokensPageResponse> => {
    const {data} = await http.get(`/explorer/${chainId}/tokens`,
        {
            headers: {
                'Content-Type': 'application/json'
            },
            params: {
                page
            }
        }
    );
    return data;
}

export const getFeaturedTokensPage = async (chainId: string, page = 1): Promise<FeaturedTokensPageResponse> => {
    const {data} = await http.get(`/explorer/${chainId}/tokens/featured`,
        {
            headers: {
                'Content-Type': 'application/json'
            },
            params: {
                page
            }
        }
    );
    return data;
}

export const getSingleCodePage = async (chainId: string, codeId: string): Promise<SingleCodePageResponse> => {
    const {data} = await http.get(`/explorer/${chainId}/codes/${codeId}`,
        {
            headers: {
                'Content-Type': 'application/json'
            }
        }
    );
    return data;
}

export const getStatusPage = async (): Promise<StatusPageResponse> => {
    const {data} = await http.get(`/explorer/status`,
        {
            headers: {
                'Content-Type': 'application/json'
            }
        }
    );
    return data;
}