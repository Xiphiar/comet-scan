import { api } from "encore.dev/api";
import { queryDailyAverages } from "./statsQueries";

interface DataAnyResponse {
  data: any | null;
}

export const getDailyAverages = api(
  { expose: true, method: "GET", path: "/stats/daily/:chainId" },
  async ({ chainId }: { chainId: string }): Promise<DataAnyResponse> => {
    const data = await queryDailyAverages(chainId)
    return {data};
  }
);
