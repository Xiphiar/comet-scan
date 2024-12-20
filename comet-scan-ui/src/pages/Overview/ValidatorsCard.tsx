import { FC } from "react";
import Spinner from "../../components/Spinner";
import Card from "../../components/Card";
import styles from './OverviewPage.module.scss';
import { Link } from "react-router-dom";
import useAsync from "../../hooks/useAsync";
import { getKeybaseAvatar } from "../../api/keybaseApi";
import { Chain } from "../../config/chains";
import { weiFormatNice } from "../../utils/coin";
import { Validator } from "../../interfaces/models/validators.interface";
import KeybaseAvatar from "../../components/Avatar/KeybaseAvatar";

interface Props {
    validators: Validator[];
    activeValidators: number;
    chain: Chain;
    title: string;
    className?: string;
}

const ValidatorsCard: FC<Props> = ({ validators, activeValidators, chain, className, title }) => {
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
            <div className='mb-2'>
                <h3>{title}</h3>
                <div style={{fontSize: '75%', color: 'var(--gray)', marginBottom: '8px'}}>{activeValidators || '...'} Active Validators</div>
            </div>
            { validators.map((val, i) => <>
                <ValidatorCard validator={val} chain={chain} position={i} key={val.operatorAddress} />
                {i + 1 < validators.length && <div style={{borderBottom: '1px solid var(--light-grey)'}} /> }
            </>)}
        </Card>
    )
}

export default ValidatorsCard;

const ValidatorCard: FC<{ position: number, validator: Validator, chain: Chain }> = ({ position, validator, chain }) => {
    return (
        <Link
            to={`/${chain.id}/validators/${validator.operatorAddress}`}
            className={`${styles.dataRow} ${styles.valRow}`}
        >
            <h5>#{position + 1}</h5>
            <KeybaseAvatar identity={validator.descriptions[0]?.identity} moniker={validator.descriptions[0]?.moniker} />
            <div>{validator.descriptions.length ? validator.descriptions[0].moniker : validator.operatorAddress}</div>
            <div className='flex-grow-1 align-items-end'>
                <h6>{weiFormatNice(validator.delegatedAmount, chain.bondingDecimals)} {chain.bondingDisplayDenom}</h6>
            </div>
        </Link>
    )
}