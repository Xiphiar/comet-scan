import { getOldestBlock, getTopValidatorsFromDb } from "../common/dbQueries";
import Proposals from "../models/proposals";
import { Proposal, ProposalStatus, ValidatorVote } from "../interfaces/models/proposals.interface";
import Transactions from "../models/transactions";
import { v1beta1LcdProposal, v1LcdProposal } from "../interfaces/lcdProposalResponse";
import { ChainConfig } from "../interfaces/config.interface";
import { getLcdClient } from "../config/clients";
import Blocks from "../models/blocks";
import { getTotalBonded } from "../common/chainQueries";
import { getSecretWasmClient } from "../common/cosmWasmClient";

export const updateProposalsForChain = async (chain: ChainConfig) => {
    if (chain.govVersion === 'v1') return await updateProposalsForChain_v1(chain);
    else return await updateProposalsForChain_v1beta1(chain);
}

export const updateProposalsForChain_v1beta1 = async (chain: ChainConfig) => {
    const lcdClient = getLcdClient(chain.chainId);
    const url = `/cosmos/gov/${chain.govVersion}/proposals`;
    const data = await lcdClient.get<any>(url, {
        params: {
            'pagination.limit': 1000,
        }
    });

    const proposals: v1beta1LcdProposal[] = data.proposals;

    for (const prop of proposals) {
        // console.log(`Updating proposal ${prop.proposal_id} on ${chain.chainId}`)
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

        const tallyData = await lcdClient.get<any>(`/cosmos/gov/v1beta1/proposals/${prop.proposal_id}/tally`);

        const totalBondedAtEnd = existingProposal?.totalBondedAtEnd ?
            existingProposal.totalBondedAtEnd
        :
            await getTotalBondedAtDate(chain, new Date(prop.voting_end_time));

        // Upsert Proposal
        const newProp: Proposal = {
            chainId: chain.chainId,
            id: prop.proposal_id,
            title: prop.content.title,
            summary: prop.content.summary || prop.content.description,
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
            totalBondedAtEnd,
            tally: {
                yes: tallyData.tally.yes,
                no: tallyData.tally.no,
                no_with_veto: tallyData.tally.no_with_veto,
                abstain: tallyData.tally.abstain,
            }
        }

        await Proposals.findOneAndUpdate({ chainId: chain.chainId, id: prop.proposal_id }, {$set: newProp}, { upsert: true })
    }
}

export const updateProposalsForChain_v1 = async (chain: ChainConfig) => {
    const lcdClient = getLcdClient(chain.chainId);
    const url = `/cosmos/gov/${chain.govVersion}/proposals`;
    const data = await lcdClient.get<any>(url, {
        params: {
            'pagination.limit': 1000,
        }
    });

    const proposals: v1LcdProposal[] = data.proposals;

    console.log(`Found ${proposals.length} proposals on ${chain.chainId}`)

    for (const prop of proposals) {
        // console.log(`Updating proposal ${prop.id} on ${chain.chainId}`)

        const msg = prop.messages[0];
        const existingProposal = await Proposals.findOne({ chainId: chain.chainId, id: prop.id }).lean();
        let validatorVotes = existingProposal?.validatorVotes || [];
        
        if (prop.status === 'PROPOSAL_STATUS_VOTING_PERIOD' || !validatorVotes.length) {
        //     validatorVotes = await getValidatorVotes(chain, prop.id);
        }

        const tallyData = await lcdClient.get<any>(`/cosmos/gov/v1/proposals/${prop.id}/tally`);

        const totalBondedAtEnd = existingProposal?.totalBondedAtEnd ?
            existingProposal.totalBondedAtEnd
        :
            await getTotalBondedAtDate(chain, new Date(prop.voting_end_time));

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
            totalBondedAtEnd,
            tally: {
                yes: tallyData.tally.yes || tallyData.tally.yes_count,
                no: tallyData.tally.no || tallyData.tally.no_count,
                no_with_veto: tallyData.tally.no_with_veto || tallyData.tally.no_with_veto_count,
                abstain: tallyData.tally.abstain || tallyData.tally.abstain_count,
            }
        }

        await Proposals.findOneAndUpdate({ chainId: chain.chainId, id: prop.id }, {$set: newProp}, { upsert: true })
    }
}

const getValidatorVotes = async (chain: ChainConfig, proposalId: string): Promise<ValidatorVote[]> => {
    const lcdClient = getLcdClient(chain.chainId);

    // The votes endpoint seems to be broken?
    const activeValidators = await getTopValidatorsFromDb(chain.chainId, 1000);
    const valVotes: ValidatorVote[] = []
    for (const val of activeValidators) {
        try {
            const data = await lcdClient.get<any>(`/cosmos/gov/${chain.govVersion}/proposals/${proposalId}/votes/${val.accountAddress}`)
            if (data?.vote?.option && data.vote.option !== 'VOTE_OPTION_UNSPECIFIED') valVotes.push({
                operatorAddress: val.operatorAddress,
                vote: data.vote.option,
            }) 
        } catch (err) {}
    }

    return valVotes;
}

const getTotalBondedAtDate = async ({chainId, bondingDecimals}: ChainConfig, date: Date): Promise<string | undefined> => {
    // Get the block just after the date
    const block = await Blocks.findOne({ chainId, timestamp: { $gte: date } }).sort({ timestamp: 1 }).lean();
    const oldestBlock = await getOldestBlock(chainId);
    if (!block || !oldestBlock) return undefined;

    // If the clostest height is the same as the oldest height in the DB, then the prop likely ended
    // before the first block in the DB, so we don't know the proper height and should return undefined.
    if (block.height === oldestBlock.height) return undefined;

    // Try to get bonded amount at that height
    try {
        const totalBondedResponse = await getTotalBonded(chainId, block.height.toString());
        return totalBondedResponse.amount;
    } catch (err: any) {
        // Do nothing and try to get it using VP below
    }

    // Cosmos SDK 0.50 update broke querying pre-upgrade bond pools, so we can try to query the validator set to get a rough number.
    // Not entirely accurate but seems to be within 1000 tokens of the bond pool response amount.
    try {
        const client = await getSecretWasmClient(chainId, true);

        const valSet = await client.query.tendermint.getValidatorSetByHeight(
            {
                height: block.height.toString(),
                pagination: {
                    limit: '1000',
                }
            },
        );
        if (!valSet.pagination?.total) {
            console.error('Error getting total bonded at date using val set: valSet.pagination.total is undefined.')
            return undefined;
        }
        if (!valSet.validators) {
            console.error('Error getting total bonded at date using val set: valSet.validators is undefined.')
            return undefined;
        }
        if (parseInt(valSet.pagination.total) !== valSet.validators.length) {
            console.error('Error getting total bonded at date using val set: Pagination total does not match array length.')
        }

        // Get the total voting power of the validator set
        const totalVp = valSet.validators.reduce(
            (sum, val) => sum + BigInt(val.voting_power || '0'),
            0n,
        )
        const totalVpString = totalVp.toString();

        // VP is whole coins, so pad the end with 0's to return the base denom (e.g. uDENOM, aDENOM, or wei)
        return totalVpString.padEnd(totalVpString.length + bondingDecimals, '0')
    } catch {
        // Do nothing and return undefined below
    }

    return undefined;
}