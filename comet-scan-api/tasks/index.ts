import { api, APIError, ErrCode } from "encore.dev/api";
import mongoose from "mongoose";
import { importTransactionsForBlock } from "./importTransactions";
import { runUpdateTasks } from "./updateTasks";
import Blocks from "../models/blocks";
import Accounts from "../models/accounts.model";
import Transactions from "../models/transactions";
import Contracts from "../models/contracts.model";
import { updateContractsForAllChains } from "./importContracts";
import { importSecretWasmContractsByCodeId } from "./secretwasm.tasks";
import dotenv from 'dotenv';
import { getChainConfig } from "../config/chains";
import { pruneBlocksForAllChains } from "./pruneTask";
import { updateContractExecutedCountsForAllChains } from "./updateContractExecCounts";
import { addExecutedContractsToTransactionsForAllChains } from "./migrations";
import { syncAllChains } from "./sync";
dotenv.config();

interface Response {
    message: string;
}

// export const runTasksApi = api({ expose: true, method: 'GET' }, runImportTasks)

export const importBlockTransactions = api(
  { expose: true, method: "GET", path: "/tasks/:chainId/import_block_transactions/:blockHeight" },
  async ({ chainId, blockHeight }: { chainId: string, blockHeight: number }): Promise<{ status: string }> => {
    await importTransactionsForBlock(chainId, blockHeight)

    return {
      status: 'OK',
    };
  }
);

export const importSecretContractsForCode = api(
  { expose: true, method: "GET", path: "/tasks/:chainId/import_secretwasm_code_contracts/:codeId" },
  async ({ chainId, codeId }: { chainId: string, codeId: string }): Promise<{ status: string }> => {
    const config = getChainConfig(chainId);
    if (!config) throw new APIError(ErrCode.NotFound, 'Chain not found');
    if (!config.features.includes('secretwasm')) throw new APIError(ErrCode.Unimplemented, 'SecretWasm not enabled for chain');

    try {
      await importSecretWasmContractsByCodeId(config, codeId);
    } catch (err: any) {
      console.error(`Error updating contracts for code ID ${codeId} on ${config.chainId}:`, err)
    }

    return {
      status: 'OK',
    };
  }
);

// const _ = new CronJob("run-tasks", {
// 	title: "Run tasks",
// 	every: "30m",
// 	endpoint: test,
// })

const connectToDb = async () => {
    console.log('Connecting DB...')
    if (!process.env.MONGODB_CONNECTION_STRING) throw 'Environment variable MONGODB_CONNECTION_STRING is undefined'
    await mongoose.connect(process.env.MONGODB_CONNECTION_STRING);
    console.log('DB Connected!')
}

const oneHourMs = 60 * 60 * 1000
const threeHoursMs = oneHourMs * 3;
const twelveHourMs = oneHourMs * 12;

const oneMinuteMs = 60 * 1000;
const tenMinuteMs = oneMinuteMs * 10;

(async()=>{
    await connectToDb();
    // await Transactions.syncIndexes();
    // await Blocks.syncIndexes();
    // await Accounts.syncIndexes();
    // await SecretContracts.syncIndexes();
    // await Contracts.syncIndexes();
    console.log('Indexes Synced');

    syncAllChains();
    setInterval(syncAllChains, 30 * 1000)

    await runUpdateTasks();
    updateContractExecutedCountsForAllChains();
    updateContractsForAllChains();
    pruneBlocksForAllChains();

    setInterval(runUpdateTasks, tenMinuteMs)
    setInterval(updateContractExecutedCountsForAllChains, tenMinuteMs * 3)
    setInterval(updateContractsForAllChains, twelveHourMs * 2)
    setInterval(pruneBlocksForAllChains, oneHourMs)
})();