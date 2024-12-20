import { FC } from "react";
import { Link, useParams } from "react-router-dom";
import { Chains } from "../../config/chains";
import useAsync from "../../hooks/useAsync";
import ContentLoading from "../../components/ContentLoading";
import Card from "../../components/Card";
import TitleAndSearch from "../../components/TitleAndSearch";
import { SingleProposalPageResponse } from "../../interfaces/responses/explorerApiResponses";
import { getSingleProposalPage } from "../../api/pagesApi";
import KeybaseAvatar from "../../components/Avatar/KeybaseAvatar";
import { formatProposalStatus } from "../../utils/format";

const SingleProposalPage: FC = () => {
    const { chain: chainLookupId, proposalId } = useParams();
    const chain = Chains.find(c => c.id.toLowerCase() === chainLookupId?.toLowerCase());
    const { data } = useAsync<SingleProposalPageResponse>(getSingleProposalPage(chain.chainId, proposalId));

    if (!chain) {
        return (
            <div>
                <h1>Chain Not Found</h1>
            </div>
        )
    }

    if (!data) {
        return <ContentLoading chain={chain} title={`Proposal ${proposalId}`} />
    }

    const proposerDetails = data.proposingValidator?.descriptions.length ? data.proposingValidator.descriptions[0] : undefined;
    const totalNo = Number(data.proposal.proposal.final_tally_result.no) + Number(data.proposal.proposal.final_tally_result.no_with_veto);
    const totalYesNo = totalNo + Number(data.proposal.proposal.final_tally_result.yes);
    const totalWithAbstain = totalYesNo + Number(data.proposal.proposal.final_tally_result.abstain)
    const percentYes = Number(data.proposal.proposal.final_tally_result.yes) / totalYesNo;
    const turnoutPercent = totalWithAbstain / Number(data.bonded.amount)
    return (
        <div className='d-flex flex-column gap-2 mx-4'>
            <TitleAndSearch chain={chain} title={`Proposal ${proposalId}`} />
            <div className='d-flex gap-2 w-full'>
                <Card className='col'>
                    <h5>Submitted</h5>
                    {new Date(data.proposal.submitTime).toLocaleString()}
                </Card>
                <Card className='col'>
                    <h5>Status</h5>
                    {formatProposalStatus(data.proposal.status)}
                </Card>
                <Card className='col'>
                    <h5>Voted Yes</h5>
                    {(percentYes * 100).toFixed(2)}%
                </Card>
                <Card className='col'>
                    <h5>Turout</h5>
                    {(turnoutPercent * 100).toFixed(2)}%
                </Card>
            </div>
            <Card>
                <div className='d-flex flex-column gap-3 mt-3'>
                    <div className='d-flex'>
                        <div className='col-3 font-weight-bold'>Type</div>
                        <div className='col'>{data.proposal.proposalType}</div>
                    </div>
                    <div className='d-flex'>
                        <div className='col-3 font-weight-bold'>Title</div>
                        <div className='col'>{data.proposal.title}</div>
                    </div>
                    <div className='d-flex'>
                        <div className='col-3 font-weight-bold'>Summary</div>
                        <p className='col'>{data.proposal.summary}</p>
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
                                <Link to={`${chainLookupId}/validators/${data.proposingValidator.operatorAddress}`} className='d-flex gap-2 align-items-center'>
                                    <KeybaseAvatar identity={proposerDetails?.identity} moniker={proposerDetails?.moniker} />
                                    {proposerDetails?.moniker || data.proposingValidator?.operatorAddress}
                                </Link>
                            : data.proposal.proposer ?
                                <Link to={`${chainLookupId}/accounts/${data.proposal.proposer}`}>{data.proposal.proposer}</Link>
                            : 'Unknown' }
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    )
}

export default SingleProposalPage;