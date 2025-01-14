import { FC, Fragment } from "react";
import Spinner from "../../components/Spinner";
import Card from "../../components/Card";
import styles from './OverviewPage.module.scss';
import { Link } from "react-router-dom";
import { FrontendChainConfig } from "../../interfaces/config.interface";
import { weiFormatNice } from "../../utils/coin";
import { Validator } from "../../interfaces/models/validators.interface";
import ValidatorAvatar from "../../components/Avatar/KeybaseAvatar";

interface Props {
    validators: Validator[];
    totalValidators: number;
    rankOffset?: number;
    totalBonded: number;
    chain: FrontendChainConfig;
    title: string;
    className?: string;
    active?: boolean;
    showMoreLink?: true;
}

const ValidatorsCard: FC<Props> = ({ validators, totalValidators, rankOffset = 0, chain, className, title, totalBonded, active, showMoreLink }) => {
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
                <div className='d-flex justify-content-between align-items-center' style={{marginBottom: '12px'}}>
                    <div>
                        <h3>{title}</h3>
                        <div style={{fontSize: '75%', color: 'var(--secondary-text-color)'}}>{totalValidators} {active === false ? 'Inactive' : 'Active'} Validators</div>
                    </div>
                    { active === false &&
                        <Link className='button text-center' to={`/${chain.id}/validators`}>Show Active</Link>
                    }
                    { active === true &&
                        <Link className='button text-center' to={`/${chain.id}/validators/inactive`}>Show Inactive</Link>
                    }
                    { showMoreLink === true &&
                        <Link className='blackLink' style={{fontSize: '24px'}} to={`/${chain.id}/validators`}>➜</Link>
                    }
                </div>
                <div className='d-flex mt-1 mb-1'>
                    <div className='col col-8 col-md-7'>
                        Validator
                    </div>
                    <div className={`col col-2 col-md-2 d-none d-md-block ${active === false ? 'text-center' : 'text-end' }`}>
                        { active === false ? 'Status' : 'Commission'  }
                    </div>
                    <div className='col col-4 col-md-3 align-items-end text-end'>
                        Voting Power
                    </div>
                </div>
                <div style={{borderBottom: '1px solid var(--light-gray)'}} />
            </div>
            { validators.map((val, i) =>
                <Fragment key={val.operatorAddress}>
                    <ValidatorRow validator={val} chain={chain} position={i + rankOffset} totalBonded={totalBonded} active={active} />
                    {i + 1 < validators.length && <div style={{borderBottom: '1px solid var(--light-grey)'}} /> }
                </Fragment>
            )}
        </Card>
    )
}

export default ValidatorsCard;

const ValidatorRow: FC<{ position: number, validator: Validator, chain: FrontendChainConfig, totalBonded: number, active: boolean }> = ({ position, validator, chain, totalBonded, active }) => {
    const vpPercent = parseInt(validator.delegatedAmount) / totalBonded;
    const commissionPercent = parseFloat(validator.commission.rates[0].rate) * 100

    const status = validator.jailed && validator.selfBondedAmount !== '0' ?
        <div className='badge bg-danger'>Jailed</div>
    : validator.status === 'BOND_STATUS_UNBONDING' ?
        <div className='badge bg-info'>Unbonding</div>
    : 
        <div className='badge bg-info'>Unbonded</div>

    return (
        <Link
            to={`/${chain.id}/validators/${validator.operatorAddress}`}
            className={`${styles.valRow}`}
        >
            <div className='col col-8 col-md-7 d-flex gap-2'>
                <h5>#{position + 1}</h5>
                <ValidatorAvatar avatarUrl={validator.descriptions[0]?.keybaseAvatarUrl} moniker={validator.descriptions[0]?.moniker} />
                <div className='twoLineLimit'>{validator.descriptions.length ? validator.descriptions[0].moniker : validator.operatorAddress}</div>
            </div>
            { active === false ?
                <div className='col col-2 col-md-2 justify-content-center text-end d-none d-md-flex'>
                    {status}
                </div>

            :
                <div className='col col-2 col-md-2 justify-content-end text-end d-none d-md-flex'>
                    {commissionPercent.toLocaleString(undefined, { maximumFractionDigits: 2})}%
                </div>
            }
            <div className='col col-4 col-md-3 align-items-end text-end d-flex flex-column'>
                <div>{weiFormatNice(validator.delegatedAmount, chain.bondingDecimals)} {chain.bondingDisplayDenom}</div>
                <div className='d-none d-sm-block'>{(vpPercent * 100).toLocaleString(undefined, {maximumFractionDigits: 2})}%</div>
            </div>
        </Link>
    )
}