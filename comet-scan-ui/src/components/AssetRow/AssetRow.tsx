import { FC } from "react";
import { FrontendChainConfig } from "../../interfaces/config.interface";
import styles from './AssetRow.module.scss'
import { weiFormatNice } from "../../utils/coin";
import { Coin } from "../../interfaces/models/blocks.interface";
import { getDenomDetails } from "../../utils/denoms";

const AssetRow: FC<{ coin: Coin, chain: FrontendChainConfig }> = ({ coin, chain }) => {
    const denomDetails = getDenomDetails(coin.denom);
    console.log(denomDetails)
    const formattedAmount = weiFormatNice(coin.amount, denomDetails.decimals);
    return (
        <div className={styles.dataRow}>
            <div className='col col-8'>{denomDetails.symbol}</div>
            <div className='col col-4 text-end'>{formattedAmount}</div>
        </div>
    )
}

export default AssetRow;