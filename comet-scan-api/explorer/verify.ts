import { api, APIError, ErrCode } from "encore.dev/api";
import { getChainConfig } from "../config/chains";
import axios from "axios";
import { VerifyParams, StartVerifyResponse, TaskStatus } from "../interfaces/verification.interface";

export const verifySecretWasmContract = api(
    { expose: true, method: "POST", path: "/verify/secretwasm/:chainId" },
    async ({ chainId, params }: { chainId: string, params: VerifyParams }): Promise<StartVerifyResponse> => {
        if (!process.env.SECRETWASM_VERIFICATION_API) throw new APIError(ErrCode.Internal, 'Verification API not ready');

        const config = getChainConfig(chainId);
        if (!config) throw new APIError(ErrCode.NotFound, 'Chain not found');
        if (!config.features.includes('secretwasm')) throw new APIError(ErrCode.Unimplemented, 'SecretWasm not enabled for chain');

        const formData = new FormData();
        formData.append('code_id', params.codeId)
        formData.append('repo', params.repo)
        formData.append('chain_id', chainId)
        formData.append('lcd', config.lcd)
        if (params.commit) formData.append('commit', params.commit)
        
        const {data} = await axios.post<number>(`${process.env.SECRETWASM_VERIFICATION_API}/enqueue`, formData);
        console.log(data, typeof data);

        return {
            task_id: data,
        };
    }
);

export const checkVerificationStatus = api(
    { expose: true, method: "GET", path: "/verify/status/:taskId" },
    async ({ taskId }: { taskId: number }): Promise<TaskStatus> => {
        if (!process.env.SECRETWASM_VERIFICATION_API) throw new APIError(ErrCode.Internal, 'Verification API not ready');
        const {data} = await axios.get<TaskStatus>(`${process.env.SECRETWASM_VERIFICATION_API}/status/${taskId}`);
        return data;
    }
);