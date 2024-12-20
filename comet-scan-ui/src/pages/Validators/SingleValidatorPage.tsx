import { FC } from "react";
import { Link, useParams } from "react-router-dom";
import { Chains } from "../../config/chains";
import useAsync from "../../hooks/useAsync";
import { SingleValidatorPageResponse } from "../../interfaces/responses/explorerApiResponses";
import { getSingleValidatorPage } from "../../api/pagesApi";
import ContentLoading from "../../components/ContentLoading";
import Card from "../../components/Card";
import TitleAndSearch from "../../components/TitleAndSearch";
import styles from './SingleValidatorPage.module.scss';
import { weiFormatNice } from "../../utils/coin";
import KeybaseAvatar from "../../components/Avatar/KeybaseAvatar";

const SingleValidatorPage: FC = () => {
    const { chain: chainLookupId, operatorAddress } = useParams();
    const chain = Chains.find(c => c.id.toLowerCase() === chainLookupId?.toLowerCase());
    const { data } = useAsync<SingleValidatorPageResponse>(getSingleValidatorPage(chain.chainId, operatorAddress));
    const currentDetails = data?.validator.descriptions.length ? data.validator.descriptions[0] : undefined;

    if (!chain) {
        return (
            <div>
                <h1>Chain Not Found</h1>
            </div>
        )
    }

    if (!data) {
        return <ContentLoading chain={chain} title='Validator' />
    }

    console.log('ABAAB',data.validator.selfBondedAmount)
 
    return (
        <div className='d-flex flex-column gap-2 mx-4'>
            <TitleAndSearch chain={chain} title='Validator' />
            <Card>
                <div>
                    <div className='d-flex align-items-center gap-2'>
                        <KeybaseAvatar identity={currentDetails?.identity} moniker={currentDetails?.moniker} size='70px' />
                        <h2>{currentDetails?.moniker || data.validator.operatorAddress}</h2>
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
            <div className='d-flex gap-2 w-full'>
                <Card className='col'>
                    <h5>Total Bonded</h5>
                    {weiFormatNice(data.validator.delegatedAmount, chain.bondingDecimals)} {chain.bondingDisplayDenom} (#{data.rank})
                </Card>
                <Card className='col'>
                    <h5>Self Bonded</h5>
                    {weiFormatNice(data.validator.selfBondedAmount, chain.bondingDecimals)} {chain.bondingDisplayDenom}
                </Card>
                <Card className='col'>
                    <h5>Voting Power</h5>
                    {data.votingPower * 100}%
                </Card>
                <Card className='col'>
                    <h5>Commission Rate</h5>
                    {parseFloat(data.validator.commission.rates[0].rate) * 100}%
                </Card>
            </div>
            <div className='d-flex flex-wrap gap-2'>
                <div className='col col-12 col-md-6'>
                    <Card>
                        TODO
                    </Card>
                </div>
                <div className='col'>
                    <Card>
                        TODO
                    </Card>
                </div>
            </div>
        </div>
    )
}

export default SingleValidatorPage;