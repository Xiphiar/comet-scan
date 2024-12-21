import { FC } from "react";
import { useParams } from "react-router-dom";
import useConfig from "../../hooks/useConfig";
import Card from "../../components/Card";
import ValidatorsCard from "./ValidatorsCard";
import useAsync from "../../hooks/useAsync";
import { getOverviewPage } from "../../api/pagesApi";
import { weiFormatNice } from "../../utils/coin";
import ProposalsCard from "./ProposalsCard";
import { OverviewPageResponse } from "../../interfaces/responses/explorerApiResponses";
import ContentLoading from "../../components/ContentLoading";
import TitleAndSearch from "../../components/TitleAndSearch";

const OverviewPage: FC = () => {
    const { chain: chainLookupId } = useParams();
    const { getChain } = useConfig();
    const chain = getChain(chainLookupId);
    const { data } = useAsync<OverviewPageResponse>(getOverviewPage(chain.chainId));

    if (!chain) {
        return (
            <div>
                <h1>Chain Not Found</h1>
            </div>
        )
    }

    if (!data) {
        return <ContentLoading chain={chain} title='Overview' />
    }

    // const supply = parseFloat(weiToCoin(result.metrics.supply.amount, result.metrics.supply.denomDecimals)).toLocaleString(undefined, { maximumFractionDigits: 0 })
    const supply = weiFormatNice(data.metrics.supply.amount, data.metrics.supply.denomDecimals)
    const inflation = data.metrics.inflationRate * 100
    return (
        <div className='d-flex flex-column gap-2 mx-4'>
            <TitleAndSearch chain={chain} title='Overview' />
            <div className='d-flex gap-2 w-full'>
                <Card className='col'>
                    <h5>Block Height</h5>
                    {data.metrics.height.toLocaleString() || '...'}
                </Card>
                <Card className='col'>
                    <h5>Daily Transactions</h5>
                    {data.metrics.dailyTransactions || '...'}
                </Card>
                <Card className='col'>
                    <h5>Total Supply</h5>
                    {supply || '...'} {chain.bondingDisplayDenom}
                </Card>
                <Card className='col'>
                    <h5>Inflation</h5>
                    {inflation?.toFixed(2) || '...'}%
                </Card>
            </div>
            <div className='d-flex flex-wrap gap-2'>
                <div className='col'>
                    <ValidatorsCard validators={data.topValidators} activeValidators={data.metrics.activeValidators} chain={chain} title='Top Validators' />
                </div>
                <div className='col col-12 col-md-6'>
                    <ProposalsCard proposals={data.recentProposals} totalProposals={data.metrics.totalProposals} chain={chain} />
                </div>
            </div>
        </div>
    )
}

export default OverviewPage;