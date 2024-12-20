import { Coin } from "./models/blocks.interface";

export type v1beta1LcdProposal = {
  proposal_id: string
  content: CommunityPoolSpendProposal | ({ "@type": string } & any);
  status: string
  final_tally_result: {
    yes: string
    abstain: string
    no: string
    no_with_veto: string
  }
  submit_time: string
  deposit_end_time: string
  total_deposit: Coin[];
  voting_start_time: string
  voting_end_time: string
  is_expedited: boolean
}

export type LcdProposalResponse = {
  proposal: v1beta1LcdProposal;
}



export interface CommunityPoolSpendProposal {
  "@type": '/cosmos.distribution.v1beta1.CommunityPoolSpendProposal';
  title: string;
  description: string;
  recipient: string;
  amount: Coin[];
}
  


// v1 Stuff
export interface v1LcdProposal {
  id: string
  messages: Message[]
  status: string
  final_tally_result: FinalTallyResult
  submit_time: string
  deposit_end_time: string
  total_deposit: TotalDeposit[]
  voting_start_time: string
  voting_end_time: string
  metadata: string
  title: string
  summary: string
  proposer: string
  expedited: boolean
  failed_reason: string
}

export interface Message {
  "@type": string
  content: any[]
  authority: string
}

export interface FinalTallyResult {
  yes_count: string
  abstain_count: string
  no_count: string
  no_with_veto_count: string
}

export interface TotalDeposit {
  denom: string
  amount: string
}