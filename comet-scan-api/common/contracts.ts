import { WasmContract } from "../interfaces/models/contracts.interface";
import { ContractWithStats } from "../interfaces/responses/explorerApiResponses";
import Codes from "../models/codes.model";
import ContractVerifications from "../models/contractVerifications.model";
import Transactions from "../models/transactions";
import { dayMs } from "./dbQueries";

export const addContractStats = async (chainId: string, contracts: WasmContract[]): Promise<ContractWithStats[]> => {
    const now = new Date();
    const oneDayAgo = new Date(now.valueOf() - dayMs);
    const contractsWithStats: ContractWithStats[] = []
    for (const contract of contracts) {
      const dailyExecutions = await Transactions.find({ chainId, executedContracts: contract.contractAddress, timestamp: { $gte: oneDayAgo } }).countDocuments();
      const code = await Codes.findOne({ chainId, codeId: contract.codeId }).lean();
      const verification = code ? await ContractVerifications.findOne({ result_hash: code.codeHash }, { _id: false, __v: false }).lean() : undefined;

      contractsWithStats.push({
        contract,
        dailyExecutions,
        verified: !!verification,
      })
    }

    return contractsWithStats;
}