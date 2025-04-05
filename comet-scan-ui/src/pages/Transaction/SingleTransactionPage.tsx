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
import { parseMessages, formatTxType } from "../../utils/messageParsing";
import { ParsedMessage } from "../../utils/messageParsing";
import { useUser } from "../../hooks/useUser";
import Spinner from "../../components/Spinner";
import TabbedCard from "../../components/TabbedCard";
import JsonView from "react18-json-view";
import { GrStatusGood, GrStatusCritical } from "react-icons/gr";
import { FaGasPump, FaRegClock } from "react-icons/fa6";
import { RiCoinsLine } from "react-icons/ri";
import EventRow from "../../components/EventRow/EventRow";
import { TxEvent } from "../../interfaces/lcdTxResponse";

const SingleTransactionPage: FC = () => {
    const { chain: chainLookupId, transactionHash } = useParams();
    const { getChain, chains: allChains } = useConfig();
    const chain = getChain(chainLookupId);
    const { data, error } = useAsync<SingleTransactionPageResponse>(getSingleTransactionPage(chain.chainId, transactionHash));
    const [parsedMessages, setParsedMessages] = useState<ParsedMessage[] | undefined>(undefined);
    const [eventsByMsgIndex, setEventsByMsgIndex] = useState<Map<number, TxEvent[]>>(new Map());
    const { user } = useUser();

    useEffect(() => {
        if (!data) return;
        (async () => {
            const messages = await parseMessages(chain, allChains, data.transaction.transaction, data.executedContracts, user?.encryptionUtils);
            setParsedMessages(messages);
        })();
    }, [data, user?.encryptionUtils, chain, allChains]);

    useEffect(() => {
        if (!data) return;
        // Group events by message index
        const events = data.transaction.transaction.tx_response.events;
        const groupedEvents = new Map<number, TxEvent[]>();
        
        events.forEach(event => {
            const msgIndexAttr = event.attributes.find(attr => attr.key === 'msg_index');
            if (msgIndexAttr) {
                const msgIndex = parseInt(msgIndexAttr.value);
                if (!groupedEvents.has(msgIndex)) {
                    groupedEvents.set(msgIndex, []);
                }
                groupedEvents.get(msgIndex)?.push(event);
            }
        });
        
        setEventsByMsgIndex(groupedEvents);
    }, [data]);

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
                    <div className='statTitle'><FaRegClock /><h5>Time</h5></div>
                    {new Date(data.transaction.timestamp).toLocaleString()}
                </Card>
                <Card className='col col-6 col-md-3'>
                    <div className='statTitle'>{data.transaction.succeeded ? <GrStatusGood /> : <GrStatusCritical />}<h5>Status</h5></div>
                    {data.transaction.succeeded ? 'Succeeded' : <span style={{color: 'red'}}>Failed</span>}
                </Card>
                <Card className='col col-6 col-md-3'>
                    <div className='statTitle'><FaGasPump /><h5>Gas Used</h5></div>
                    {data.transaction.gasUsed.toLocaleString()} / {data.transaction.gasLimit.toLocaleString()}
                </Card>
                <Card className='col col-6 col-md-3'>
                    <div className='statTitle'><RiCoinsLine /><h5>Fee</h5></div>
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
                        title: "Events",
                        content: (
                            <>
                                <h3>Events</h3>
                                {parsedMessages === undefined ? (
                                    <div className='d-flex justify-content-center'>
                                        <Spinner />
                                    </div>
                                ) : (
                                    Array.from(eventsByMsgIndex.entries()).map(([msgIndex, events]) => {
                                        // Find the message title for this msg_index
                                        const msgTitle = msgIndex < parsedMessages.length 
                                            ? parsedMessages[msgIndex].title 
                                            : formatTxType(data.transaction.transaction.tx.body.messages[msgIndex]['@type']);
                                        
                                        return (
                                            <EventRow 
                                                key={`events-msg-${msgIndex}`}
                                                events={events}
                                                messageIndex={msgIndex}
                                                messageTitle={msgTitle}
                                            />
                                        );
                                    })
                                )}
                                {eventsByMsgIndex.size === 0 && (
                                    <div className="text-center p-4">
                                        No events with message index found
                                    </div>
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