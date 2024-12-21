import { api } from "encore.dev/api";
import mongoose from "mongoose";
import { importTransactionsForBlock } from "./importTransactions";
import { runImportTasks } from "./importTasks";
import { runUpdateTasks } from "./updateTasks";
import Blocks from "../models/blocks";

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
    // await Blocks.syncIndexes();

    // await runImportTasks();
    // await runUpdateTasks();

    // setInterval(runImportTasks, oneMinuteMs * 2)
    // setInterval(runUpdateTasks, tenMinuteMs * 2)
})();