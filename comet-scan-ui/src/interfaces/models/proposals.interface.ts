import { v1beta1LcdProposal, v1LcdProposal } from "../lcdProposalResponse";
import { Validator } from "./validators.interface";

export type ProposalStatus = 'PROPOSAL_STATUS_DEPOSIT_PERIOD' | 'PROPOSAL_STATUS_VOTING_PERIOD' | 'PROPOSAL_STATUS_PASSED' | 'PROPOSAL_STATUS_REJECTED' | 'PROPOSAL_STATUS_FAILED';
export type VoteOption = 'VOTE_OPTION_YES' | 'VOTE_OPTION_NO' | 'VOTE_OPTION_NO_WITH_VETO ' | 'VOTE_OPTION_ABSTAIN';

export interface ValidatorVote {
    operatorAddress: string;
    vote: VoteOption;
}

export interface Proposal {
    chainId: string;
    id: string;
    title: string;
    summary: string;
    proposalType: string;
    status: ProposalStatus;
    proposer: string | undefined;
    submitTime: Date;
    depositEndTime: Date;
    votingStartTime: Date;
    votingEndTime: Date;
    validatorVotes: ValidatorVote[];
    proposal: v1beta1LcdProposal | v1LcdProposal;
    expedited: boolean;
    totalBondedAtEnd: string | undefined;
    tally: {
        yes: string;
        no: string;
        no_with_veto: string;
        abstain: string;
    }
}

export interface ProposalWithProposingValidator extends Proposal {
    proposingValidator: Validator | null;
}