import { api } from "encore.dev/api";
import { queryTopGasBlocks } from "./gasQueries";

interface DataAnyResponse {
  data: any | null;
}

export const getMaximumGasBlock = api(
  { expose: true, method: "GET", path: "/gas/top_blocks/:chainId" },
  async ({ chainId }: { chainId: string }): Promise<DataAnyResponse> => {
    const block = await queryTopGasBlocks({ chainId })
    return {data: block};
  }
);
