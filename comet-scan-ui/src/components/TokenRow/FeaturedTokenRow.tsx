import { FC } from "react";
import { FrontendChainConfig, FeaturedToken } from "@comet-scan/types";
import { Link } from "react-router-dom";
import { truncateString } from "../../utils/format";
import { formatNice } from "../../utils/coin";

const FeaturedTokenRow: FC<{ token: FeaturedToken, chain: FrontendChainConfig }> = ({ token, chain }) => {
    if (!token.contract.contract.tokenInfo) return undefined;

    return (
        <Link
            to={`/${chain.id}/tokens/${token.contract.contract.contractAddress}`}
            className='dataRow'
        >
            {/* Name/Description */}
            <div className='col col-4 d-flex flex-row align-items-center gap-2'>
                <div style={{width: '42px'}} className='d-flex align-items-center'>
                    <img src={`/tokens${token.image}`} style={{width: '100%'}} />
                </div>
                <div>
                    <div>{token.name}</div>
                    <div style={{fontSize: '80%', color: 'var(--secondary-text-color)'}}>{token.description}</div>
                </div>
            </div>

            {/* Contract Address */}
            <div className='col col-4'>{truncateString(token.contract.contract.contractAddress, 10)}</div>

            {/* Total Supply */}
            <div className='col col-2'>
                {token.contract.contract.tokenInfo.totalSupply ? 
                    formatNice(parseInt(token.contract.contract.tokenInfo.totalSupply) / Math.pow(10, token.contract.contract.tokenInfo.decimals))
                :
                    'Private'
                }
            </div>

            {/* Executions */}
            <div className='col col-2 text-end'>{token.contract.contract.executions.toLocaleString()}</div>
        </Link>
    )
}

export default FeaturedTokenRow;