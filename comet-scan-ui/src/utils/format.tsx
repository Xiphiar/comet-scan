import { ReactElement } from "react";
import { Coin } from "../interfaces/models/blocks.interface";
import { ProposalStatus } from "../interfaces/models/proposals.interface";
import { getDenomDetails } from "./denoms";
import { weiFormatFixed, weiFormatNice } from "./coin";
import { FrontendChainConfig } from "../interfaces/config.interface";

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
        case '/cosmos.gov.v1.MsgUpdateParams': return 'Parameter Change';
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

export const formatCoin = async (coin: Coin, chainConfig: FrontendChainConfig): Promise<string> => {
    console.log('Coin', coin)
    const details = await getDenomDetails(coin.denom, chainConfig);

    return `${weiFormatNice(coin.amount, details.decimals)} ${details.symbol}`
}

export const formatAmounts = async (coins: Coin[], chainConfig: FrontendChainConfig): Promise<ReactElement> => {
    const elements = [];
    for (let i = 0; i < coins.length; i++) {
        const coin = coins[i];
        const formatted = await formatCoin(coin, chainConfig);
        elements.push(<div key={i}>{formatted}</div>);
    }
    return <div>{elements}</div>;
}

export const formatCoins = formatAmounts;

export const maybePlural = (str: string, amount: number | bigint, capital = false) => {
    const S = capital ? 'S' : 's';
    if (Number(amount) === 1) return str;
    else return `${str}${S}`
}

export const MinuteMs = 60 * 1000;
export const HourMs = MinuteMs * 60;
export const DayMs = HourMs * 24;
export const formatTime = (date: string | Date) => {
    const now = new Date();
    date = new Date(date);
    const msOld = now.valueOf() - date.valueOf();

    if (msOld < MinuteMs) {
        const seconds = Math.ceil(msOld / 1000);
        return `${seconds} ${maybePlural('second', seconds)} ago`
    }
    if (msOld < HourMs) {
        const minutes = Math.ceil(msOld / MinuteMs);
        return `${minutes} ${maybePlural('minute', minutes)} ago`
    }
    if (msOld < DayMs) {
        const hours = Math.ceil(msOld / HourMs);
        return `${hours} ${maybePlural('hour', hours)} ago`
    }
    const days = Math.ceil(msOld / DayMs);
    return `${days} ${maybePlural('day', days)} ago`
}

export const formatTimeSeconds = (seconds: number, compressed: boolean = false) => {
    if (seconds < 60) {
        const secondsFormatted = seconds.toLocaleString(undefined, { maximumFractionDigits: 2 });
        return compressed ? `${secondsFormatted}s` : `${secondsFormatted} seconds`;
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);

    if (seconds < 3600) {
        if (compressed) {
            return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
        }
        return remainingSeconds > 0 ? `${minutes} minute${minutes !== 1 ? 's' : ''} ${remainingSeconds} seconds` : `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }

    const hours = Math.floor(seconds / 3600);
    const hoursRemainingMinutes = Math.floor((seconds % 3600) / 60);
    const hoursRemainingSeconds = Math.round(seconds % 60);

    if (seconds < 86400) {
        if (compressed) {
            const parts = [`${hours}h`];
            if (hoursRemainingMinutes > 0) parts.push(`${hoursRemainingMinutes}m`);
            if (hoursRemainingSeconds > 0) parts.push(`${hoursRemainingSeconds}s`);
            return parts.join(' ');
        }
        const parts = [`${hours} hour${hours !== 1 ? 's' : ''}`];
        if (hoursRemainingMinutes > 0) parts.push(`${hoursRemainingMinutes} minute${hoursRemainingMinutes !== 1 ? 's' : ''}`);
        if (hoursRemainingSeconds > 0) parts.push(`${hoursRemainingSeconds} seconds`);
        return parts.join(' ');
    }

    const days = Math.floor(seconds / 86400);
    const daysRemainingHours = Math.floor((seconds % 86400) / 3600);
    const daysRemainingMinutes = Math.floor((seconds % 3600) / 60);
    const daysRemainingSeconds = Math.round(seconds % 60);

    if (compressed) {
        const parts = [`${days}d`];
        if (daysRemainingHours > 0) parts.push(`${daysRemainingHours}h`);
        if (daysRemainingMinutes > 0) parts.push(`${daysRemainingMinutes}m`);
        if (daysRemainingSeconds > 0) parts.push(`${daysRemainingSeconds}s`);
        return parts.join(' ');
    }

    const parts = [`${days} day${days !== 1 ? 's' : ''}`];
    if (daysRemainingHours > 0) parts.push(`${daysRemainingHours} hour${daysRemainingHours !== 1 ? 's' : ''}`);
    if (daysRemainingMinutes > 0) parts.push(`${daysRemainingMinutes} minute${daysRemainingMinutes !== 1 ? 's' : ''}`);
    if (daysRemainingSeconds > 0) parts.push(`${daysRemainingSeconds} seconds`);
    return parts.join(' ');
}
