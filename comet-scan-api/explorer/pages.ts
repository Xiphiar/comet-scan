import { api, APIError, ErrCode } from "encore.dev/api";
import { dayMs, get24hBlocksCount, get24hContractExecutionsCount, get24hTotalExecutionsCount, get24hTransactionsCount, getActiveValidatorsCount, getLatestBlock, getOldestBlock, getProposalsFromDb, getTopValidatorsFromDb, getTotalExecutionsCount, getValidatorsFromDb, hourMs } from "../common/dbQueries";
import { getInflation, getStakingMetrics, getTotalBonded, getTotalSupply } from "../common/chainQueries";
import { OverviewPageResponse, SingleValidatorPageResponse, ValidatorsPageResponse, SingleBlockPageResponse, SingleTransactionPageResponse, TransactionsPageResponse, BlocksPageResponse, AllProposalsPageResponse, SingleProposalPageResponse, SingleAccountPageResponse, SingleContractPageResponse, AllContractsPageResponse, ContractWithStats, SingleCodePageResponse, PaginatedTransactionsResponse, StatusPageResponse, ChainStatus } from "../interfaces/responses/explorerApiResponses";
import Validators from "../models/validators";
import Blocks from "../models/blocks";
import Transactions from "../models/transactions";
import { BlockWithProposer } from "../interfaces/models/blocks.interface";
import Proposals from "../models/proposals";
import { ProposalWithProposingValidator } from "../interfaces/models/proposals.interface";
import Accounts from "../models/accounts.model";
import { importAccount } from "../tasks/importAccounts";
import { Account } from "../interfaces/models/accounts.interface";
import Chains, { getChainConfig } from "../config/chains";
import { LightWasmContract, WasmContract } from "../interfaces/models/contracts.interface";
import Contracts from "../models/contracts.model";
import Codes from "../models/codes.model";
import { addContractStats } from "../common/contracts";
import { ProposerInfo } from "../interfaces/models/validators.interface";
import ContractVerifications from "../models/contractVerifications.model";

export const getOverview = api(
  { expose: true, method: "GET", path: "/explorer/:chainId/overview" },
  async ({ chainId }: { chainId: string }): Promise<OverviewPageResponse> => {
    console.time('Latest Block');
    const latestBlock = await getLatestBlock(chainId);
    if (!latestBlock) throw `Chain ${chainId} not in DB.`
    console.timeEnd('Latest Block');

    console.time('24h Txs');
    const dailyTransactions = await get24hTransactionsCount(chainId);
    console.timeEnd('24h Txs');

    console.time('Supply');
    const supply = await getTotalSupply(chainId);
    console.timeEnd('Supply');

    console.time('Bonded');
    const bonded = await getTotalBonded(chainId);
    console.timeEnd('Bonded');

    console.time('Inflation');
    const inflationRate = await getInflation(chainId);
    console.timeEnd('Inflation');

    console.time('Proposals');
    const proposals = await getProposalsFromDb(chainId);
    console.timeEnd('Proposals');

    console.time('Top Vals');
    const topValidators = await getTopValidatorsFromDb(chainId, 5);
    console.timeEnd('Top Vals');

    console.time('Active Vals');
    const activeValidators = await getActiveValidatorsCount(chainId);
    console.timeEnd('Active Vals');

    return {
      metrics: {
        height: latestBlock.height,
        dailyTransactions,
        supply,
        bonded,
        // Sometimes we fail to get the supply, so we need to avoid division by zero to avoid the entire page breaking
        bondRate: Number(bonded.amount) / (Number(supply.amount) || 1),
        inflationRate,
        activeValidators,
        totalProposals: proposals.length,
      },
      recentProposals: proposals.slice(0, 5),
      topValidators,
    };

  }
);

export const getActiveValidators = api(
  { expose: true, method: "GET", path: "/explorer/:chainId/validators" },
  async ({ chainId }: { chainId: string }): Promise<ValidatorsPageResponse> => {
    console.time('Get Validators')
    const validators = await getValidatorsFromDb(chainId, ['BOND_STATUS_BONDED']);
    console.timeEnd('Get Validators')

    console.time('Get Staking Metrics')
    const stakingMetrics = await getStakingMetrics(chainId);
    console.timeEnd('Get Staking Metrics')

    return {
      validators,
      stakingMetrics,
    };
  }
);

