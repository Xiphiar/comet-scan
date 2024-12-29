import { FC, Fragment } from "react";
import Spinner from "../../components/Spinner";
import Card from "../../components/Card";
import styles from './OverviewPage.module.scss';
import { Link } from "react-router-dom";
import { FrontendChainConfig } from "../../interfaces/config.interface";
import { weiFormatNice } from "../../utils/coin";
import { Validator } from "../../interfaces/models/validators.interface";
import KeybaseAvatar from "../../components/Avatar/KeybaseAvatar";

interface Props {
    validators: Validator[];
    activeValidators: number;
    totalBonded: number;
    chain: FrontendChainConfig;
    title: string;
    className?: string;
}

const ValidatorsCard: FC<Props> = ({ validators, activeValidators, chain, className, title, totalBonded }) => {
    if (!validators.length) {
        return (
            <Card className={`${className}`}>
                <h4>{title}</h4>
                <div className='d-flex place-items-center'>
                    <Spinner />
                </div>
            </Card>
        )
    }
    return (
        <Card className={`${className}`}>
            <div>
                <h3>{title}</h3>
                <div style={{fontSize: '75%', color: 'var(--gray)', marginBottom: '8px'}}>{activeValidators || '...'} Active Validators</div>
                <div className='d-flex mt-1 mb-1'>
                    <div className='col col-8 col-md-7'>
                        Validator
                    </div>
                    <div className='col col-2 col-md-2 text-end d-none d-md-block'>
                        Commission
                    </div>
                    <div className='col col-4 col-md-3 align-items-end text-end'>
                        Voting Power
                    </div>
                </div>
                <div style={{borderBottom: '1px solid var(--light-gray)'}} />
            </div>
            { validators.map((val, i) =>
                <Fragment key={val.operatorAddress}>
                    <ValidatorCard validator={val} chain={chain} position={i} totalBonded={totalBonded} />
                    {i + 1 < validators.length && <div style={{borderBottom: '1px solid var(--light-grey)'}} /> }
                </Fragment>
            )}
        </Card>
    )
}

export default ValidatorsCard;

const ValidatorCard: FC<{ position: number, validator: Validator, chain: FrontendChainConfig, totalBonded: number }> = ({ position, validator, chain, totalBonded }) => {
    const vpPercent = parseInt(validator.delegatedAmount) / totalBonded;
    const commissionPercent = parseFloat(validator.commission.rates[0].rate) * 100
    return (
        <Link
            to={`/${chain.id}/validators/${validator.operatorAddress}`}
            className={`${styles.valRow}`}
        >
            <div className='col col-8 col-md-7 d-flex gap-2'>
                <h5>#{position + 1}</h5>
                <KeybaseAvatar identity={validator.descriptions[0]?.identity} moniker={validator.descriptions[0]?.moniker} />
                <div>{validator.descriptions.length ? validator.descriptions[0].moniker : validator.operatorAddress}</div>
            </div>
            <div className='col col-2 col-md-2 align-items-end text-end d-none d-md-block'>
                {commissionPercent.toLocaleString(undefined, { maximumFractionDigits: 2})}%
            </div>
            <div className='col col-4 col-md-3 align-items-end text-end d-flex flex-column'>
                <div>{weiFormatNice(validator.delegatedAmount, chain.bondingDecimals)} {chain.bondingDisplayDenom}</div>
                <div>{(vpPercent * 100).toLocaleString(undefined, {maximumFractionDigits: 2})}%</div>
            </div>
        </Link>
    )
}