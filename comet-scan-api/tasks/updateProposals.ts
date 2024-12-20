import { ChainConfig } from "../config/chains";
import axios from "axios";
import { getTopValidatorsFromDb } from "../common/dbQueries";
import Proposals from "../models/proposals";
import { Proposal, ProposalStatus, ValidatorVote } from "../interfaces/models/proposals.interface";
import Blocks from "../models/blocks";
import Transactions from "../models/transactions";
import { v1beta1LcdProposal, v1LcdProposal } from "../interfaces/lcdProposalResponse";

export const updateProposalsForChain = async (chain: ChainConfig) => {
    if (chain.govVersion === 'v1') return await updateProposalsForChain_v1(chain);
    else return await updateProposalsForChain_v1beta1(chain);
}

export const updateProposalsForChain_v1beta1 = async (chain: ChainConfig) => {
    const url = `${chain.lcd}/cosmos/gov/${chain.govVersion}/proposals`;
    const {data} = await axios.get(url, {
        params: {
            'pagination.limit': 1000,
        }
    });

    const proposals: v1beta1LcdProposal[] = data.proposals;

    for (const prop of proposals) {
        console.log(`Updating proposal ${prop.proposal_id} on ${chain.chainId}`)
        const existingProposal = await Proposals.findOne({ chainId: chain.chainId, id: prop.proposal_id }).lean();
        let validatorVotes = existingProposal?.validatorVotes || [];
        
        if (prop.status === 'PROPOSAL_STATUS_VOTING_PERIOD' || !validatorVotes.length) {
            // validatorVotes = await getValidatorVotes(chain, prop.proposal_id);
        }

        // Try to find block based on submit time
        const submitTime = new Date(prop.submit_time);
        const d1 = new Date(submitTime.setMilliseconds(0))
        const d2 = new Date(submitTime.setMilliseconds(999))
        // const block = await Blocks.findOne({ chainId: chain.chainId, timestamp: submitTime }).lean();
        const transactions = await Transactions.find({ chainId: chain.chainId, timestamp: { $gte: d1, $lte: d2 }}).lean();
        
        const submitPropTx = transactions.find(tx => {
            const submitMsg = tx.transaction.tx.body.messages.find(msg => msg["@type"].includes('MsgSubmitProposal') && msg.content.title === prop.content.title);
            if (submitMsg) return true;
            else return false;
        })
        const submitMsg = submitPropTx?.transaction.tx.body.messages.find(msg => msg["@type"].includes('MsgSubmitProposal') && msg.content.title === prop.content.title);
        const proposer = submitMsg?.proposer || (submitPropTx ? submitPropTx.signers[0] : undefined)

        // Upsert Proposal
        const newProp: Proposal = {
            chainId: chain.chainId,
            id: prop.proposal_id,
            title: prop.content.title,
            summary: prop.content.summary,
            proposalType: prop.content["@type"],
            status: prop.status as ProposalStatus,
            proposer,
            submitTime: new Date(prop.submit_time),
            depositEndTime: new Date(prop.deposit_end_time),
            votingStartTime: new Date(prop.voting_start_time),
            votingEndTime: new Date(prop.voting_end_time),
            validatorVotes,
            proposal: prop,
            expedited: prop.is_expedited || false,
        }

        await Proposals.findOneAndUpdate({ chainId: chain.chainId, id: prop.proposal_id }, newProp, { upsert: true })
    }
}

export const updateProposalsForChain_v1 = async (chain: ChainConfig) => {
    const url = `${chain.lcd}/cosmos/gov/${chain.govVersion}/proposals`;
    const {data} = await axios.get(url, {
        params: {
            'pagination.limit': 1000,
        }
    });

    const proposals: v1LcdProposal[] = data.proposals;

    for (const prop of proposals) {
        console.log(`Updating proposal ${prop.id} on ${chain.chainId}`)

        const msg = prop.messages[0];
        const existingProposal = await Proposals.findOne({ chainId: chain.chainId, id: prop.id }).lean();
        let validatorVotes = existingProposal?.validatorVotes || [];
        
        if (prop.status === 'PROPOSAL_STATUS_VOTING_PERIOD' || !validatorVotes.length) {
            validatorVotes = await getValidatorVotes(chain, prop.id);
        }

        // Upsert Proposal
        const newProp: Proposal = {
            chainId: chain.chainId,
            id: prop.id,
            title: prop.title,
            summary: prop.summary,
            proposalType: msg?.["@type"] || 'Unknown',
            status: prop.status as ProposalStatus,
            proposer: prop.proposer,
            submitTime: new Date(prop.submit_time),
            depositEndTime: new Date(prop.deposit_end_time),
            votingStartTime: new Date(prop.voting_start_time),
            votingEndTime: new Date(prop.voting_end_time),
            validatorVotes,
            proposal: prop,
            expedited: prop.expedited || false,
        }

        await Proposals.findOneAndUpdate({ chainId: chain.chainId, id: prop.id }, newProp, { upsert: true })
    }
}

const getValidatorVotes = async (chain: ChainConfig, proposalId: string): Promise<ValidatorVote[]> => {
    // The votes endpoint seems to be broken?
    const activeValidators = await getTopValidatorsFromDb(chain.chainId, 1000);
    const valVotes: ValidatorVote[] = []
    for (const val of activeValidators) {
        try {
            const {data} = await axios.get(`${chain.lcd}/cosmos/gov/${chain.govVersion}/proposals/${proposalId}/votes/${val.accountAddress}`)
            if (data?.vote?.option && data.vote.option !== 'VOTE_OPTION_UNSPECIFIED') valVotes.push({
                operatorAddress: val.operatorAddress,
                vote: data.vote.option,
            }) 
        } catch (err) {}
    }

    return valVotes;
}