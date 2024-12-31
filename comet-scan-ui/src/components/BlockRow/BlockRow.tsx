import { FC } from "react";
import { BlockWithProposer } from "../../interfaces/models/blocks.interface";
import { Link } from "react-router-dom";
import styles from './BlockRow.module.scss'
import { truncateString } from "../../utils/format";
import ValidatorAvatar from "../Avatar/KeybaseAvatar";
import { FrontendChainConfig } from "../../interfaces/config.interface";

const BlockRow: FC<{ block: BlockWithProposer, chain: FrontendChainConfig }> = ({ block, chain }) => {
    return (
        <Link
            to={`/${chain.id}/blocks/${block.height}`}
            className={styles.dataRow}
            // style={position + 1 < total ? {borderBottom: '1px solid var(--light-grey)'} : undefined }
        >
            <div className='col col-2'>{block.height.toLocaleString()}</div>
            <div className='col col-2'>{truncateString(block.hash)}</div>
            <div className='col col-2'>{block.transactionsCount}</div>
            <div className='col col-4 d-flex flex-row gap-2 align-items-center'>
                <ValidatorAvatar avatarUrl={block.proposer?.latestDescription.keybaseAvatarUrl} moniker={block.proposer?.latestDescription.moniker} />
                {block.proposer?.latestDescription.moniker || block.proposer?.operatorAddress}
            </div>
            <div className='col col-2'>{new Date(block.timestamp).toLocaleString()}</div>
        </Link>
    )
}

export default BlockRow;