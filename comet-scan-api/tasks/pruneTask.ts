import { getLatestBlock } from "../common/dbQueries";
import Chains from "../config/chains";
import { ChainConfig } from "@comet-scan/types";
import Blocks from "../models/blocks";
import Transactions from "../models/transactions";

const pruneBlocksForChain = async (chain: ChainConfig) => {
    if (!chain.pruneBlocksAfter) {
        console.log(`Skipping prune of ${chain.chainId}`)
        return;
    }

    const latestHeight = await getLatestBlock(chain.chainId);
    if (!latestHeight) return;

    const heightToPruneBefore = latestHeight.height - chain.pruneBlocksAfter;
    console.log(`Pruning blocks before height ${heightToPruneBefore} on ${chain.chainId}`);
    await Blocks.deleteMany({ chainId: chain.chainId, height: { $lt: heightToPruneBefore }});

    if (!chain.pruneTransactions) return;
    console.log(`Pruning transactions before height ${heightToPruneBefore} on ${chain.chainId}`);
    await Transactions.deleteMany({ chainId: chain.chainId, blockHeight: { $lt: heightToPruneBefore }});
}

export const pruneBlocksForAllChains = async () => {
    for (const chain of Chains) {
        await pruneBlocksForChain(chain);
    }
}