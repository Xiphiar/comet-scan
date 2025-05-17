import { FC } from "react";
import { Vote } from "../../interfaces/models/votes.interface";
import styles from './VoteRow.module.scss'
import { useParams, Link } from "react-router-dom";
import { formatVoteOption, formatTime } from "../../utils/format";

// Displays the voter and vote, does not display proposal or validator info.
const VoteRow: FC<{vote: Vote}> = ({vote}) => {
    const { chain: chainLookupId } = useParams();
    return (
        <Link
            to={`/${chainLookupId}/accounts/${vote.voter}`}
            className={`d-flex py-2 align-items-center ${styles.voteRow}`}
            style={{ textDecoration: 'none', color: 'inherit' }}
        >
            <div className='col col-6 text-truncate'>
                {vote.voter}
            </div>
            <div className='col col-3 text-center'>
                {formatVoteOption(vote.option)}
            </div>
            <div className='col col-3 text-end'>
                <div>{new Date(vote.timestamp).toLocaleString()}</div>
                <div style={{fontSize: '14px', color: 'var(--secondary-text-color)'}}>{formatTime(vote.timestamp)}</div>
            </div>
        </Link>
    )
}

export default VoteRow;