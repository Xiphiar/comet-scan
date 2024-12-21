import { FC } from "react";
import { Link, useParams } from "react-router-dom";
import useConfig from "../../hooks/useConfig";
import useAsync from "../../hooks/useAsync";
import ContentLoading from "../../components/ContentLoading";
import Card from "../../components/Card";
import TitleAndSearch from "../../components/TitleAndSearch";
import { weiFormatNice } from "../../utils/coin";
import { SingleTransactionPageResponse } from "../../interfaces/responses/explorerApiResponses";
import { getSingleTransactionPage } from "../../api/pagesApi";
import MessageRow from "../../components/MessageRow/messageRow";
import { truncateString } from "../../utils/format";

const SingleTransactionPage: FC = () => {
    const { chain: chainLookupId, transactionHash } = useParams();
    const { getChain } = useConfig();
    const chain = getChain(chainLookupId);
    const { data } = useAsync<SingleTransactionPageResponse>(getSingleTransactionPage(chain.chainId, transactionHash));

    if (!chain) {
        return (
            <div>
                <h1>Chain Not Found</h1>
            </div>
        )
    }

    if (!data) {
        return <ContentLoading chain={chain} title={`Transaction ${truncateString(transactionHash)}`} />
    }

    const feeAmount = data.transaction.transaction.tx.auth_info.fee.amount.find(coin => coin.denom === chain.bondingDenom)?.amount || '0'; 
    return (
        <div className='d-flex flex-column gap-2 mx-4'>
            <TitleAndSearch chain={chain} title={`Transaction ${truncateString(transactionHash)}`} />
            <div className='d-flex gap-2 w-full'>
                <Card className='col'>
                    <h5>Time</h5>
                    {new Date(data.transaction.timestamp).toLocaleString()}
                </Card>
                <Card className='col'>
                    <h5>Status</h5>
                    {data.transaction.succeeded ? 'Succeeded' : <span style={{color: 'red'}}>Failed</span>}
                </Card>
                <Card className='col'>
                    <h5>Gas Used</h5>
                    {data.transaction.gasUsed.toLocaleString()} / {data.transaction.gasLimit.toLocaleString()}
                </Card>
                <Card className='col'>
                    <h5>Fee</h5>
                    {weiFormatNice(feeAmount, chain.bondingDecimals)} {chain.bondingDisplayDenom}
                </Card>
            </div>
            <Card>
                <div className='d-flex flex-column gap-3 mt-3'>
                    <div className='d-flex'>
                        <div className='col-3 font-weight-bold'>Transaction Time</div>
                        <div className='col'>{new Date(data.transaction.timestamp).toLocaleString()}</div>
                    </div>
                    <div className='d-flex'>
                        <div className='col-3 font-weight-bold'>Transaction Height</div>
                        <div className='col'>
                            <Link to={`/${chain.id}/blocks/${data.transaction.blockHeight}`}>{data.transaction.blockHeight}</Link>
                        </div>
                    </div>
                    <div className='d-flex'>
                        <div className='col-3 font-weight-bold'>Transaction Hash</div>
                        <div className='col'>
                            {data.transaction.hash}
                        </div>
                    </div>
                    <div className='d-flex'>
                        <div className='col-3 font-weight-bold'>Gas Used</div>
                        <div className='col'>
                            {data.transaction.gasUsed.toLocaleString()}  
                        </div>
                    </div>
                    <div className='d-flex'>
                        <div className='col-3 font-weight-bold'>Gas Limit</div>
                        <div className='col'>
                            {data.transaction.gasLimit.toLocaleString()}  
                        </div>
                    </div>
                    <div className='d-flex'>
                        <div className='col-3 font-weight-bold'>Memo</div>
                        <div className='col'>
                            {data.transaction.transaction.tx.body.memo}  
                        </div>
                    </div>
                </div>
            </Card>
            <Card className='d-flex flex-column gap-3'>
                <h3>Messages</h3>
                {data.transaction.transaction.tx.body.messages.map((_, i) =><>
                    <MessageRow transaction={data.transaction} messageIndex={i} />
                </>)}
            </Card>
        </div>
    )
}

export default SingleTransactionPage;