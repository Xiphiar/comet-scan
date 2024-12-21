import { api } from "encore.dev/api";
import { GetExplorerConfigResponse } from "../interfaces/responses/config.response.interface";
import Chains from "../config/chains";
import { FrontendChainConfig } from "../interfaces/config.interface";

export const getExplorerConfig = api(
    { expose: true, method: "GET", path: "/explorer/config" },
    async (): Promise<GetExplorerConfigResponse> => {
        const chains: FrontendChainConfig[] = Chains.map(({ rpc, lcd, startHeight, ...chain }) => chain )
        return {
            chains,
        }
    }
  );