import { ProposalStatus } from "../interfaces/models/proposals.interface";

export const truncateString = (str: string, charactersToKeep = 6) => {
    if (str.length < charactersToKeep * 2) return str;
    const start = str.substring(0, charactersToKeep);
    const end = str.substring(str.length - charactersToKeep);
    return `${start}...${end}`
}

export const formatTxType = (txType: string) => {
    switch(txType) {
        case '/secret.compute.v1beta1.MsgExecuteContract': return 'Execute Contract';
        case '/ibc.core.client.v1.MsgUpdateClient': return 'Update IBC Client';
        case '/ibc.core.channel.v1.MsgAcknowledgement': return 'IBC Packet Acknowledgement';
        case '/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward': return 'Claim Rewards';
        case '/cosmos.staking.v1beta1.MsgDelegate': return 'Delegate';
        case '/cosmos.bank.v1beta1.MsgSend': return 'Send Coins';
        case '/cosmos.gov.v1beta1.MsgSubmitProposal': return 'Submit Proposal';
        case '/cosmos.gov.v1.MsgSubmitProposal': return 'Submit Proposal';
        default: return txType;
    }
}

export const formatProposalStatus = (status: ProposalStatus) => {
    switch(status) {
        case 'PROPOSAL_STATUS_PASSED': return 'Passed';
        case 'PROPOSAL_STATUS_REJECTED': return 'Rejected';
        case 'PROPOSAL_STATUS_DEPOSIT_PERIOD': return 'Deposit Period';
        case 'PROPOSAL_STATUS_VOTING_PERIOD': return 'Voting Period';
        case 'PROPOSAL_STATUS_FAILED': return 'Failed';
        default: return (status as string).replace('PROPOSAL_STATUS_', '');
    }
}

export const formatProposalType = (type: string) => {
    switch(type) {
        case '/cosmos.upgrade.v1beta1.SoftwareUpgradeProposal': return 'Upgrade';
        case '/cosmos.upgrade.v1beta1.MsgSoftwareUpgrade': return 'Upgrade';
        case '/cosmos.distribution.v1beta1.CommunityPoolSpendProposal': return 'Spend';
        case '/cosmos.params.v1beta1.ParameterChangeProposal': return 'Parameter Change';
        case '/cosmos.consensus.v1.MsgUpdateParams': return 'Parameter Change';
        case '/cosmos.gov.v1beta1.TextProposal': return 'Text';
        case '/ibc.core.client.v1.ClientUpdateProposal': return 'IBC Client Update';
        case '/ibc.core.client.v1.MsgRecoverClient': return 'IBC Client Update';
        default: return type.replace(/\/.*v1beta1\./, '').replace(/\/.*v1\./, '');
        // default: return type;
    }
}

export const stringToColor = (str?: string) => {
    if (!str) return '#1985a1';

    let hash = 0;
    str.split('').forEach(char => {
      hash = char.charCodeAt(0) + ((hash << 5) - hash)
    })
    let colour = '#'
    for (let i = 0; i < 3; i++) {
      const value = (hash >> (i * 8)) & 0xff
      colour += value.toString(16).padStart(2, '0')
    }
    return colour
  }