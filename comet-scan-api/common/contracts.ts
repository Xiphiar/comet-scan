import { WasmContract } from "../interfaces/models/contracts.interface";
import { ContractWithStats } from "../interfaces/responses/explorerApiResponses";
import Codes from "../models/codes.model";
import Transactions from "../models/transactions";
import { dayMs } from "./dbQueries";

export const addContractStats = async (chainId: string, contracts: WasmContract[]): Promise<ContractWithStats<WasmContract>[]> => {
    const now = new Date();
    const oneDayAgo = new Date(now.valueOf() - dayMs);
    const contractsWithStats: ContractWithStats<WasmContract>[] = []
    for (const contract of contracts) {
      const dailyExecutions = await Transactions.find({ chainId, executedContracts: contract.contractAddress, timestamp: { $gte: oneDayAgo } }).countDocuments();
      const code = await Codes.findOne({ chainId, codeId: contract.codeId }).lean();

      contractsWithStats.push({
        contract,
        dailyExecutions,
        verified: code?.verified || false,
      })
    }

    return contractsWithStats;
}