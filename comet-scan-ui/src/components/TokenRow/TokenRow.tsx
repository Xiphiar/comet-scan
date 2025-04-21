import { FC } from "react";
import { FrontendChainConfig } from "../../interfaces/config.interface";
import { Link } from "react-router-dom";
import { truncateString } from "../../utils/format";
import { ContractWithStats } from "../../interfaces/responses/explorerApiResponses";
import { formatNice } from "../../utils/coin";

const TokenRow: FC<{ contract: ContractWithStats, chain: FrontendChainConfig }> = ({ contract: { contract }, chain }) => {
    if (!contract.tokenInfo) throw `A non-token contract object was passed to TokenRow`;
    return (
        <Link
            to={`/${chain.id}/tokens/${contract.contractAddress}`}
            className='dataRow'
        >
            {/* Name/Symbol */}
            <div className='col col-4'>{contract.tokenInfo.symbol}</div>

            {/* Contract Address */}
            <div className='col col-4'>{truncateString(contract.contractAddress, 10)}</div>

            {/* Total Supply */}
            <div className='col col-2'>
                {contract.tokenInfo.totalSupply ? 
                    formatNice(parseInt(contract.tokenInfo.totalSupply) / Math.pow(10, contract.tokenInfo.decimals))
                :
                    'Private'
                }
            </div>

            {/* Executions */}
            <div className='col col-2 text-end'>{contract.executions.toLocaleString()}</div>
        </Link>
    )
}

export default TokenRow;