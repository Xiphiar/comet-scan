import { api, APIError, ErrCode } from "encore.dev/api";
import { dayMs, get24hTransactionsCount, getActiveValidatorsCount, getLatestBlock, getProposalsFromDb, getTopValidatorsFromDb, getValidatorsFromDb } from "../common/dbQueries";
import { getInflation, getStakingMetrics, getTotalBonded, getTotalSupply } from "../common/chainQueries";
import { OverviewPageResponse, SingleValidatorPageResponse, ValidatorsPageResponse, SingleBlockPageResponse, SingleTransactionPageResponse, TransactionsPageResponse, BlocksPageResponse, AllProposalsPageResponse, SingleProposalPageResponse, SingleAccountPageResponse, SingleContractPageResponse, AllContractsPageResponse, ContractWithStats } from "../interfaces/responses/explorerApiResponses";
import Validators from "../models/validators";
import Blocks from "../models/blocks";
import Transactions from "../models/transactions";
import { BlockWithProposer } from "../interfaces/models/blocks.interface";
import Proposals from "../models/proposals";
import { ProposalWithProposingValidator } from "../interfaces/models/proposals.interface";
import Accounts from "../models/accounts.model";
import { importAccount } from "../tasks/importAccounts";
import { Account } from "../interfaces/models/accounts.interface";
import { getChainConfig } from "../config/chains";
import { SecretWasmContract } from "../interfaces/models/contracts.interface";
import SecretContracts from "../models/contracts.model";
import Codes from "../models/codes.model";
import { addContractStats } from "../common/contracts";

export const getOverview = api(
  { expose: true, method: "GET", path: "/explorer/:chainId/overview" },
  async ({ chainId }: { chainId: string }): Promise<OverviewPageResponse> => {
    const latestBlock = await getLatestBlock(chainId);
    if (!latestBlock) throw `Chain ${chainId} not in DB.`

    const dailyTransactions = await get24hTransactionsCount(chainId);
    const supply = await getTotalSupply(chainId);
    const bonded = await getTotalBonded(chainId);
    const inflationRate = await getInflation(chainId);
    const proposals = await getProposalsFromDb(chainId);
    const topValidators = await getTopValidatorsFromDb(chainId, 5);
    const activeValidators = await getActiveValidatorsCount(chainId);

    return {
      metrics: {
        height: latestBlock.height,
        dailyTransactions,
        supply,
        bonded,
        bondRate: Number(bonded.amount) / Number(supply.amount),
        inflationRate,
        activeValidators,
        totalProposals: proposals.length,
      },
      recentProposals: proposals.slice(0, 5),
      topValidators,
    };

  }
);

export const getValidators = api(
  { expose: true, method: "GET", path: "/explorer/:chainId/validators" },
  async ({ chainId }: { chainId: string }): Promise<ValidatorsPageResponse> => {
    const validators = await getValidatorsFromDb(chainId, 'BOND_STATUS_BONDED');
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

    const allValidators = await getValidatorsFromDb(chainId, 'BOND_STATUS_BONDED');

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
    const blocks = await Blocks.find({ chainId }, { _id: false, __v: false }).sort('-timestamp').limit(30).lean();
    const dailyBlocks = await get24hTransactionsCount(chainId);

    const blocksWithProposers: BlockWithProposer[] = [];
    for (const block of blocks) {
      const proposerHex = block.block.result.block.header.proposer_address;
      const proposer = await Validators.findOne({ hexAddress: proposerHex }, { _id: false, __v: false}).lean();
      blocksWithProposers.push({ ...block, proposer })
    }

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


    return {
      transaction,
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

    let account: Account | null = await Accounts.findOne({ chainId, address }, { _id: false, __v: false }).lean();
    // if (!account) throw new APIError(ErrCode.NotFound, 'Account not found.');
    if (!account) account = await importAccount(chainId, address)

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

      let administratedContracts: SecretWasmContract[] = [];
      let instantiatedContracts: SecretWasmContract[] = [];

      if (config.features.includes('secretwasm')) {
        administratedContracts = await SecretContracts.find({ chainId, admin: address }, { _id: false, __v: false }).lean();
        instantiatedContracts = await SecretContracts.find({ chainId, creator: address }, { _id: false, __v: false }).lean();
      } else if (config.features.includes('cosmwasm')) {
        throw 'CosmWasm support TODO'
      }
    
    return {
      account,
      recentTransactions,
      administratedContracts: await addContractStats(chainId, administratedContracts),
      instantiatedContracts: await addContractStats(chainId, instantiatedContracts),
    };
  }
);

export const getContractsPage = api(
  { expose: true, method: "GET", path: "/explorer/:chainId/contracts" },
  async ({ chainId }: { chainId: string }): Promise<AllContractsPageResponse<any>> => {
    const config = getChainConfig(chainId);
    if (!config) throw new APIError(ErrCode.NotFound, 'Chain not found');

    let contracts: SecretWasmContract[] = [];
    let totalContracts = 0;
    if (config.features.includes('secretwasm')) {
      contracts = await SecretContracts.find({ chainId }, { _id: false, __v: false }).sort({ executions: -1}).limit(30).lean();
      totalContracts = await SecretContracts.find({ chainId }).countDocuments();
    } else {
      throw new APIError(ErrCode.Internal, 'CosmWasm TODO')
    }

    const now = new Date();
    const oneDayAgo = new Date(now.valueOf() - dayMs);
    const contractsWithStats: ContractWithStats<SecretWasmContract>[] = []
    for (const contract of contracts) {
      const dailyExecutions = await Transactions.find({ chainId, executedContracts: contract.contractAddress, timestamp: { $gte: oneDayAgo } }).countDocuments();
      const code = await Codes.findOne({ chainId, codeId: contract.codeId }).lean();

      contractsWithStats.push({
        contract,
        dailyExecutions,
        verified: code?.verified || false,
      })
    }

    const dailyExecutions = await Transactions.find({ chainId, 'executedContracts.0': { $exists: true}, timestamp: { $gte: oneDayAgo } }).countDocuments();
    const totalExecutions = await Transactions.find({ chainId, 'executedContracts.0': { $exists: true} }).countDocuments();

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
  async ({ chainId, contractAddress }: { chainId: string, contractAddress: string }): Promise<SingleContractPageResponse<SecretWasmContract | unknown>> => {
    const config = getChainConfig(chainId);
    if (!config) throw new APIError(ErrCode.NotFound, 'Chain not found');

    let contract: SecretWasmContract | null = null;
    if (config.features.includes('secretwasm')) {
      contract = await SecretContracts.findOne({ chainId, contractAddress }, { _id: false, __v: false }).lean();
      if (!contract) throw new APIError(ErrCode.NotFound, 'Contract not found');
    } else {
      throw new APIError(ErrCode.Internal, 'CosmWasm TODO')
    }

    const code = await Codes.findOne({ chainId, codeId: contract.codeId }, { _id: false, __v: false }).lean();
    if (!code) throw new APIError(ErrCode.NotFound, 'Contract code not found');

    const recentTransactions = await Transactions.find({ chainId, executedContracts: contractAddress }, { _id: false, __v: false }).sort({height: -1}).limit(20).lean();

    const now = new Date();
    const oneDayAgo = new Date(now.valueOf() - dayMs);
    const dailyExecutions = await Transactions.find({ chainId, executedContracts: contractAddress, timestamp: { $gte: oneDayAgo } }).countDocuments();

    return {
      contract, 
      code,
      recentTransactions,
      dailyExecutions,
    }
  }
);