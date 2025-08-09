import { StartVerifyResponse, TaskStatus, VerifyParams } from "@comet-scan/types";
import http from "./apiClient";

export const startSecretWasmVerification = async (params: VerifyParams): Promise<StartVerifyResponse> => {
    const {data} = await http.post(
        `/verify/secretwasm`,
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
    if (!taskId) throw 'Task ID is required';
    const {data} = await http.get(`/verify/status/${taskId}`,
        {
            headers: {
                'Content-Type': 'application/json'
            }
        }
    );
    return data;
}