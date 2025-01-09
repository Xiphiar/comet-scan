import { StartVerifyResponse, TaskStatus, VerifyParams } from "../interfaces/verification.interface";
import http from "./apiClient";

export const startSecretWasmVerification = async (chainId: string, params: VerifyParams): Promise<StartVerifyResponse> => {
    const {data} = await http.post(
        `/verify/secretwasm/${chainId}`,
        params,
        {
            headers: {
                'Content-Type': 'application/json'
            }
        }
    );
    return data;
}

export const getVerificationStatus = async (taskId: string | number): Promise<TaskStatus> => {
    const {data} = await http.get(`/verify/status/${taskId}`,
        {
            headers: {
                'Content-Type': 'application/json'
            }
        }
    );
    return data;
}