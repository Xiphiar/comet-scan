import { FC } from "react";
import styles from './VoteRow.module.scss'
import { useParams, Link } from "react-router-dom";
import { formatVoteOption, formatTime } from "../../utils/format";
import { VoteWithTitle } from "@comet-scan/types";

// Displays the proposal and vote. Does not display validator info.
const AccountVoteRow: FC<{data: VoteWithTitle}> = ({data: {vote, title}}) => {
    const { chain: chainLookupId } = useParams();
    return (
        <Link
            to={`/${chainLookupId}/proposals/${vote.proposalId}`}
            className={`d-flex py-2 align-items-center ${styles.voteRow}`}
            style={{ textDecoration: 'none', color: 'inherit' }}
        >
            <div className='col col-1'>
                <h5>#{vote.proposalId}</h5>
            </div>
            <div className='col col-7 twoLineLimit'>{title}</div>
            <div className='col col-2'>
                {formatVoteOption(vote.option)}
            </div>
            <div className='col col-2 text-end'>
                <div>{new Date(vote.timestamp).toLocaleString()}</div>
                <div style={{fontSize: '14px', color: 'var(--secondary-text-color)'}}>{formatTime(vote.timestamp)}</div>
            </div>
        </Link>
    )
}

export default AccountVoteRow;