export const getInactiveValidators = api(
  { expose: true, method: "GET", path: "/explorer/:chainId/validators/inactive" },
  async ({ chainId }: { chainId: string }): Promise<ValidatorsPageResponse> => {
    const validators = await getValidatorsFromDb(chainId, ['BOND_STATUS_UNBONDED', 'BOND_STATUS_UNBONDED', 'BOND_STATUS_UNBONDING']);
    const stakingMetrics = await getStakingMetrics(chainId);

    return {
      validators,
      stakingMetrics,
    };
  }
);

export const getSingleValidator = api(
  { expose: true, method: "GET", path: "/explorer/:chainId/validators/:operatorAddress" },
  async ({ chainId, operatorAddress }: { chainId: string, operatorAddress: string }): Promise<SingleValidatorPageResponse> => {
    const validator = await Validators.findOne({ operatorAddress }, { _id: false, __v: false }).lean();
    if (!validator) throw new APIError(ErrCode.NotFound, "Validator not found"); 

    const allValidators = await getValidatorsFromDb(chainId, ['BOND_STATUS_BONDED']);

    const bonded = await getTotalBonded(chainId);

    const rankedIndex = allValidators.findIndex(v => v.operatorAddress === validator.operatorAddress);

    const delegatedBigInt = BigInt(validator.delegatedAmount || 0);
    const totalBondedBigInt = BigInt(bonded.amount);
    const votingPower = Number(delegatedBigInt * 10000n / totalBondedBigInt) / 10000;

    return {
      validator,
      rank: rankedIndex + 1,
      votingPower,
    };
  }
);

export const getBlocksPage = api(
  { expose: true, method: "GET", path: "/explorer/:chainId/blocks" },
  async ({ chainId }: { chainId: string }): Promise<BlocksPageResponse> => {
    console.time('Recent Blocks')
    const blocks = await Blocks.find({ chainId }, { _id: false, __v: false }).sort('-timestamp').limit(30).lean();
    console.timeEnd('Recent Blocks')

    console.time('Daily Blocks')
    const dailyBlocks = await get24hBlocksCount(chainId);
    console.timeEnd('Daily Blocks')

    console.time('Blocks With Proposers')
    const validators = await Validators.find({ chainId }, { _id: false, __v: false}).lean();
    const blocksWithProposers: BlockWithProposer[] = [];
    for (const block of blocks) {
      const proposerHex = block.block.result.block.header.proposer_address;
      // const proposer = await Validators.findOne({ hexAddress: proposerHex }, { _id: false, __v: false}).lean();
      const proposerValidator = validators.find(v => v.hexAddress === proposerHex);
      const proposer: ProposerInfo | null = proposerValidator ? {
        operatorAddress: proposerValidator.operatorAddress,
        latestDescription: proposerValidator.descriptions.length ? proposerValidator.descriptions[0] : undefined,
      } : null;
      blocksWithProposers.push({ ...block, proposer })
    }
    console.timeEnd('Blocks With Proposers')

    return {
      blocks: blocksWithProposers,
      dailyBlocks,
    };
  }
);

export const getSingleBlockPage = api(
  { expose: true, method: "GET", path: "/explorer/:chainId/blocks/:height" },
  async ({ chainId, height }: { chainId: string, height: string }): Promise<SingleBlockPageResponse> => {
    const _block = await Blocks.findOne({ chainId, height}, { _id: false, __v: false }).lean();
    if (!_block) throw new APIError(ErrCode.NotFound, 'Block not found');

    const transactions = await Transactions.find({ chainId, blockHeight: height }, { _id: false, __v: false }).lean();

    const { transactions: _, ...block } = _block as any;

    const proposerHex = _block.block.result.block.header.proposer_address;
    const proposer = await Validators.findOne({ hexAddress: proposerHex }, { _id: false, __v: false}).lean();

    return {
      block,
      transactions,
      proposer,
    };
  }
);

export const getTransactionsPage = api(
  { expose: true, method: "GET", path: "/explorer/:chainId/transactions" },
  async ({ chainId }: { chainId: string }): Promise<TransactionsPageResponse> => {
    const transactions = await Transactions.find({ chainId }, { _id: false, __v: false }).sort('-timestamp').limit(30).lean();
    const dailyTransactions = await get24hTransactionsCount(chainId);

    return {
      transactions,
      dailyTransactions,
    };
  }
);

