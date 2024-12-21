import { GetExplorerConfigResponse } from "../interfaces/responses/config.response.interface";
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