import { getLatestBlock, getOldestBlock } from "../common/dbQueries";
import { getSecretTokenPermitSupport } from "../common/chainQueries";
import Chains from "../config/chains";
import { ChainConfig } from "@comet-scan/types";
import Blocks from "../models/blocks";
import Codes from "../models/codes.model";
import Contracts from "../models/contracts.model";
import KvStore from "../models/kv";
import Transactions from "../models/transactions";
import { addVoteToDb, processTxMessages } from "./common";
import { getExecutedContractsForTx } from "./importTransactions";

const addExecutedContractsToTransactions = async (config: ChainConfig) => {
    if (!config.features.includes('secretwasm') && !config.features.includes('cosmwasm')) return;
    console.log(`Starting task "Add Executed Contracts to Transactions" on ${config.chainId}`)
    try {
        const latest = await getLatestBlock(config.chainId);
        const oldest = await getOldestBlock(config.chainId);
        if (!latest || !oldest) throw 'Unable to get latest and oldest block';
        console.log(`Block Range: ${oldest.height.toLocaleString()} - ${latest.height.toLocaleString()}`)

        const totalBlocks = latest.height - oldest.height;

        let current = oldest.height;
        while (current < latest.height) {
            if (current % 100 === 0) console.log(((current - oldest.height) / totalBlocks * 100).toFixed(2), '%', config.chainId)
            const txs = await Transactions.find({ chainId: config.chainId, blockHeight: current }).lean();
            for (const tx of txs) {
                if (tx.executedContracts?.length) continue;
                const executedContracts = getExecutedContractsForTx(config, tx.transaction.tx_response);
                if (executedContracts.length) await Transactions.findByIdAndUpdate(tx._id, { $set: { executedContracts } })
            }
        current++;
        }


        console.log(`Finished task "Add Executed Contracts to Transactions" on ${config.chainId}`)
    } catch (err: any) {
        console.log(`Task "Add Executed Contracts to Transactions" on ${config.chainId} failed:`, err.toString())
    }
}

export const addExecutedContractsToTransactionsForAllChains = async () => {
    for (const chain of Chains) {
        addExecutedContractsToTransactions(chain);
    }
}

const addBlockTimesToExistingBlocks = async (config: ChainConfig) => {
    console.log(`Starting task "Adding Block Times to Existing Blocks" on ${config.chainId}`)
    try {
        const latest = await getLatestBlock(config.chainId);
        const oldest = await getOldestBlock(config.chainId);
        if (!latest || !oldest) throw 'Unable to get latest and oldest block';
        console.log(`Block Range: ${oldest.height.toLocaleString()} - ${latest.height.toLocaleString()}`)

        const totalBlocks = latest.height - oldest.height;

        let currentHeight = oldest.height;
        let previousTimestamp: Date | undefined = undefined;
        while (currentHeight < latest.height) {
            if (currentHeight % 1000 === 0) console.log(((currentHeight - oldest.height) / totalBlocks * 100).toFixed(2), '%')

            const block = await Blocks.findOne({ chainId: config.chainId, height: currentHeight }).lean();
            if (!block) {
                currentHeight++;
                continue;
            }
            if (!previousTimestamp) {
                currentHeight++;
                previousTimestamp = block.timestamp;
                continue;
            }
            if (block.blockTime) {
                currentHeight++;
                previousTimestamp = block.timestamp;
                continue;
            }

            // Time since previous block in MS
            const blockTime = block.timestamp.valueOf() - previousTimestamp.valueOf();

            await Blocks.findByIdAndUpdate(block._id, { $set: { blockTime } });
            currentHeight++;
            previousTimestamp = block.timestamp;
        }
    } catch (err: any) {
        console.log(`Task "Adding Block Times to Existing Blocks" on ${config.chainId} failed:`, err.toString())
    }
};

export const addBlockTimesToExistingBlocksForAllChains = async () => {
    for (const chain of Chains) {
        await addBlockTimesToExistingBlocks(chain);
    }
}

const parseVotesFromTransactions = async ({chainId}: ChainConfig) => {
    try {
        const latest = await getLatestBlock(chainId);
        const oldest = await getOldestBlock(chainId);
        if (!latest) throw 'Could not find latest block';
        if (!oldest) throw 'Could not find oldest block';

        const total = latest.height - oldest.height;
        console.log(`Found ${total} blocks to process: ${oldest.height} - ${latest.height}`)

        // Loop through all blocks, oldest to newest since newer votes will overwrite previous votes
        for (let i = oldest.height; i <= latest.height; i++) {
            const percent = ((i - oldest.height) / total) * 100
            console.log('Parsing', chainId, i, `${percent.toFixed(2)}%`);

            const txs = await Transactions.find({ chainId, blockHeight: i }).lean();
            if (!txs.length) continue;

            for (const tx of txs) {
                await processTxMessages(tx);
            }

        }
    } catch (err: any) {
        console.error(`Migration Failed: Error parsing votes from transactions on ${chainId}:`, err, err.toString())
    }
}

