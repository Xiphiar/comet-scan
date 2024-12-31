import { FC } from "react";
import { Link, useParams } from "react-router-dom";
import useConfig from "../../hooks/useConfig";
import useAsync from "../../hooks/useAsync";
import ContentLoading from "../../components/ContentLoading";
import Card from "../../components/Card";
import TitleAndSearch from "../../components/TitleAndSearch";
import { SingleProposalPageResponse } from "../../interfaces/responses/explorerApiResponses";
import { getSingleProposalPage } from "../../api/pagesApi";
import ValidatorAvatar from "../../components/Avatar/KeybaseAvatar";
import { formatProposalStatus } from "../../utils/format";

const SingleProposalPage: FC = () => {
    const { chain: chainLookupId, proposalId } = useParams();
    const { getChain } = useConfig();
    const chain = getChain(chainLookupId);
    const { data, error } = useAsync<SingleProposalPageResponse>(getSingleProposalPage(chain.chainId, proposalId));

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
    return (
        <div className='d-flex flex-column mx-4'>
            <TitleAndSearch chain={chain} title={`Proposal ${proposalId}`} />
            <div className='d-flex flex-wrap w-full'>
                <Card className='col col-12 col-sm-4'>
                    <h5>Submitted</h5>
                    {new Date(data.proposal.submitTime).toLocaleString()}
                </Card>
                <Card className='col col-12 col-sm-4'>
                    <h5>Status</h5>
                    {formatProposalStatus(data.proposal.status)}
                </Card>
                <Card className='col col-12 col-sm-4'>
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
                                    <ValidatorAvatar avatarUrl={proposerDetails?.keybaseAvatarUrl} moniker={proposerDetails?.moniker} />
                                    {proposerDetails?.moniker || data.proposingValidator?.operatorAddress}
                                </Link>
                            : data.proposal.proposer ?
                                <Link to={`/${chainLookupId}/accounts/${data.proposal.proposer}`}>{data.proposal.proposer}</Link>
                            : 'Unknown' }
                        </div>
                    </div>
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