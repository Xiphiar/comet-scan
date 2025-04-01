import { FC, ReactNode, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import useConfig from "../../hooks/useConfig";
import useAsync from "../../hooks/useAsync";
import ContentLoading from "../../components/ContentLoading";
import Card from "../../components/Card";
import TitleAndSearch from "../../components/TitleAndSearch";
import { SingleProposalPageResponse } from "../../interfaces/responses/explorerApiResponses";
import { getSingleProposalPage } from "../../api/pagesApi";
import ValidatorAvatar from "../../components/Avatar/KeybaseAvatar";
import { formatCoins, formatProposalStatus, formatProposalType } from "../../utils/format";
import { FrontendChainConfig } from "../../interfaces/config.interface";
import { defaultKeyContent } from "../../utils/messageParsing";
import { v1beta1LcdProposal, v1LcdProposal } from "../../interfaces/lcdProposalResponse";
import Spinner from "../../components/Spinner";
import { FaRegClock, FaVoteYea } from "react-icons/fa";
import { GrStatusGood, GrStatusCritical } from "react-icons/gr";
import { PiHandDepositBold } from "react-icons/pi";
import { BsFillPeopleFill } from "react-icons/bs";

const SingleProposalPage: FC = () => {
    const { chain: chainLookupId, proposalId } = useParams();
    const { getChain } = useConfig();
    const chain = getChain(chainLookupId);
    const { data, error } = useAsync<SingleProposalPageResponse>(getSingleProposalPage(chain.chainId, proposalId));
    const [parsedContent, setParsedContent] = useState<([string, string | ReactNode][]) | undefined>(undefined);

    useEffect(() => {
        const fetchParsedContent = async () => {
            if (!data) return;
            const content = await parseProposal(chain, data.proposal.proposal);
            setParsedContent(content);
        };
        fetchParsedContent();
    }, [data, chain]);

    if (!chain) {
        return (
            <div>
                <h1>Chain Not Found</h1>
            </div>
        )
    }

    if (!data) {
        return <ContentLoading chain={chain} title={`Proposal ${proposalId}`} error={error} />
    }

    const proposerDetails = data.proposingValidator?.descriptions.length ? data.proposingValidator.descriptions[0] : undefined;
    const totalNo = Number(data.proposal.tally.no) + Number(data.proposal.tally.no_with_veto);
    const totalYesNo = totalNo + Number(data.proposal.tally.yes);
    const totalWithAbstain = totalYesNo + Number(data.proposal.tally.abstain)
    const percentYes = Number(data.proposal.tally.yes) / totalYesNo;
    const turnoutPercent = totalWithAbstain / Number(data.bonded.amount)

    let proposalType = data.proposal.proposalType;
    if (proposalType.includes('MsgExecLegacyContent')) proposalType = (data.proposal.proposal as v1LcdProposal).messages?.[0]?.content?.['@type'] || proposalType;

    const statusIcon =
        data.proposal.status === 'PROPOSAL_STATUS_DEPOSIT_PERIOD' ? <PiHandDepositBold />
        : data.proposal.status === 'PROPOSAL_STATUS_VOTING_PERIOD' ? <FaVoteYea />
        : data.proposal.status === 'PROPOSAL_STATUS_PASSED' ? <GrStatusGood />
        : data.proposal.status === 'PROPOSAL_STATUS_FAILED'
        || data.proposal.status === 'PROPOSAL_STATUS_REJECTED' ? <GrStatusCritical />
        : <></>


    return (
        <div className='d-flex flex-column'>
            <TitleAndSearch chain={chain} title={`Proposal ${proposalId}`} />
            <div className='d-flex flex-wrap w-full'>
                <Card className='col col-12 col-sm-4'>
                    <div className='statTitle'><FaRegClock /><h5>Submitted</h5></div>
                    {new Date(data.proposal.submitTime).toLocaleString()}
                </Card>
                <Card className='col col-12 col-sm-4'>
                    <div className='statTitle'>{statusIcon}<h5>Status</h5></div>
                    {formatProposalStatus(data.proposal.status)}
                </Card>
                <Card className='col col-12 col-sm-4'>
                    <div className='statTitle'><BsFillPeopleFill /><h5>Turout</h5></div>
                    {(turnoutPercent * 100).toFixed(2)}%
                </Card>
            </div>
            <Card>
                <div className='d-flex flex-column gap-3 mt-3'>
                    <div className='d-flex'>
                        <div className='col-3 font-weight-bold'>Type</div>
                        <div className='col'>{formatProposalType(proposalType)}</div>
                    </div>
                    <div className='d-flex'>
                        <div className='col-3 font-weight-bold'>Title</div>
                        <div className='col'>{data.proposal.title}</div>
                    </div>
                    <div className='d-flex'>
                        <div className='col-3 font-weight-bold'>Summary</div>
                        <p className='col' style={{whiteSpace: 'pre-wrap'}}>{data.proposal.summary}</p>
                    </div>
                    <div className='d-flex'>
                        <div className='col-3 font-weight-bold'>Submit Time</div>
                        <div className='col'>{new Date(data.proposal.submitTime).toLocaleString()}</div>
                    </div>
                    <div className='d-flex'>
                        <div className='col-3 font-weight-bold'>Deposit End Time</div>
                        <div className='col'>
                            {new Date(data.proposal.depositEndTime).toLocaleString()}
                        </div>
                    </div>
                    <div className='d-flex'>
                        <div className='col-3 font-weight-bold'>Voting Start Time</div>
                        <div className='col'>
                            {new Date(data.proposal.votingStartTime).toLocaleString()}
                        </div>
                    </div>
                    <div className='d-flex'>
                        <div className='col-3 font-weight-bold'>Voting End Time</div>
                        <div className='col'>
                            {new Date(data.proposal.votingEndTime).toLocaleString()}
                        </div>
                    </div>
                    <div className='d-flex'>
                        <div className='col-3 font-weight-bold'>Proposer</div>
                        <div className='col d-flex gap-2 align-items-center'>
                            { data.proposingValidator ?
                                <Link to={`/${chainLookupId}/validators/${data.proposingValidator.operatorAddress}`} className='d-flex gap-2 align-items-center'>
                                    <ValidatorAvatar avatarUrl={proposerDetails?.keybaseAvatarUrl} moniker={proposerDetails?.moniker} operatorAddress={data.proposingValidator?.operatorAddress} />
                                    {proposerDetails?.moniker || data.proposingValidator?.operatorAddress}
                                </Link>
                            : data.proposal.proposer ?
                                <Link to={`/${chainLookupId}/accounts/${data.proposal.proposer}`}>{data.proposal.proposer}</Link>
                            : 'Unknown' }
                        </div>
                    </div>
                    { parsedContent === undefined ? (
                        <div className="d-flex justify-content-center">
                            <Spinner />
                        </div>
                    ) : parsedContent.map(([name, value]) => {
                        return (
                            <div className='d-flex'>
                                <div className='col-3 font-weight-bold'>{name}</div>
                                <div className='col'>
                                    {value}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </Card>
            <div className='d-flex flex-wrap w-full'>
                <Card className='col col-6 col-md-3'>
                    <h5>Yes</h5>
                    {((parseInt(data.proposal.tally.yes) / totalWithAbstain) * 100).toFixed(2)}%
                </Card>
                <Card className='col col-6 col-md-3'>
                    <h5>No</h5>
                    {((parseInt(data.proposal.tally.no) / totalWithAbstain) * 100).toFixed(2)}%
                </Card>
                <Card className='col col-6 col-md-3'>
                    <h5>Veto</h5>
                    {((parseInt(data.proposal.tally.no_with_veto) / totalWithAbstain) * 100).toFixed(2)}%
                </Card>
                <Card className='col col-6 col-md-3'>
                    <h5>Abstain</h5>
                    {((parseInt(data.proposal.tally.abstain) / totalWithAbstain) * 100).toFixed(2)}%
                </Card>
            </div>
        </div>
    )
}

export default SingleProposalPage;

const parseProposal = async (config: FrontendChainConfig, proposal: v1beta1LcdProposal | v1LcdProposal): Promise<[string, string | ReactNode][]> => {
    let content: any = undefined;
    if (config.govVersion === 'v1beta1') {
        content = (proposal as v1beta1LcdProposal).content;
    } else if (config.govVersion === 'v1') {
        const messages = (proposal as v1LcdProposal).messages;
        if (!messages.length) return [];
        if (messages[0].content) content = messages[0].content;
        else content = messages[0];
        
    } else return [];

    if (!content) return [];

    switch (content['@type']) {

        case '/cosmos.upgrade.v1beta1.SoftwareUpgradeProposal':
        case '/cosmos.upgrade.v1beta1.MsgSoftwareUpgrade': {
            const data: [string, string | ReactNode][] = [
                ['Upgrade Name', content.plan.name]
            ]
            if (content.plan.time !== '0001-01-01T00:00:00Z') data.push(['Upgrade Time', new Date(content.plan.time).toLocaleString()])
            if (content.plan.height && content.plan.height !== '0') data.push([
                'Upgrade Height',
                <Link to={`/${config.id}/blocks/${content.plan.height}`}>{parseInt(content.plan.height).toLocaleString()}</Link>
            ])
            if (content.plan.info) data.push(['Upgrade Info', defaultKeyContent(content.plan.info)])
            return data;
        }

        case '/cosmos.distribution.v1beta1.CommunityPoolSpendProposal': {
            return [
                ['Recipient', <Link to={`/${config.id}/accounts/${content.recipient}`}>{content.recipient}</Link>],
                ['Amount', await formatCoins(content.amount, config)]
            ]
        }

        case '/cosmos.params.v1beta1.ParameterChangeProposal': {
            return [
                ['Changes',
                    <div>
                        <div className='d-flex'>
                            <div className='col col-6 fw-bold'>Subspace and Key</div>
                            <div className='col col-6 fw-bold'>New Value</div>
                        </div>
                        {content.changes.map(change => {
                            return(
                                <div key={`${change.subspace}${change.key}${change.value}`} className='d-flex'>
                                    <div className='col col-6'>{change.subspace}/{change.key}</div>
                                    <div className='col col-6'>{defaultKeyContent(change.value)}</div>
                                </div>
                            )
                        })}
                    </div>
                ],
            ]
        }

        case '/secret.compute.v1beta1.MsgUpdateParams':
        case '/cosmos.gov.v1.MsgUpdateParams': {
            const changes: [string, string][] = [];
            const paramNames = Object.keys(content.params);
            paramNames.forEach(param => {
                let value = content.params[param];
                if (typeof value === 'object' || typeof value === 'boolean') value = JSON.stringify(value);
                changes.push([param, value])
            })
            return [
                ['Authority', <Link to={`/${config.id}/accounts/${content.authority}`}>{content.authority}</Link>],
                [
                    'Changes',
                    <div>
                        <div className='d-flex mb-1'>
                            <div className='col col-6 text-decoration-underline'>Param</div>
                            <div className='col col-6 text-decoration-underline'>New Value</div>
                        </div>
                        {changes.map(change => {
                            return(
                                <div key={`${change[0]}${change[1]}`} className='d-flex'>
                                    <div className='col col-6'>{change[0]}</div>
                                    <div className='col col-6'>{defaultKeyContent(change[1])}</div>
                                </div>
                            )
                        })}
                    </div>
                ],
            ]
        }

        case '/cosmos.consensus.v1.MsgUpdateParams': {
            const changes: [string, string][] = [];
            const {authority, abci, ...spaces} = content;
            const subspaceNames = Object.keys(spaces);

            subspaceNames.forEach(subspace => {
                if (subspace === '@type') return;

                const keys = Object.keys(spaces[subspace]);
                keys.forEach(key => {
                    const value = spaces[subspace][key];
                    changes.push([`${subspace}/${key}`, value])
                })
            })
            return [
                ['Authority', <Link to={`/${config.id}/accounts/${authority}`}>{authority}</Link>],
                [
                    'Changes',
                    <div>
                        <div className='d-flex mb-1'>
                            <div className='col col-6 text-decoration-underline'>Subspace and Key</div>
                            <div className='col col-6 text-decoration-underline'>New Value</div>
                        </div>
                        {changes.map(change => {
                            return(
                                <div key={`${change[0]}${change[1]}`} className='d-flex'>
                                    <div className='col col-6'>{change[0]}</div>
                                    <div className='col col-6'>{defaultKeyContent(change[1])}</div>
                                </div>
                            )
                        })}
                    </div>
                ],
            ]
        }

        case '/ibc.core.client.v1.MsgRecoverClient':
        case '/ibc.core.client.v1.ClientUpdateProposal': {
            return [
                ['Expired Client', content.subject_client_id],
                ['New Client', content.substitute_client_id],
            ]
        }

        default: {
            console.log(`Unknown Proposal Type ${content['@type']}:`, content);
            return []
        }
    }

}