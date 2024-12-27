export interface WasmCode {
    chainId: string;
    codeId: string;
    codeHash: string;
    creator?: string;
    source?: string;
    builder?: string;
    verified: boolean;
}