/* eslint-disable @typescript-eslint/no-explicit-any */
import { FC } from "react";
import Spinner from "../../components/Spinner";
import Card from "../../components/Card";
import styles from './OverviewPage.module.scss';
import { Proposal } from "../../interfaces/models/proposals.interface";
import { Chain } from "../../config/chains";
import { Link } from "react-router-dom";
import { formatProposalStatus, formatProposalType } from "../../utils/format";

const ProposalsCard: FC<{ chain: Chain, proposals: Proposal[], totalProposals: number, className?: string }> = ({ chain, proposals, totalProposals, className }) => {
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
            <div className='mb-2'>
                <h3>Recent Proposals</h3>
                <div style={{fontSize: '75%', color: 'var(--gray)', marginBottom: '8px'}}>{totalProposals || '...'} Total Proposals</div>
            </div>
            { proposals.map((prop, i) => <>
                <ProposalRow proposal={prop} chain={chain} key={prop.id} />
                { i + 1 < proposals.length && <div style={{borderBottom: '1px solid var(--light-grey)'}} /> }
            </>)}
        </Card>
    )
}

export default ProposalsCard;

export const ProposalRow: FC<{ chain: Chain, proposal: Proposal }> = ({ chain, proposal }) => {
    const endTime = new Date(
        proposal.status === 'PROPOSAL_STATUS_DEPOSIT_PERIOD' ? proposal.depositEndTime : proposal.votingEndTime
    )
    return (
        <Link
            to={`/${chain.id}/proposals/${proposal.id}`}
            className={`${styles.dataRow} ${styles.propRow}`}
        >
            <div className='col col-1'>
                <h5>#{proposal.id}</h5>
            </div>
            <div className='col'>{proposal.title}</div>
            <div className='col col-2'>{formatProposalType(proposal.proposalType)}</div>
            <div className='col col-1'>{formatProposalStatus(proposal.status)}</div>
            <div className='col col-2 align-items-end'>
                <div style={{fontWeight: 700}}>{endTime.toLocaleDateString()}</div><br />
                {endTime.toLocaleTimeString()}
            </div>
        </Link>
    )
}