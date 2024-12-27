import { api } from "encore.dev/api";
import mongoose from "mongoose";
import { addExecutedContractsToTransactions, importTransactionsForBlock } from "./importTransactions";
import { runImportTasks } from "./importTasks";
import { runUpdateTasks } from "./updateTasks";
import Blocks from "../models/blocks";
import Accounts from "../models/accounts.model";
import Transactions from "../models/transactions";
import Contracts from "../models/contracts.model";
import { updateContractExecutedCountsForAllChains, updateContractsForAllChains } from "./importContracts";

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

// const _ = new CronJob("run-tasks", {
// 	title: "Run tasks",
// 	every: "30m",
// 	endpoint: test,
// })

const connectToDb = async () => {
    console.log('Connecting DB...')
    await mongoose.connect('mongodb://127.0.0.1:27017/chain-analytics-test');
    console.log('DB Connected!')
}

const threeHoursMs = 60 * 60 * 3 * 1000;
const oneMinuteMs = 60 * 1000;
const tenMinuteMs = oneMinuteMs * 10;

(async()=>{
    await connectToDb();
    // await Transactions.syncIndexes();
    // await Blocks.syncIndexes();
    // await Accounts.syncIndexes();
    // await SecretContracts.syncIndexes();

    // await addExecutedContractsToTransactions('secret-4')

    // await updateContractExecutedCountsForAllChains();
    // await runImportTasks();
    await runUpdateTasks();
    // await updateContractsForAllChains();

    setInterval(runImportTasks, oneMinuteMs * 3)
    setInterval(runUpdateTasks, tenMinuteMs * 2)
})();