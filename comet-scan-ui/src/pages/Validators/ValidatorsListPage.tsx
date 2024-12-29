import { FC } from "react";
import { useParams } from "react-router-dom";
import useAsync from "../../hooks/useAsync";
import { ValidatorsPageResponse } from "../../interfaces/responses/explorerApiResponses";
import { getValidatorsPage } from "../../api/pagesApi";
import ContentLoading from "../../components/ContentLoading";
import Card from "../../components/Card";
import TitleAndSearch from "../../components/TitleAndSearch";
import { secondsToDhms } from "../../utils/time";
import ValidatorsCard from "../Overview/ValidatorsCard";
import useConfig from "../../hooks/useConfig";

const ValidatorsListPage: FC = () => {
    const { chain: chainLookupId } = useParams();
    const { getChain } = useConfig();
    const chain = getChain(chainLookupId);
    const { data, error } = useAsync<ValidatorsPageResponse>(getValidatorsPage(chain.chainId));

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

    console.log('data.stakingMetrics', data.stakingMetrics)
 
    return (
        <div className='d-flex flex-column mx-4'>
            <TitleAndSearch chain={chain} title='Validators' />
            <div className='d-flex flex-wrap w-full'>
                <Card className='col col-6 col-md-3'>
                    <h5>Active Validators</h5>
                    {data.stakingMetrics.activeValidators}
                </Card>
                <Card className='col col-6 col-md-3'>
                    <h5>Staking APR</h5>
                    {(data.stakingMetrics.nominalApr * 100).toFixed(2)}%
                </Card>
                <Card className='col col-6 col-md-3'>
                    <h5>Bond Rate</h5>
                    {(data.stakingMetrics.bondRate * 100).toFixed(2)}%
                </Card>
                <Card className='col col-6 col-md-3'>
                    <h5>Unbonding Time</h5>
                    {secondsToDhms(data.stakingMetrics.unbondingPeriodSeconds)}
                </Card>
            </div>
            <ValidatorsCard
                validators={data.validators}
                activeValidators={data.stakingMetrics.activeValidators}
                totalBonded={parseInt(data.stakingMetrics.bonded.amount)}
                chain={chain}
                title='Active Validators'
                className='d-flex flex-column gap-2'
            />
        </div>
    )
}

export default ValidatorsListPage;