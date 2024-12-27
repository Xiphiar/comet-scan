import { Account } from "../models/accounts.interface";
import { Block, BlockWithProposer } from "../models/blocks.interface";
import { WasmCode } from "../models/codes.interface";
import { SecretWasmContract } from "../models/contracts.interface";
import { Proposal, ProposalWithProposingValidator } from "../models/proposals.interface";
import { Transaction } from "../models/transactions.interface";
import { Validator } from "../models/validators.interface";

export interface Amount {
  amount: string;
  denom: string;
  denomDecimals: number;
}

export interface OverviewPageResponse {
  metrics: {
    height: number;
    dailyTransactions: number;
    supply: Amount;
    bonded: Amount;
    bondRate: number;
    inflationRate: number;
    activeValidators: number;
    totalProposals: number;
  },
  topValidators: Validator[];
  recentProposals: Proposal[];
}

export interface StakingMetrics {
  activeValidators: number;
  bondRate: number;
  inflationRate: number;
  nominalApr: number;
  unbondingPeriodSeconds: number;
  communityPoolTax: number;
}

export interface ValidatorsPageResponse {
  validators: Validator[];
  stakingMetrics: StakingMetrics;
}

export interface SingleValidatorPageResponse {
  validator: Validator;
  rank: number;
  votingPower: number;
}

export interface BlocksPageResponse {
  dailyBlocks: number;
  blocks: BlockWithProposer[];
}

export interface SingleBlockPageResponse {
  block: Block;
  transactions: Transaction[];
  proposer: Validator | null;
}

export interface TransactionsPageResponse {
  dailyTransactions: number;
  transactions: Transaction[];
}

export interface SingleTransactionPageResponse {
  transaction: Transaction;
}

export interface AllProposalsPageResponse {
  proposals: ProposalWithProposingValidator[];
}

export interface SingleProposalPageResponse {
  proposal: Proposal;
  proposingValidator: Validator | null;
  bonded: Amount;
}

export interface SingleAccountPageResponse {
  account: Account;
  recentTransactions: Transaction[];
  instantiatedContracts: ContractWithStats<SecretWasmContract>[];
  administratedContracts: ContractWithStats<SecretWasmContract>[];
}

export interface ContractWithStats<T> {
  contract: T,
  verified: boolean;
  dailyExecutions: number;
}

export interface AllContractsPageResponse<T> {
  contracts: ContractWithStats<T>[],
  totalContracts: number;
  totalExecutions: number;
  dailyExecutions: number;
}

export interface SingleContractPageResponse<T> {
  contract: T,
  code: WasmCode,
  recentTransactions: Transaction[],
  dailyExecutions: number;
}