export const parseVotesFromTransactionsForAllChains = async () => {
    for (const chain of Chains) {
        parseVotesFromTransactions(chain);
    }
}

const recheckTokenPermitSupport = async (config: ChainConfig) => {
    const migrationKey = `migration_recheck_permit_support_${config.chainId}`;
    
    // Check if migration has already been run
    const existingMigration = await KvStore.findOne({ 
        chainId: config.chainId, 
        key: migrationKey 
    });
    
    if (existingMigration) {
        console.log(`Migration "Recheck Token Permit Support" already completed for ${config.chainId}`);
        return;
    }

    console.log(`Starting migration "Recheck Token Permit Support" on ${config.chainId}`);
    
    try {
        // Find all unique code IDs that have token contracts
        const tokenCodeIds = await Contracts.distinct('codeId', {
            chainId: config.chainId,
            tokenInfo: { $exists: true }
        });

        console.log(`Found ${tokenCodeIds.length} unique code IDs with token contracts on ${config.chainId}`);

        for (const codeId of tokenCodeIds) {
            try {
                // Get code hash for this code ID
                const code = await Codes.findOne({ chainId: config.chainId, codeId }).lean();
                if (!code) {
                    console.warn(`Code ${codeId} not found in database, skipping`);
                    continue;
                }

                // Find one contract with this code ID to test permit support
                const sampleContract = await Contracts.findOne({
                    chainId: config.chainId,
                    codeId,
                    tokenInfo: { $exists: true }
                }).lean();

                if (!sampleContract) continue;

                // Check permit support for this contract
                const permitSupport = await getSecretTokenPermitSupport(
                    config.chainId, 
                    sampleContract.contractAddress, 
                    code.codeHash
                );

                // Update all contracts with this code ID
                const updateResult = await Contracts.updateMany(
                    {
                        chainId: config.chainId,
                        codeId,
                        tokenInfo: { $exists: true }
                    },
                    {
                        $set: { 'tokenInfo.permitSupport': permitSupport }
                    }
                );

                console.log(`Updated ${updateResult.modifiedCount} contracts with code ID ${codeId} (permitSupport: ${permitSupport})`);

            } catch (err: any) {
                console.error(`Error checking permit support for code ID ${codeId}:`, err.message);
            }
        }

        // Mark migration as complete
        await KvStore.create({
            chainId: config.chainId,
            key: migrationKey,
            value: new Date().toISOString()
        });

        console.log(`Completed migration "Recheck Token Permit Support" on ${config.chainId}`);

    } catch (err: any) {
        console.error(`Migration "Recheck Token Permit Support" failed on ${config.chainId}:`, err.message);
    }
}

const parseMessageTypesFromTransactions = async (chainId = 'secret-4') => {
    try {
        const migrationKey = `parsed-message-types-from-transactions-${chainId}`;

        // Check if migration has already been run
        const existingMigration = await KvStore.findOne({ 
            chainId, 
            key: migrationKey 
        });
        
        if (existingMigration) {
            console.log(`Migration "parseMessageTypesFromTransactions" already completed for ${chainId}`);
            return;
        }

        console.log(`Starting migration "parseMessageTypesFromTransactions" on ${chainId}`);

        const latest = await getLatestBlock(chainId);
        const oldest = await getOldestBlock(chainId);
        if (!latest) throw 'Could not find latest block';
        if (!oldest) throw 'Could not find oldest block';

        const total = latest.height - oldest.height;
        console.log(`Found ${total} blocks to process: ${oldest.height} - ${latest.height}`)

        // Loop through all blocks, latest to oldest
        for (let i = latest.height; i >= oldest.height; i--) {
            const percent = ((latest.height - i) / total) * 100;
            console.log('Parsing', chainId, i, `${percent.toFixed(2)}%`);

            const txs = await Transactions.find({ chainId, blockHeight: i }).lean();
            if (!txs.length) continue;

            for (const tx of txs) {
                // Skip transactions where messageTypes is already defined.
                if (Array.isArray(tx.messageTypes)) continue;

                const messageTypes: string[] = [];
                for (const message of tx.transaction.tx.body.messages) {
                    if (!messageTypes.includes(message["@type"])) messageTypes.push(message["@type"])
                }

                await Transactions.findByIdAndUpdate(tx._id, {
                    $set: {messageTypes: messageTypes}
                })
            }
        }

        // Mark migration as complete
        await KvStore.create({
            chainId: chainId,
            key: migrationKey,
            value: new Date().toISOString()
        });

        console.log(`Completed migration "parseMessageTypesFromTransactions" on ${chainId}`);
    } catch (err: any) {
        console.error(`Migration Failed: Error parsing messages from transactions on ${chainId}:`, err, err.toString())
    }
}

export const runMigrations = async () => {
    console.log('Starting migrations...');
    
    for (const chain of Chains) {
        // Only run migrations that use KV store for tracking
        if (chain.features.includes('secretwasm')) {
            await recheckTokenPermitSupport(chain);
            await parseMessageTypesFromTransactions();
        }
    }
    
    console.log('All migrations completed.');
}