export const getSingleTransactionPage = api(
  { expose: true, method: "GET", path: "/explorer/:chainId/transactions/:hash" },
  async ({ chainId, hash }: { chainId: string, hash: string }): Promise<SingleTransactionPageResponse> => {
    const transaction = await Transactions.findOne({ chainId, hash }, { _id: false, __v: false }).lean();
    if (!transaction) throw new APIError(ErrCode.NotFound, 'Transaction not found');

    const uniqueExecutedContracts = Array.from(new Set(transaction.executedContracts));
    const executedContractInfo: LightWasmContract[] = [];
    for (const contractAddress of uniqueExecutedContracts) {
      const contract = await Contracts.findOne({ chainId, contractAddress }).lean();
      if (!contract) continue;
      executedContractInfo.push({
        chainId,
        contractAddress,
        label: contract.label,
        tokenInfo: contract.tokenInfo,
        nftInfo: contract.nftInfo,
      })
    }


    return {
      transaction,
      executedContracts: executedContractInfo
    };
  }
);

export const getAllProposals = api(
  { expose: true, method: "GET", path: "/explorer/:chainId/proposals" },
  async ({ chainId }: { chainId: string }): Promise<AllProposalsPageResponse> => {
    const proposals = await getProposalsFromDb(chainId, 1000);
    console.log('proposals', proposals.length)

    const propsWithSubmittingVal: ProposalWithProposingValidator[] = [];
    for (const prop of proposals) {
      if (!prop.proposer) {
        propsWithSubmittingVal.push({ ...prop, proposingValidator: null })
      } else {
        const proposingValidator = await Validators.findOne({ chainId, accountAddress: prop.proposer }, { _id: false, __v: false}).lean();
        propsWithSubmittingVal.push({ ...prop, proposingValidator })
      }
    }

    return {
      proposals: propsWithSubmittingVal,
    };
  }
);

export const getSingleProposal = api(
  { expose: true, method: "GET", path: "/explorer/:chainId/proposals/:proposalId" },
  async ({ chainId, proposalId }: { chainId: string, proposalId: string }): Promise<SingleProposalPageResponse> => {
    const proposal = await Proposals.findOne({ chainId, id: proposalId }, { _id: false, __v: false }).lean();
    if (!proposal) throw new APIError(ErrCode.NotFound, 'Proposal not found');

    const bonded = await getTotalBonded(chainId);
    const proposingValidator = proposal.proposer ? await Validators.findOne({ chainId, accountAddress: proposal.proposer }, { _id: false, __v: false}).lean() : null;
    
    return {
      proposal,
      proposingValidator,
      bonded
    };
  }
);

export const getSingleAccount = api(
  { expose: true, method: "GET", path: "/explorer/:chainId/accounts/:address" },
  async ({ chainId, address }: { chainId: string, address: string }): Promise<SingleAccountPageResponse> => {
    const config = getChainConfig(chainId);
    if (!config) throw new APIError(ErrCode.NotFound, 'Chain not found');

    let account: Account | null = await Accounts.findOne({ chainId, address }, { _id: false, __v: false }).lean();
    if (!account) account = await importAccount(chainId, address)
    if (!account) throw new APIError(ErrCode.NotFound, 'Account not found');

    const recentTransactions = await Transactions.find({
      chainId,
      $or: [
        { signers: address },
        { senders: address },
        { recipients: address },
        { feePayer: address },
        { feeGranter: address },
      ]
    }, { _id: false, __v: false })
      .sort({blockHeight: -1})
      .limit(10)
      .lean();

    const totalTransactions = await Transactions.countDocuments({
      chainId,
      $or: [
        { signers: address },
        { senders: address },
        { recipients: address },
        { feePayer: address },
        { feeGranter: address },
      ]
    });

      let administratedContracts: WasmContract[] = [];
      let instantiatedContracts: WasmContract[] = [];

      if (config.features.includes('secretwasm') || config.features.includes('cosmwasm')) {
        administratedContracts = await Contracts.find({ chainId, admin: address }, { _id: false, __v: false }).lean();
        instantiatedContracts = await Contracts.find({ chainId, creator: address }, { _id: false, __v: false }).lean();
      }
    
    return {
      account,
      recentTransactions,
      totalTransactions,
      administratedContracts: await addContractStats(chainId, administratedContracts),
      instantiatedContracts: await addContractStats(chainId, instantiatedContracts),
    };
  }
);

