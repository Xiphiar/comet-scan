/* eslint-disable @typescript-eslint/no-explicit-any */
import { FC, Fragment } from "react";
import Spinner from "../../components/Spinner";
import Card from "../../components/Card";
import styles from './OverviewPage.module.scss';
import { Proposal, FrontendChainConfig, v1LcdProposal } from "@comet-scan/types";
import { Link } from "react-router-dom";
import { formatProposalStatus, formatProposalType } from "../../utils/format";

const ProposalsCard: FC<{ chain: FrontendChainConfig, proposals: Proposal[], totalProposals: number, className?: string, showMoreLink?: true }> = ({ chain, proposals, totalProposals, className, showMoreLink }) => {
    if (!proposals.length) {
        return (
            <Card className={`${className}`}>
                <h4>Recent Proposals</h4>
                <div className='d-flex place-items-center'>
                    <Spinner />
                </div>
            </Card>
    )
    }
    return (
        <Card className={`${className}`}>
            <div>
                <div className='d-flex justify-content-between align-items-center' style={{marginBottom: '12px'}}>
                    <div>
                        <h3>Recent Proposals</h3>
                        <div style={{fontSize: '75%', color: 'var(--secondary-text-color)'}}>{totalProposals || '...'} Total Proposals</div>
                    </div>
                    { showMoreLink === true &&
                        <Link className='blackLink' style={{fontSize: '24px'}} to={`/${chain.id}/proposals`}>➜</Link>
                    }
                </div>
                <div className='d-flex mt-1 mb-1'>
                    <div className='col col-2 col-sm-1'>
                        ID
                    </div>
                    <div className='col col-7 col-sm-6 col-md-4'>
                        Title
                    </div>
                    <div className='col col-3'>
                        Type
                    </div>
                    <div className='col col-2 col-sm-2 d-none d-sm-block text-end text-md-start'>
                        Status
                    </div>
                    <div className='col col-2 d-none d-md-block text-end'>
                        Ends
                    </div>
                </div>
                <div style={{borderBottom: '1px solid var(--light-gray)'}} />
            </div>
            { proposals.map((prop, i) =>
                <Fragment key={prop.id}>
                    <ProposalRow proposal={prop} chain={chain} key={prop.id} />
                    { i + 1 < proposals.length && <div style={{borderBottom: '1px solid var(--light-grey)'}} /> }
                </Fragment>
            )}
        </Card>
    )
}

export default ProposalsCard;

export const ProposalRow: FC<{ chain: FrontendChainConfig, proposal: Proposal }> = ({ chain, proposal }) => {
    const endTime = new Date(
        proposal.status === 'PROPOSAL_STATUS_DEPOSIT_PERIOD' ? proposal.depositEndTime : proposal.votingEndTime
    )
    let proposalType = proposal.proposalType;
    if (proposalType.includes('MsgExecLegacyContent')) proposalType = (proposal.proposal as v1LcdProposal).messages?.[0]?.content?.['@type'] || proposalType;
    return (
        <Link
            to={`/${chain.id}/proposals/${proposal.id}`}
            className={`${styles.dataRow} ${styles.propRow}`}
        >
            <div className='col col-2 col-sm-1'>
                <h5>#{proposal.id}</h5>
            </div>
            <div className='col col-7 col-sm-6 col-md-4 twoLineLimit'>{proposal.title}</div>
            <div className='col col-3'>{formatProposalType(proposalType)}</div>
            <div className='col col-2 col-sm-2 d-none d-sm-flex text-end text-md-start'>{formatProposalStatus(proposal.status)}</div>
            <div className='col col-2 d-none d-md-flex text-end align-items-end'>
                <div style={{fontWeight: 700}}>{endTime.toLocaleDateString()}</div><br />
                {endTime.toLocaleTimeString()}
            </div>
        </Link>
    )
}