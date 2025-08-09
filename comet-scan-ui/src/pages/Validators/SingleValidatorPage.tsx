import { FC } from "react";
import { Link, useParams } from "react-router-dom";
import useConfig from "../../hooks/useConfig";
import useAsync from "../../hooks/useAsync";
import { SingleValidatorPageResponse } from "@comet-scan/types";
import { getSingleValidatorPage } from "../../api/pagesApi";
import ContentLoading from "../../components/ContentLoading";
import Card from "../../components/Card";
import TitleAndSearch from "../../components/TitleAndSearch";
import styles from './SingleValidatorPage.module.scss';
import { weiFormatNice } from "../../utils/coin";
import ValidatorAvatar from "../../components/Avatar/KeybaseAvatar";

const SingleValidatorPage: FC = () => {
    const { chain: chainLookupId, operatorAddress } = useParams();
    const { getChain } = useConfig();
    const chain = getChain(chainLookupId);
    const { data, error } = useAsync<SingleValidatorPageResponse>(getSingleValidatorPage(chain.chainId, operatorAddress));
    const currentDetails = data?.validator.descriptions.length ? data.validator.descriptions[0] : undefined;

    if (!chain) {
        return (
            <div>
                <h1>Chain Not Found</h1>
            </div>
        )
    }

    if (!data) {
        return <ContentLoading chain={chain} title='Validator' error={error} />
    }

    const statusBadge = data.validator.jailed && data.validator.selfBondedAmount !== '0' ?
        <div className='glassBadge glassBadgeDanger'>Jailed</div>
    : data.validator.status === 'BOND_STATUS_UNBONDING' || data.validator.status === 'BOND_STATUS_UNBONDED' ?
        <div className='glassBadge glassBadgeInfo'>Inactive</div>
    : <></>
    const active = data.validator.status === 'BOND_STATUS_BONDED' && !data.validator.jailed;
 
    return (
        <div className='d-flex flex-column'>
            <TitleAndSearch chain={chain} title='Validator' />
            <Card>
                <div>
                    <div className='d-flex align-items-center gap-2'>
                        <ValidatorAvatar avatarUrl={currentDetails?.keybaseAvatarUrl} moniker={currentDetails?.moniker} operatorAddress={data.validator.operatorAddress} size='70px' />
                        <h2>{currentDetails?.moniker || data.validator.operatorAddress}</h2>
                        {statusBadge}
                    </div>
                    {!!currentDetails.details && <p>{currentDetails.details}</p>}
                </div>
                <hr />
                <div className='d-flex flex-column gap-3 mt-3'>
                    <div className='d-flex'>
                        <div className='col-3 font-weight-bold'>Operator Address</div>
                        <div className='col'>{data.validator.operatorAddress}</div>
                    </div>
                    <div className='d-flex'>
                        <div className='col-3 font-weight-bold'>Account Address</div>
                        <div className='col'>
                            <Link to={`/${chain.id}/accounts/${data.validator.accountAddress}`}>{data.validator.accountAddress}</Link>
                        </div>
                    </div>
                    { !!currentDetails.website &&
                        <div className='d-flex'>
                            <div className='col-3 font-weight-bold'>Website</div>
                            <div className='col'>
                                <a href={currentDetails.website} target='_blank' rel='noreferrer noopener'>{currentDetails.website}</a>
                            </div>
                        </div>
                    }
                </div>
            </Card>
            <div className='d-flex flex-wrap w-full'>
                <Card className='col col-6 col-md-3'>
                    <div className='statTitle'><h5>Total Bonded</h5></div>
                    {weiFormatNice(data.validator.delegatedAmount, chain.bondingDecimals)} {chain.bondingDisplayDenom} {active && `(#${data.rank})`}
                </Card>
                <Card className='col col-6 col-md-3'>
                    <div className='statTitle'><h5>Self Bonded</h5></div>
                    {weiFormatNice(data.validator.selfBondedAmount, chain.bondingDecimals)} {chain.bondingDisplayDenom}
                </Card>
                <Card className='col col-6 col-md-3'>
                    <div className='statTitle'><h5>Voting Power</h5></div>
                    {data.votingPower * 100}%
                </Card>
                <Card className='col col-6 col-md-3'>
                    <div className='statTitle'><h5>Commission Rate</h5></div>
                    {parseFloat(data.validator.commission.rates[0].rate) * 100}%
                </Card>
            </div>
        </div>
    )
}

export default SingleValidatorPage;