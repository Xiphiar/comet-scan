export interface ContractVerification {
    repo: string,
    commit_hash: string,
    result_hash: string,
    builder: string,
    code_zip?: string,
}

export interface StartVerifyResponse {
    task_id: number,
}

export interface VerifyParams {
    repo: string;
    commit?: string;
    optimizer?: string;
}

export interface TaskStatus {
    id: number,
    command: string,
    status: any,
    created_at: string, // ISO date string
    start: string | null, // ISO date string
    end: string | null, // ISO date string
}