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
import { AiOutlineBlock } from "react-icons/ai";
import { GrTransaction } from "react-icons/gr";
import { BiSolidBank } from "react-icons/bi";
import { FaArrowUpRightDots } from "react-icons/fa6";
import { RiCodeBlock } from "react-icons/ri";
import styles from './OverviewPage.module.scss';
import TriviumLoader from "../../components/TriviumLoader/TriviumLoader";

const OverviewPage: FC = () => {
    const { chain: chainLookupId } = useParams();
    const { getChain } = useConfig();
    const chain = getChain(chainLookupId);
    const { data, error } = useAsync<OverviewPageResponse>(getOverviewPage(chain.chainId));

    if (!chain) {
        return (
            <div>
                <h1>Chain Not Found</h1>
            </div>
        )
    }

    if (!data) {
        return <ContentLoading chain={chain} title='Overview' error={error} />
    }

    // const supply = parseFloat(weiToCoin(result.metrics.supply.amount, result.metrics.supply.denomDecimals)).toLocaleString(undefined, { maximumFractionDigits: 0 })
    const supply = weiFormatNice(data.metrics.supply.amount, data.metrics.supply.denomDecimals)
    const inflation = data.metrics.inflationRate * 100
    return (
        <div className='d-flex flex-column mx-md-4'>
            <TitleAndSearch chain={chain} title='Overview' />
            <div className='d-flex w-full flex-wrap'>
                <Card className='col col-6 col-md-3'>
                    <div className='statTitle'><RiCodeBlock /><h5>Block Height</h5></div>
                    {data.metrics.height.toLocaleString() || '...'}
                </Card>
                <Card className='col col-6 col-md-3'>
                    <div className='statTitle'><GrTransaction /><h5>Daily Transactions</h5></div>
                    {data.metrics.dailyTransactions?.toLocaleString?.() || '...'}
                </Card>
                <Card className='col col-6 col-md-3'>
                    <div className='statTitle'><BiSolidBank /><h5>Total Supply</h5></div>
                    {supply || '...'} {chain.bondingDisplayDenom}
                </Card>
                <Card className='col col-6 col-md-3'>
                    <div className='statTitle'><FaArrowUpRightDots /><h5>Inflation</h5></div>
                    {inflation?.toFixed(2) || '...'}%
                </Card>
            </div>
            <div className='d-flex flex-wrap'>
                <div className='col col-12 col-xl-6'>
                    <ValidatorsCard
                        validators={data.topValidators}
                        totalValidators={data.metrics.activeValidators}
                        totalBonded={parseInt(data.metrics.bonded.amount)}
                        chain={chain}
                        title='Top Validators'
                        showMoreLink={true}
                    />
                </div>
                <div className='col col-12 col-xl-6'>
                    <ProposalsCard proposals={data.recentProposals} totalProposals={data.metrics.totalProposals} chain={chain} showMoreLink={true} />
                </div>
            </div>
        </div>
    )
}

export default OverviewPage;