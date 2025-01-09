export interface ContractVerification {
    chain_id: string,
    code_id: string,
    repo: string,
    commit_hash: string,
    result_hash: string,
    builder: string,
    verified: boolean,
    code_zip?: string,
}

export interface StartVerifyResponse {
    task_id: number,
}

export interface VerifyParams {
    codeId: string;
    repo: string;
    commit?: string;
}

export interface TaskStatus {
    id: number,
    command: string,
    status: any,
    created_at: string, // ISO date string
    start: string | null, // ISO date string
    end: string | null, // ISO date string
}