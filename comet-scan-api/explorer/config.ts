import { api } from "encore.dev/api";
import { GetExplorerConfigResponse, ValidatorsConfigResponse, FrontendChainConfig } from "@comet-scan/types";
import Chains from "../config/chains";
import { getValidatorsFromDb } from "../common/dbQueries";

export const getExplorerConfig = api(
    { expose: true, method: "GET", path: "/explorer/config" },
    async (): Promise<GetExplorerConfigResponse> => {
        const chains: FrontendChainConfig[] = Chains.map(
            ({ rpc, lcds, frontendLcd, startHeight, ...chain }) => ({...chain, lcd: frontendLcd})
        );
        return {
            chains,
        }
    }
);

export const getChainValidators = api(
    { expose: true, method: "GET", path: "/explorer/config/:chainId/validators" },
    async ({ chainId }: { chainId: string }): Promise<ValidatorsConfigResponse> => {
        const validators = await getValidatorsFromDb(chainId);
    
        return {
            validators,
        };
    }
);