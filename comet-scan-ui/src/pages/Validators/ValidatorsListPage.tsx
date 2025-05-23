import { FC } from "react";
import { useParams } from "react-router-dom";
import useAsync from "../../hooks/useAsync";
import { ValidatorsPageResponse } from "../../interfaces/responses/explorerApiResponses";
import { getInactiveValidatorsPage, getValidatorsPage } from "../../api/pagesApi";
import ContentLoading from "../../components/ContentLoading";
import Card from "../../components/Card";
import TitleAndSearch from "../../components/TitleAndSearch";
import { secondsToDhms } from "../../utils/time";
import ValidatorsCard from "../Overview/ValidatorsCard";
import useConfig from "../../hooks/useConfig";
import { FaPercent, FaRegClock } from "react-icons/fa6";
import { GrValidate, GrStakeholder } from "react-icons/gr";

const ValidatorsListPage: FC<{inactive?: boolean}> = ({inactive}) => {
    const { chain: chainLookupId } = useParams();
    const { getChain } = useConfig();
    const chain = getChain(chainLookupId);
    const { data, error } = useAsync<ValidatorsPageResponse>(
        inactive ? getInactiveValidatorsPage(chain.chainId) : getValidatorsPage(chain.chainId),
        {
            updateOn: [inactive]
        }
    );

    if (!chain) {
        return (
            <div>
                <h1>Chain Not Found</h1>
            </div>
        )
    }

    if (!data) {
        return <ContentLoading chain={chain} title='Validators' error={error} />
    }
 
    return (
        <div className='d-flex flex-column'>
            <TitleAndSearch chain={chain} title='Validators' />
            <div className='d-flex flex-wrap w-full'>
                <Card className='col col-6 col-md-3'>
                    <div className='statTitle'><GrValidate /><h5>Active Validators</h5></div>
                    {data.stakingMetrics.activeValidators}
                </Card>
                <Card className='col col-6 col-md-3'>
                    <div className='statTitle'><FaPercent /><h5>Staking APR</h5></div>
                    {(data.stakingMetrics.nominalApr * 100).toFixed(2)}%
                </Card>
                <Card className='col col-6 col-md-3'>
                    <div className='statTitle'><GrStakeholder /><h5>Bond Rate</h5></div>
                    {(data.stakingMetrics.bondRate * 100).toFixed(2)}%
                </Card>
                <Card className='col col-6 col-md-3'>
                    <div className='statTitle'><FaRegClock /><h5>Unbonding Time</h5></div>
                    {secondsToDhms(data.stakingMetrics.unbondingPeriodSeconds)}
                </Card>
            </div>
            <ValidatorsCard
                validators={data.validators}
                totalValidators={data.validators.length}
                rankOffset={inactive ? data.stakingMetrics.activeValidators : 0}
                totalBonded={parseInt(data.stakingMetrics.bonded.amount)}
                chain={chain}
                title={inactive ? 'Inactive Validators' : 'Active Validators'}
                className='d-flex flex-column gap-2'
                active={!inactive}
                showSelector={true}
            />
        </div>
    )
}

export default ValidatorsListPage;