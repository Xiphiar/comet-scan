import { api, APIError, ErrCode } from "encore.dev/api";
import { getChainConfig } from "../config/chains";
import axios from "axios";
import { VerifyParams, StartVerifyResponse, TaskStatus } from "../interfaces/verification.interface";

export const verifySecretWasmContract = api<VerifyParams, StartVerifyResponse>(
    { expose: true, method: "POST", path: "/verify/secretwasm" },
    async ({ repo, commit }): Promise<StartVerifyResponse> => {
        if (!process.env.SECRETWASM_VERIFICATION_API) throw new APIError(ErrCode.Internal, 'Verification API not ready');

        if (repo.startsWith('http') && !repo.endsWith('.git')) throw new APIError(ErrCode.InvalidArgument, 'Repository must end with .git');

        const formData = new FormData();
        formData.append('repo', repo)
        if (commit) formData.append('commit', commit)
        
        const {data} = await axios.post<number>(`${process.env.SECRETWASM_VERIFICATION_API}/enqueue`, formData);
        console.log(data, typeof data);

        return {
            task_id: data,
        };
    }
);

export const checkVerificationStatus = api(
    { expose: true, method: "GET", path: "/verify/status/:taskId" },
    async ({ taskId }: { taskId: string }): Promise<TaskStatus> => {
        if (!process.env.SECRETWASM_VERIFICATION_API) throw new APIError(ErrCode.Internal, 'Verification API not ready');
        const {data} = await axios.get<TaskStatus>(`${process.env.SECRETWASM_VERIFICATION_API}/status/${taskId}`);
        return data;
    }
);