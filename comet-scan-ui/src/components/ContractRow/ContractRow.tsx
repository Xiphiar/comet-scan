import { FC } from "react";
import { FrontendChainConfig, ContractWithStats } from "@comet-scan/types";
import { Link } from "react-router-dom";
import { truncateString } from "../../utils/format";

const ContractRow: FC<{ contract: ContractWithStats, chain: FrontendChainConfig }> = ({ contract: { contract }, chain }) => {
    return (
        <Link
            to={`/${chain.id}/contracts/${contract.contractAddress}`}
            className='dataRow'
            // style={position + 1 < total ? {borderBottom: '1px solid var(--light-grey)'} : undefined }
        >
            <div className='col col-5 col-md-4 twoLineLimit'>{truncateString(contract.label, 18)}</div>
            <div className='col col-5 col-md-3'>{truncateString(contract.contractAddress, 8)}</div>
            <div className='col col-2 col-md-1 text-end text-md-start'>{contract.codeId}</div>
            <div className='col col-2 d-none d-md-block'>{contract.created?.block_height || 'Unknown'}</div>
            <div className='col col-2 d-none d-md-block'>{contract.executions.toLocaleString()}</div>
        </Link>
    )
}

export default ContractRow;