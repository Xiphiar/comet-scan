import { FC, useEffect, useState } from "react";
import { FrontendChainConfig, Coin } from "@comet-scan/types";
import styles from './AssetRow.module.scss'
import { weiFormatNice } from "../../utils/coin";
import { getDenomDetails, DenomDetails } from "../../utils/denoms";
import { SmallSpinner } from "../SmallSpinner/smallSpinner";
import { FaInfoCircle } from "react-icons/fa";
import Tooltip from "../Tooltip/Tooltip";

const AssetRow: FC<{ coin: Coin, chain: FrontendChainConfig }> = ({ coin, chain }) => {
    const [denomDetails, setDenomDetails] = useState<DenomDetails | undefined>();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDenomDetails = async () => {
            try {
                setIsLoading(true);
                const details = await getDenomDetails(coin.denom, chain);
                setDenomDetails(details);
            } catch (err: any) {
                console.error('Failed to fetch denom details:', err);
                setDenomDetails({
                    denom: coin.denom,
                    symbol: coin.denom.length > 15 ? coin.denom.slice(0, 15) + '...' : coin.denom,
                    decimals: 6,
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchDenomDetails();
    }, [coin.denom, chain]);

    if (isLoading) {
        return (
            <div className={styles.dataRow}>
                <div className='col col-8'><SmallSpinner /></div>
            </div>
        );
    }

    const formattedAmount = weiFormatNice(coin.amount, denomDetails?.decimals || 6);
    return (
        <div className={styles.dataRow}>
            <div className='col col-8 flex-row'>
                {denomDetails?.symbol || coin.denom}
                {denomDetails.unknown && <>&nbsp;<Tooltip
                    content="We don't have this asset in our database, the symbol and amount displayed may be incorrect."
                    width={200}
                ><FaInfoCircle /></Tooltip></>}
            </div>
            <div className='col col-4 text-end'>{formattedAmount}</div>
        </div>
    );
}

export default AssetRow;