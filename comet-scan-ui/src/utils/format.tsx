import { ReactElement } from "react";
import { Coin } from "../interfaces/models/blocks.interface";
import { ProposalStatus } from "../interfaces/models/proposals.interface";
import { getDenomDetails } from "./denoms";
import { weiFormatFixed, weiFormatNice } from "./coin";

export const truncateString = (str: string, charactersToKeep = 6) => {
    if (str.length < charactersToKeep * 2) return str;
    const start = str.substring(0, charactersToKeep);
    const end = str.substring(str.length - charactersToKeep);
    return `${start}...${end}`
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
        case '/cosmos.upgrade.v1beta1.SoftwareUpgradeProposal': return 'Software Upgrade';
        case '/cosmos.upgrade.v1beta1.MsgSoftwareUpgrade': return 'Software Upgrade';
        case '/cosmos.distribution.v1beta1.CommunityPoolSpendProposal': return 'Community Pool Spend';
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

export const formatCoin = (coin: Coin): string => {
    console.log('Coin', coin)
    const details = getDenomDetails(coin.denom);

    return `${weiFormatNice(coin.amount, details.decimals)} ${details.symbol}`
}

export const formatAmounts = (coins: Coin[]): ReactElement => <div>
    {coins.map((coin: Coin) => {
        return <div>{formatCoin(coin)}</div>
    })}
</div> 

export const formatCoins = formatAmounts;