export const getContractsPage = api(
  { expose: true, method: "GET", path: "/explorer/:chainId/contracts" },
  async ({ chainId }: { chainId: string }): Promise<AllContractsPageResponse> => {
    const config = getChainConfig(chainId);
    if (!config) throw new APIError(ErrCode.NotFound, 'Chain not found');

    let contracts: WasmContract[] = [];
    let totalContracts = 0;
    if (config.features.includes('secretwasm') || config.features.includes('cosmwasm')) {
      console.time('Top Contracts')
      contracts = await Contracts.find({ chainId }, { _id: false, __v: false }).sort({ executions: -1 }).limit(30).lean();
      console.timeEnd('Top Contracts')

      console.time('Total Contracts')
      totalContracts = await Contracts.find({ chainId }).countDocuments();
      console.timeEnd('Total Contracts')
    }

    console.time('Contracts With Stats')
    const now = new Date();
    const contractsWithStats: ContractWithStats[] = []
    for (const contract of contracts) {
      const dailyExecutions = await get24hContractExecutionsCount(chainId, contract.contractAddress);
      const verification = await ContractVerifications.findOne({ chain_id: chainId, code_id: contract.codeId, verified: true }, { _id: false, __v: false }).lean();

      contractsWithStats.push({
        contract,
        dailyExecutions,
        verified: !!verification,
      })
    }
    console.timeEnd('Contracts With Stats')

    console.time('Daily Executions')
    const dailyExecutions = await get24hTotalExecutionsCount(chainId);
    console.timeEnd('Daily Executions')

    console.time('Total Executions')
    const totalExecutions = await getTotalExecutionsCount(chainId);
    console.timeEnd('Total Executions')

    return {
      contracts: contractsWithStats,
      totalContracts,
      dailyExecutions,
      totalExecutions,
    }
  }
);

export const getSingleContract = api(
  { expose: true, method: "GET", path: "/explorer/:chainId/contracts/:contractAddress" },
  async ({ chainId, contractAddress }: { chainId: string, contractAddress: string }): Promise<SingleContractPageResponse> => {
    const config = getChainConfig(chainId);
    if (!config) throw new APIError(ErrCode.NotFound, 'Chain not found');
    if (!config.features.includes('secretwasm') && !config.features.includes('cosmwasm')) throw new APIError(ErrCode.Unimplemented, 'Cosmwasm not enabled for this chain');

    const contract = await Contracts.findOne({ chainId, contractAddress }, { _id: false, __v: false }).lean();
    if (!contract) throw new APIError(ErrCode.NotFound, 'Contract not found');

    const code = await Codes.findOne({ chainId, codeId: contract.codeId }, { _id: false, __v: false }).lean();
    if (!code) throw new APIError(ErrCode.NotFound, 'Contract code not found');

    let verification: any = await ContractVerifications.findOne({ chain_id: chainId, code_id: contract.codeId, verified: true }, { _id: false, __v: false }).lean();
    if (verification) verification = {
      ...verification,
      code_zip: verification.code_zip.buffer.toString('base64'),
    }

    const recentTransactions = await Transactions.find({ chainId, executedContracts: contractAddress }, { _id: false, __v: false }).sort({height: -1}).limit(20).lean();

    const now = new Date();
    const oneDayAgo = new Date(now.valueOf() - dayMs);
    const dailyExecutions = await Transactions.find({ chainId, executedContracts: contractAddress, timestamp: { $gte: oneDayAgo } }).countDocuments();

    return {
      contract, 
      code,
      recentTransactions,
      dailyExecutions,
      verification: verification || undefined,
    }
  }
);

