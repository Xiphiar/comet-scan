import { FC } from "react";
import { FrontendChainConfig } from "../../interfaces/config.interface";
import { formatNice, weiToCoin } from "../../utils/coin";
import { HistoryTx } from "../../pages/Contracts/SingleTokenPage";
import { WasmContract } from "../../interfaces/models/contracts.interface";
import styles from './HistoryTxRow.module.scss';
import { Link, useParams } from "react-router-dom";
import { useUser } from "../../hooks/useUser";
import { truncateString } from "../../utils/format";

const HistoryTxRow: FC<{ contract: WasmContract, chain: FrontendChainConfig, historyTx: HistoryTx }> = ({ contract, historyTx }) => {
    const { chain: chainLookupId } = useParams();
    const { user } = useUser();
    
    if (!contract.tokenInfo) throw `A non-token contract object was passed to HistoryTxRow`;
    console.log(contract.tokenInfo.decimals)

    return (
        <div className={styles.historyRow}>
            { historyTx.block_height || historyTx.block_time ?
                <>
                    {/* From Address (Account that was Debited) */}
                    { (historyTx.from === user?.address) ?
                        <div className='col col-4'>{truncateString(historyTx.from, 18)}</div>
                    :
                        <Link className='col col-4' to={`/${chainLookupId}/accounts/${historyTx.from}`}>
                            {truncateString(historyTx.from, 18)}
                        </Link>
                    }
        
                    {/* Recipient Address */}
                    { (historyTx.receiver === user?.address) ?
                        <div className='col col-4'>{truncateString(historyTx.receiver, 18)}</div>
                    :
                        <Link className='col col-4' to={`/${chainLookupId}/accounts/${historyTx.receiver}`}>
                            {truncateString(historyTx.receiver, 18)}
                        </Link>
                    }
        
                    {/* Amount */}
                    <div className='col col-2 text-end'>
                        {formatNice(weiToCoin(historyTx.coins.amount, contract.tokenInfo.decimals), undefined, contract.tokenInfo.decimals)} {contract.tokenInfo.symbol}
                    </div>

                    {/* Block */}
                    <div className='col col-2 text-end'>
                        { historyTx.block_height ? <>
                            <Link to={`${chainLookupId}/blocks/${historyTx.block_height}`}>
                                {historyTx.block_height.toLocaleString()}
                            </Link>
                            <div style={{fontSize: '80%', color: 'var(--secondary-text-color)'}}>
                                {new Date(historyTx.block_time * 1000).toLocaleString()}
                            </div>
                        </> :
                            'Unknown'
                        }
                    </div>
                </>
            :
                <>
                    {/* From Address (Account that was Debited) */}
                    { historyTx.from === user?.address ?
                        <div className='col col-5'>{historyTx.from}</div>
                    :
                        <Link className='col col-5' to={`/${chainLookupId}/accounts/${historyTx.from}`}>{historyTx.from}</Link>
                    }
        
                    {/* Recipient Address */}
                    { historyTx.receiver === user?.address ?
                        <div className='col col-5'>{historyTx.receiver}</div>
                    :
                        <Link className='col col-5' to={`/${chainLookupId}/accounts/${historyTx.receiver}`}>{historyTx.receiver}</Link>
                    }
        
                    {/* Amount */}
                    <div className='col col-2 text-end'>
                        {formatNice(weiToCoin(historyTx.coins.amount, contract.tokenInfo.decimals), undefined, contract.tokenInfo.decimals)} {contract.tokenInfo.symbol}
                    </div>
                </>
            }


            {!!historyTx.memo &&
                <div className='col col-6'>
                    Memo: {historyTx.memo}
                </div>
            }
            {historyTx.from !== historyTx.sender &&
                <div className='col col-6 flex-row'>
                    Initiated By:&nbsp;<Link className='col col-5' to={`/${chainLookupId}/accounts/${historyTx.sender}`}>{historyTx.sender}</Link>
                </div>
            }
        </div>
    )
}

export default HistoryTxRow;

