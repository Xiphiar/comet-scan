import { FC, useState, useEffect } from "react";
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
import { parseMessages } from "../../utils/messageParsing";
import { ParsedMessage } from "../../utils/messageParsing";
import { useUser } from "../../hooks/useUser";
import Spinner from "../../components/Spinner";
import TabbedCard from "../../components/TabbedCard";
import JsonView from "react18-json-view";

const SingleTransactionPage: FC = () => {
    const { chain: chainLookupId, transactionHash } = useParams();
    const { getChain } = useConfig();
    const chain = getChain(chainLookupId);
    const { data, error } = useAsync<SingleTransactionPageResponse>(getSingleTransactionPage(chain.chainId, transactionHash));
    const [parsedMessages, setParsedMessages] = useState<ParsedMessage[] | undefined>(undefined);
    const { user } = useUser();

    useEffect(() => {
        if (!data) return;
        (async () => {
            const messages = await parseMessages(chain, data.transaction.transaction, user?.encryptionUtils);
            setParsedMessages(messages);
        })();
    }, [data, user?.encryptionUtils, chain]);

    if (!chain) {
        return (
            <div>
                <h1>Chain Not Found</h1>
            </div>
        )
    }

    if (!data) {
        return <ContentLoading chain={chain} title={`Transaction ${truncateString(transactionHash)}`} error={error} />
    }

    const feeAmount = data.transaction.transaction.tx.auth_info.fee.amount.find(coin => coin.denom === chain.bondingDenom)?.amount || '0'; 

    return (
        <div className='d-flex flex-column'>
            <TitleAndSearch chain={chain} title={`Transaction ${truncateString(transactionHash)}`} />
            <div className='d-flex flex-wrap w-full'>
                <Card className='col col-6 col-md-3'>
                    <h5>Time</h5>
                    {new Date(data.transaction.timestamp).toLocaleString()}
                </Card>
                <Card className='col col-6 col-md-3'>
                    <h5>Status</h5>
                    {data.transaction.succeeded ? 'Succeeded' : <span style={{color: 'red'}}>Failed</span>}
                </Card>
                <Card className='col col-6 col-md-3'>
                    <h5>Gas Used</h5>
                    {data.transaction.gasUsed.toLocaleString()} / {data.transaction.gasLimit.toLocaleString()}
                </Card>
                <Card className='col col-6 col-md-3'>
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
                            <Link to={`/${chain.id}/blocks/${data.transaction.blockHeight}`}>{data.transaction.blockHeight.toLocaleString()}</Link>
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
            <TabbedCard 
                conentClassName='d-flex flex-column gap-2'
                tabs={[
                    {
                        title: "Messages",
                        content: (
                            <>
                                <h3>Messages</h3>
                                {parsedMessages === undefined ? (
                                    <div className='d-flex justify-content-center'>
                                        <Spinner />
                                    </div>
                                ) : (
                                    parsedMessages.map((msg, i) => (
                                        <MessageRow 
                                            message={msg} 
                                            messageIndex={i} 
                                            key={`${msg.title}-${i}-${msg.content.length}`} 
                                        />
                                    ))
                                )}
                            </>
                        )
                    },
                    {
                        title: "JSON",
                        content: (
                            <>
                                <h3>Transaction JSON</h3>
                                <JsonView src={data.transaction.transaction} />
                            </>
                        )
                    }
                ]}
            />
        </div>
    )
}

export default SingleTransactionPage;