export const getSingleCode = api(
  { expose: true, method: "GET", path: "/explorer/:chainId/codes/:codeId" },
  async ({ chainId, codeId }: { chainId: string, codeId: string }): Promise<SingleCodePageResponse> => {
    const config = getChainConfig(chainId);
    if (!config) throw new APIError(ErrCode.NotFound, 'Chain not found');
    if (!config.features.includes('secretwasm') && !config.features.includes('cosmwasm')) throw new APIError(ErrCode.Unimplemented, 'Cosmwasm not enabled for this chain');

    const code = await Codes.findOne({ chainId, codeId: codeId }, { _id: false, __v: false }).lean();
    if (!code) throw new APIError(ErrCode.NotFound, 'Contract code not found');

    let verification: any = await ContractVerifications.findOne({ chain_id: chainId, code_id: codeId, verified: true }, { _id: false, __v: false }).lean();
    if (verification) verification = {
      ...verification,
      code_zip: verification.code_zip.buffer.toString('base64'),
    }

    const _contracts = await Contracts.find({ chainId, codeId }, { _id: false, __v: false }).lean();
    const contracts = await addContractStats(chainId, _contracts);

    return {
      code,
      contracts,
      verification: verification || undefined,
    }
  }
);

export const getAccountTransactionsPage = api(
  { expose: true, method: "GET", path: "/explorer/:chainId/accounts/:address/transactions/:pageNumber" }, // 1-indexed page number
  async ({ chainId, address, pageNumber = 1 }: { chainId: string, address: string, pageNumber?: number }): Promise<PaginatedTransactionsResponse> => {
    const config = getChainConfig(chainId);
    if (!config) throw new APIError(ErrCode.NotFound, 'Chain not found');

    let account: Account | null = await Accounts.findOne({ chainId, address }, { _id: false, __v: false }).lean();
    if (!account) account = await importAccount(chainId, address)
    if (!account) throw new APIError(ErrCode.NotFound, 'Account not found');

    const {docs, totalDocs, limit, page} = await Transactions.paginate(
      {
        chainId,
        $or: [
          { signers: address },
          { senders: address },
          { recipients: address },
          { feePayer: address },
          { feeGranter: address },
        ]
      },
      {
        sort: {blockHeight: -1},
        page: pageNumber,
        limit: 10,
        projection: { _id: false, __v: false },
        lean: true,
      }
    );
    
    return {
      transactions: docs,
      total: totalDocs,
      page: page || pageNumber,
      per_page: limit,
    };
  }
);

export const getStatusPage = api(
  { expose: true, method: "GET", path: "/explorer/status" },
  async (): Promise<StatusPageResponse> => {
    const chainStatuses: ChainStatus[] = [];

    for (const { lcds, rpc, frontendLcd, startHeight, ...chain } of Chains) {
      const earliestBlock = await getOldestBlock(chain.chainId);
      const latestBlock = await getLatestBlock(chain.chainId);

      if (!earliestBlock) throw new APIError(ErrCode.Internal, `Failed to get the earliest block for chain ${chain.chainId}`);
      if (!latestBlock) throw new APIError(ErrCode.Internal, `Failed to get the latest block for chain ${chain.chainId}`);

      chainStatuses.push({
        chainConfig: {...chain, lcd: frontendLcd},
        earliestBlockHeight: earliestBlock.height,
        earliestBlockTime: earliestBlock.timestamp.toISOString(),
        latestBlockHeight: latestBlock.height,
        latestBlockTime: latestBlock.timestamp.toISOString(),
      })
    }

    return {
      chainStatuses
    }
  }
);

// Returns a non-200 code if the latest block for a given chain is more than an hour old.
export const getChainStatus = api(
  { expose: true, method: "GET", path: "/explorer/status/:chainId" },
  async ({ chainId }: { chainId: string }): Promise<string> => {
    const chain = getChainConfig(chainId);
    if (!chain) throw new APIError(ErrCode.NotFound, 'Chain not found');

    const latestBlock = await getLatestBlock(chain.chainId);
    if (!latestBlock) throw new APIError(ErrCode.Internal, 'Latest block not found');

    const nowMs = new Date().valueOf();
    const latestMs = latestBlock.timestamp.valueOf();
    const latestBlockAgeMs = nowMs - latestMs;

    if (latestBlockAgeMs > hourMs) throw new APIError(ErrCode.Internal, `Latest block is ${Math.ceil(latestBlockAgeMs / 1000)} seconds old.`)
    return latestBlock.timestamp.toISOString();
  }
);