import { FrontendChainConfig } from "../config.interface";
import { Validator } from "../models/validators.interface";

export interface GetExplorerConfigResponse {
    chains: FrontendChainConfig[];
}

export interface ValidatorsConfigResponse {
    validators: Validator[];
}