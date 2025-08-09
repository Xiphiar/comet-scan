import { GetExplorerConfigResponse, ValidatorsConfigResponse } from "@comet-scan/types";
import http from "./apiClient"

export const getConfig = async (): Promise<GetExplorerConfigResponse> => {
    const {data} = await http.get(`/explorer/config`,
        {
            headers: {
                'Content-Type': 'application/json'
            }
        }
    );
    return data;
}

export const getChainValidators = async (chainId: string): Promise<ValidatorsConfigResponse> => {
    const { data } = await http.get(`/explorer/config/${chainId}/validators`,
        {
            headers: {
                'Content-Type': 'application/json'
            }
        }
    );
    return data;
}