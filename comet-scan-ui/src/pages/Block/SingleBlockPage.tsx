import { FC, Fragment } from "react";
import { Link, useParams } from "react-router-dom";
import useConfig from "../../hooks/useConfig";
import useAsync from "../../hooks/useAsync";
import ContentLoading from "../../components/ContentLoading";
import Card from "../../components/Card";
import TitleAndSearch from "../../components/TitleAndSearch";
import { weiFormatNice } from "../../utils/coin";
import { SingleBlockPageResponse } from "../../interfaces/responses/explorerApiResponses";
import { getSingleBlockPage } from "../../api/pagesApi";
import TransactionRow, { TransactionLabels } from "../../components/TransactionRow/TransactionRow";
import ValidatorAvatar from "../../components/Avatar/KeybaseAvatar";

const SingleBlockPage: FC = () => {
    const { chain: chainLookupId, blockHeight } = useParams();
    const { getChain } = useConfig();
    const chain = getChain(chainLookupId);
    const { data, error } = useAsync<SingleBlockPageResponse>(getSingleBlockPage(chain.chainId, blockHeight));

    if (!chain) {
        return (
            <div>
                <h1>Chain Not Found</h1>
            </div>
        )
    }

    if (!data) {
        return <ContentLoading chain={chain} title={`Block ${blockHeight}`} error={error} />
    }

    const proposerDetails = data.proposer?.descriptions.length ? data.proposer.descriptions[0] : undefined;
    return (
        <div className='d-flex flex-column'>
            <TitleAndSearch chain={chain} title={`Block ${blockHeight}`} />
            <div className='d-flex flex-wrap w-full'>
                <Card className='col col-6 col-md-3 flex-grow-1'>
                    <h5>Time</h5>
                    {new Date(data.block.timestamp).toLocaleString()}
                </Card>
                <Card className='col col-6 col-md-3 flex-grow-1'>
                    <h5>Transactions</h5>
                    {data.transactions.length}
                </Card>
                <Card className='col col-6 col-md-3 flex-grow-1'>
                    <h5>Gas Used</h5>
                    {data.block.totalGasUsed.toLocaleString()}
                </Card>
                <Card className='col col-6 col-md-3 flex-grow-1'>
                    <h5>Total Fee</h5>
                    {weiFormatNice(data.block.totalFees.find(f => f.denom === chain.bondingDenom)?.amount || '0', chain.bondingDecimals)} {chain.bondingDisplayDenom}
                </Card>
            </div>
            <Card>
                <div className='d-flex flex-column gap-3 mt-3'>
                    <div className='d-flex'>
                        <div className='col-3 font-weight-bold'>Block Time</div>
                        <div className='col'>{new Date(data.block.timestamp).toLocaleString()}</div>
                    </div>
                    <div className='d-flex'>
                        <div className='col-3 font-weight-bold'>Block Height</div>
                        <div className='col'>
                            {data.block.height}
                        </div>
                    </div>
                    <div className='d-flex'>
                        <div className='col-3 font-weight-bold'>Block Hash</div>
                        <div className='col'>
                            {data.block.hash}
                        </div>
                    </div>
                    { !!data.block.blockTime &&
                        <div className='d-flex'>
                            <div className='col-3 font-weight-bold'>Time Since Previous Block</div>
                            <div className='col'>{(data.block.blockTime / 1000).toFixed(2)} seconds</div>
                        </div>
                    }
                    <div className='d-flex'>
                        <div className='col-3 font-weight-bold'>Transactions</div>
                        <div className='col'>
                            {data.transactions.length}  
                        </div>
                    </div>
                    <div className='d-flex'>
                        <div className='col-3 font-weight-bold'>Proposer</div>
                        <div className='col d-flex gap-2 align-items-center'>
                            { data.proposer ? <Link to={`/${chainLookupId}/validators/${data.proposer.operatorAddress}`} className='d-flex gap-2 align-items-center'>
                                <ValidatorAvatar avatarUrl={proposerDetails?.keybaseAvatarUrl} moniker={proposerDetails?.moniker} />
                                {proposerDetails?.moniker || data.proposer?.operatorAddress || data.block.block.result.block.header.proposer_address}
                            </Link>
                            :
                            <>
                                <ValidatorAvatar avatarUrl={proposerDetails?.keybaseAvatarUrl} moniker={proposerDetails?.moniker} />
                                {proposerDetails?.moniker || data.proposer?.operatorAddress || data.block.block.result.block.header.proposer_address}
                            </>}

                        </div>
                    </div>
                </div>
            </Card>
            <Card>
                <h3>Transactions</h3>
                {!!data.transactions.length &&
                    <TransactionLabels />
                }
                {data.transactions.map((tx) =><Fragment key={tx.hash}>
                    <div style={{borderBottom: '1px solid var(--light-gray)'}} />
                    <TransactionRow transaction={tx} chain={chain} />
                </Fragment>)}
                {!data.transactions.length && <div className='py-4 w-full text-center'>
                    No transactions found.
                </div>}
            </Card>
        </div>
    )
}

export default SingleBlockPage;