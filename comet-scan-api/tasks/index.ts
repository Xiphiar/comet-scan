import { CronJob } from "encore.dev/cron";
import { api } from "encore.dev/api";
import Chains from "../config/chains";
import importBlocks from "../tasks/importBlocks";
import mongoose from "mongoose";
import { updateValidatorsForAllChains } from "./updateValidators";
import importTransactions, { importTransactionsForBlock } from "./importTransactions";
import { updateProposalsForChain } from "./updateProposals";

let IT_RUNNING = false;
const runImportTasks = async () => {
    if (IT_RUNNING === true) {
        console.log('Import Tasks already running.')
        return;
    }
    IT_RUNNING = true;
    for (const chain of Chains) {
        await importBlocks(chain);
        await importTransactions(chain.chainId);
    }

    IT_RUNNING = false;
}

let UT_RUNNING = false;
const runUpdateTasks = async () => {
    if (UT_RUNNING === true) {
        console.log('Update Tasks already running.')
        return;
    }
    UT_RUNNING = true;

    await updateValidatorsForAllChains();

    for (const chain of Chains) {
        await updateProposalsForChain(chain);
    }


    UT_RUNNING = false;
}

interface Response {
    message: string;
}

export const runTasksApi = api({ expose: true, method: 'GET' }, runImportTasks)

export const getAllProposals = api(
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
    await runImportTasks();
    await runUpdateTasks();

    setInterval(runImportTasks, oneMinuteMs)
    setInterval(runUpdateTasks, tenMinuteMs)
})();