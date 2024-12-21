import { FC } from "react";
import { BlockWithProposer } from "../../interfaces/models/blocks.interface";
import { Link } from "react-router-dom";
import styles from './BlockRow.module.scss'
import { truncateString } from "../../utils/format";
import KeybaseAvatar from "../Avatar/KeybaseAvatar";
import { FrontendChainConfig } from "../../interfaces/config.interface";

const BlockRow: FC<{ block: BlockWithProposer, chain: FrontendChainConfig }> = ({ block, chain }) => {
    const proposerDetails = block.proposer?.descriptions.length ? block.proposer.descriptions[0] : undefined;
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
                <KeybaseAvatar identity={proposerDetails?.identity} moniker={proposerDetails?.moniker} />
                {proposerDetails?.moniker || block.block.result.block.header.proposer_address}
            </div>
            <div className='col col-2'>{new Date(block.timestamp).toLocaleString()}</div>
        </Link>
    )
}

export default BlockRow;