import { FC, useState, useEffect, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import useConfig from "../../hooks/useConfig";
import useAsync from "../../hooks/useAsync";
import ContentLoading from "../../components/ContentLoading";
import Card from "../../components/Card";
import TitleAndSearch from "../../components/TitleAndSearch";
import { weiFormatNice } from "../../utils/coin";
import { SingleTransactionPageResponse, TxEvent } from "@comet-scan/types";
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
import ResponseRow from "../../components/ResponseRow/ResponseRow";
import decodeTxResponse, { DecryptedTxResponse } from "../../utils/secret";
import ErrorAlert from "../../components/ErrorAlert/ErrorAlert";

const SingleTransactionPage: FC = () => {
    const { chain: chainLookupId, transactionHash } = useParams();
    const { getChain, chains: allChains } = useConfig();
    const chain = getChain(chainLookupId);
    const { data, error } = useAsync<SingleTransactionPageResponse>(getSingleTransactionPage(chain.chainId, transactionHash));
    const [parsedMessages, setParsedMessages] = useState<ParsedMessage[] | undefined>(undefined);
    const [eventsByMsgIndex, setEventsByMsgIndex] = useState<Map<number, TxEvent[]>>(new Map());
    const [decryptedTx, setDecrypedTx] = useState<DecryptedTxResponse | undefined>(undefined);
    const { user } = useUser();

    useEffect(() => {
        if (!data) return;
        (async () => {
            const messages = await parseMessages(chain, allChains, data.transaction.transaction, data.executedContracts, user?.encryptionUtils);
            setParsedMessages(messages);
        })();
    }, [data, user?.encryptionUtils, chain, allChains]);

    // Decrypt events when user is logged in
    useEffect(() => {
        if (!data || !user?.encryptionUtils || !chain.features.includes('secretwasm')) return;
        
        const decryptTx = async () => {
            try {
                const decodedTx = await decodeTxResponse(
                    user.encryptionUtils, 
                    data.transaction.transaction.tx_response
                );

                setDecrypedTx(decodedTx);
            } catch (error) {
                console.error("Failed to decrypt events:", error);
            }
        };
        
        decryptTx();
    }, [chain.features, data, user?.encryptionUtils]);

    // Group events by message index (use decrypted events if available)
    useEffect(() => {
        if (!data) return;
        
        // Use decrypted events if available, otherwise use original events
        const events = decryptedTx?.events as TxEvent[] || data.transaction.transaction.tx_response.events;
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
    }, [data, decryptedTx]);

    const decodedResponses: string[] | undefined = useMemo(()=>{
        // Response data is pretty useless outside of secret network,
        // so there's no point in processing it on other networks
        if (!data || !chain.features.includes('secretwasm')) return undefined;

        const dr: string[] = []

        if (decryptedTx) {
            for (const d of decryptedTx.data) {
                if (!decryptedTx.dataDecrypted) {
                    if (!user) dr.push('Response data is encrypted. Connect the sending wallet to decrypt.')
                    else dr.push(`Response data is encrypted. Either the connected wallet is not the sender, or a different encryption key was used for this transaction.`)
                    continue;
                }
                const string = Buffer.from(d).toString('utf8');
                // Strip unicode special characters (probably leftover from protobuf encoding)
                dr.push(string.replace(/[\u{FFF0}-\u{FFFF}]/gu,"") || 'No response data.')
            }
        } else {
            // TODO falls back to this when a user isn't logged in. Eventually should display the tab with the encrypted warnings above.
            // const txMsgData = TxMsgData.decode(fromHex(data.transaction.transaction.tx_response.data));
            
            // for (const mr of txMsgData.msg_responses) {
            //     const string = Buffer.from(mr.value).toString('utf8');
            //     const clean = string.replace(/[\u{FFF0}-\u{FFFF}]/gu,"");
            //     dr.push(clean || 'No response data.')
            // }
        }

        return dr;
    }, [chain.features, data, decryptedTx, user])

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

    // Generate the tabs dynamically based on availability of decoded responses
    const generateTabs = () => {
        const tabs = [
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
            }
        ];

        // Add Responses tab only if we have decoded responses
        if (decodedResponses && decodedResponses.length > 0) {
            tabs.push({
                title: "Responses",
                content: (
                    <>
                        <h3>Responses</h3>
                        {parsedMessages === undefined ? (
                            <div className='d-flex justify-content-center'>
                                <Spinner />
                            </div>
                        ) : (
                            decodedResponses.map((responseData, i) => {
                                // Find the message title for this response
                                const msgTitle = i < parsedMessages.length 
                                    ? parsedMessages[i].title 
                                    : formatTxType(data.transaction.transaction.tx.body.messages[i]['@type']);
                                
                                return (
                                    <ResponseRow 
                                        key={`response-${i}`}
                                        responseData={responseData}
                                        messageIndex={i}
                                        messageTitle={msgTitle}
                                    />
                                );
                            })
                        )}
                    </>
                )
            });
        }

        // Add Events tab
        tabs.push({
            title: "Events",
            content: (
                <>
                    <h3>Events</h3>
                    {parsedMessages === undefined ? (
                        <div className='d-flex justify-content-center'>
                            <Spinner />
                        </div>
                    ) : (
                        <>
                            {Array.from(eventsByMsgIndex.entries()).map(([msgIndex, events]) => {
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
                            })}
                            {eventsByMsgIndex.size === 0 && (
                                <div className="text-center p-4">
                                    No events found
                                </div>
                            )}
                        </>
                    )}
                </>
            )
        });

        // Add JSON tab
        tabs.push({
            title: "JSON",
            content: (
                <>
                    <h3>Transaction JSON</h3>
                    <JsonView src={data.transaction.transaction} theme="atom" />
                </>
            )
        });

        return tabs;
    };

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
                <div className='d-flex flex-column gap-3'>
                    {!data.transaction.succeeded &&
                        <ErrorAlert title='Transaction Failed'>
                            {data.transaction.transaction.tx_response.raw_log}
                        </ErrorAlert>
                    }
                    <div className='d-flex flex-wrap'>
                        <div className='col col-12 col-sm-3 font-weight-bold'>Transaction Time</div>
                        <div className='col ms-3 ms-sm-0'>{new Date(data.transaction.timestamp).toLocaleString()}</div>
                    </div>
                    <div className='d-flex flex-wrap'>
                        <div className='col col-12 col-sm-3 font-weight-bold'>Transaction Height</div>
                        <div className='col ms-3 ms-sm-0'>
                            <Link to={`/${chain.id}/blocks/${data.transaction.blockHeight}`}>{data.transaction.blockHeight.toLocaleString()}</Link>
                        </div>
                    </div>
                    <div className='d-flex flex-wrap'>
                        <div className='col col-12 col-sm-3 font-weight-bold'>Transaction Hash</div>
                        <div className='col ms-3 ms-sm-0 text-break'>
                            {data.transaction.hash}
                        </div>
                    </div>
                    <div className='d-flex flex-wrap'>
                        <div className='col col-12 col-sm-3 font-weight-bold'>Gas Used</div>
                        <div className='col ms-3 ms-sm-0'>
                            {data.transaction.gasUsed.toLocaleString()}  
                        </div>
                    </div>
                    <div className='d-flex flex-wrap'>
                        <div className='col col-12 col-sm-3 font-weight-bold'>Gas Limit</div>
                        <div className='col ms-3 ms-sm-0'>
                            {data.transaction.gasLimit.toLocaleString()}  
                        </div>
                    </div>
                    { !!data.transaction.transaction.tx.body.memo?.trim().length &&
                        <div className='d-flex flex-wrap'>
                            <div className='col col-12 col-sm-3 font-weight-bold'>Memo</div>
                            <div className='col ms-3 ms-sm-0'>
                                {data.transaction.transaction.tx.body.memo}  
                            </div>
                        </div>
                    }
                </div>
            </Card>
            <TabbedCard 
                conentClassName='d-flex flex-column gap-2'
                tabs={generateTabs()}
            />
        </div>
    )
}

export default SingleTransactionPage;