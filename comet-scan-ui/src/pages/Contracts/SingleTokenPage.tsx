import { FC, Fragment, useContext, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import useConfig from "../../hooks/useConfig";
import useAsync from "../../hooks/useAsync";
import { SingleContractPageResponse } from "@comet-scan/types";
import { getSingleContractPage } from "../../api/pagesApi";
import ContentLoading from "../../components/ContentLoading";
import Card from "../../components/Card";
import TabbedCard from "../../components/TabbedCard";
import TitleAndSearch from "../../components/TitleAndSearch";
import TransactionRow, { TransactionLabels } from "../../components/TransactionRow/TransactionRow";
import { toast } from "react-fox-toast";
import { formatNice } from "../../utils/coin";
import UserContext from "../../contexts/UserContext";
import Spinner from "../../components/Spinner";
import { SmallSpinner } from "../../components/SmallSpinner/smallSpinner";
import { Coin } from "secretjs/dist/protobuf/cosmos/base/v1beta1/coin";
import HistoryTxRow from "../../components/TokenRow/HistoryTxRow";
import ReactPaginate from "react-paginate";

export type HistoryTx = {
    id: number;
    from: string, // The address that was debited
    sender: string, // The addresses that initiated the transfer (in the case of TransferFrom via an approval)
    receiver: string,
    coins: Coin,
    memo?: string,
    block_time?: number,
    block_height?: number,
}

const SingleTokenPage: FC = () => {
    const { chain: chainLookupId, tokenAddress } = useParams();
    const { getChain } = useConfig();
    const chain = getChain(chainLookupId);
    const { data, error } = useAsync<SingleContractPageResponse>(getSingleContractPage(chain.chainId, tokenAddress));
    const title = `Token`;
    const { user } = useContext(UserContext);

    const [loadingViewKey, setLoadingViewKey] = useState(true);
    const [viewKey, setViewKey] = useState<string>();

    const [loadingAddToken, setLodingAddToken] = useState(false);

    const [loadingHistory, setLoadingHistory] = useState(false);
    const [historyPage, setHistoryPage] = useState(0);
    const [history, setHistory] = useState<HistoryTx[]>();
    const [totalHistoryItems, setTotalHistoryItems] = useState<number>();
    const [highestHistoryPage, setHighestHistoryPage] = useState(0);
    const [highestPageWasFull, setHighestPageWasFull] = useState(false);

    const historyPageSize = 25;
    const totalHistoryPages =
        totalHistoryItems ?
            Math.ceil(totalHistoryItems / historyPageSize)
        : highestPageWasFull ?
            highestHistoryPage + 2
        : highestHistoryPage + 1

    const handleLoadHistory = async (page = historyPage) => {
        try {
            if (!chain.features.includes('secretwasm')) return;
            if (!user) throw 'Wallet not connected.'
            if (!viewKey) throw 'Viewing key not loaded.'
            setLoadingHistory(true);

            const query = {
                transfer_history: {
                    address: user.address,
                    key: viewKey,
                    page_size: historyPageSize,
                    page,
                    should_filter_decoys: true,
                }
            }

            const result: any = await user.client.query.compute.queryContract({
                contract_address: tokenAddress,
                code_hash: data?.code.codeHash,
                query,
            });
            if (typeof result === 'string') throw result;

            setHistory(result.transfer_history.txs)

            if (page >= highestHistoryPage) {
                setHighestHistoryPage(page);
                if (result.transfer_history.txs.length === historyPageSize) setHighestPageWasFull(true);
                else setHighestPageWasFull(false);
            }
            
            if (result.transfer_history.total) {
                setTotalHistoryItems(result.transfer_history.total);
            }
        } catch (err: any) {
            toast.error(`Failed to load transfer history: ${err.toString()}`)
        } finally {
            setLoadingHistory(false)
        }
    }

    useEffect(()=>{
        if (!user) {
            // Reset values to default on logout
            setViewKey(undefined);
            setHistory(undefined);
            setHistoryPage(0);
            setHighestHistoryPage(0);
            setHighestPageWasFull(false);
            setTotalHistoryItems(undefined); 
            return;
        };
        (async()=>{
            try {
                setLoadingViewKey(true);
                const vk = await window.keplr.getSecret20ViewingKey(chain.chainId, tokenAddress);
                setViewKey(vk);
                // await handleLoadHistory();
            } catch (err) {
                console.error(err.toString())
            } finally {
                setLoadingViewKey(false)
            }
        })()
    }, [user])

    useEffect(()=>{
        if (!user) return;
        if (!viewKey) return;
        handleLoadHistory();
    }, [user, historyPage, viewKey])

    const changeHistoryPage = async (oldPage: number, newPage: number) => {
        try {
            setHistoryPage(newPage);
            handleLoadHistory(newPage);
        } catch (err: any) {
            console.error(`Error Loading History page ${newPage}:`, err);
            setHistoryPage(oldPage)
        }
    }

    if (!chain) {
        return (
            <div>
                <h1>Chain Not Found</h1>
            </div>
        )
    }

    if (!data) {
        return <ContentLoading chain={chain} title={title} error={error} />
    }

    const handleDownloadCode = async () => {
        try {
            if (!data.verification?.code_zip) throw 'Contract not verified';

            const link = document.createElement('a');
            link.innerHTML = 'Download cope ZIP';
            link.download = 'code.zip';
            link.href = 'data:application/zip;base64,' + data.verification.code_zip;
            link.click();
        } catch (err: any) {
            toast.error(`Failed to download: ${err.toString()}`)
        }
    }

    const handleAddToWallet  = async () => {
        try {
            if (!window.keplr) throw 'Keplr Wallet Not Found';
            setLodingAddToken(true);

            await window.keplr.suggestToken(chain.chainId, tokenAddress);
            const vk = await window.keplr.getSecret20ViewingKey(chain.chainId, tokenAddress);
            setViewKey(vk);
            // await handleLoadHistory();
        } catch (err: any) {
            toast.error(`Failed to add token to wallet: ${err.toString()}`)
        } finally {
            setLodingAddToken(false)
        }
    }

    const historyTabContent = !user ?
        <div className='py-4 w-full text-center'>
            Connect your wallet to view your SNIP-20 transfer history.
        </div>
    : (loadingViewKey || loadingHistory) ?
        <div className='py-4 w-full text-center'>
            <Spinner />
        </div>
    : !viewKey ?
        <div className='py-4 w-full text-center d-flex flex-column align-items-center gap-2'>
            Add this token to your wallet to view your SNIP-20 transfer history.
            <button type='button' onClick={()=>handleAddToWallet()} disabled={loadingAddToken} className='d-flex align-items-center gap-2'>
                Add to Wallet{loadingAddToken && <SmallSpinner />}
            </button>
        </div>
    : !history?.length ?
        <div className='py-4 w-full text-center'>
            No transfers found.
        </div>
    : <div style={{overflowX: 'auto'}} className='w-full'>
        <div style={{minWidth: '1024px'}}>
            {!history[0].block_height && <div className='alertContainer'>Transfer timestamps are not available for this token.</div>}
            {(!!history.length && !history[0].block_height) &&
                <div className='d-flex mt-4 mb-1'>
                    <div className='col col-5'>
                        From
                    </div>
                    <div className='col col-5'>
                        To
                    </div>
                    <div className='col col-2 text-end'>
                        Amount
                    </div>
                </div>
            }
            {(!!history.length && !!history[0].block_height) &&
                <div className='d-flex mt-4 mb-1'>
                    <div className='col col-4'>
                        From
                    </div>
                    <div className='col col-4'>
                        To
                    </div>
                    <div className='col col-2 text-end'>
                        Amount
                    </div>
                    <div className='col col-2 text-end'>
                        Block
                    </div>
                </div>
            }
            {history.map((tx) =><Fragment key={tx.id}>
                <div style={{borderBottom: '1px solid var(--light-gray)'}} />
                <HistoryTxRow contract={data.contract} chain={chain} historyTx={tx} />
            </Fragment>)}
            
            {!!history.length && 
                <ReactPaginate
                    breakLabel="..."
                    nextLabel=">"
                    onPageChange={e => changeHistoryPage(historyPage, e.selected)}
                    pageRangeDisplayed={2}
                    pageCount={totalHistoryPages}
                    forcePage={historyPage}
                    previousLabel="<"
                    renderOnZeroPageCount={null}
                    className="react-paginate"
                />
            }
        </div>
    </div>
 
    return (
        <div className='d-flex flex-column'>
            <TitleAndSearch chain={chain} title={title} />
            <Card>
                <h3>Overview</h3>
                <div style={{borderBottom: '1px solid var(--light-gray)', paddingTop: '8px'}} />
                <div className='d-flex flex-column gap-3 mt-3'>
                    <div className='d-flex'>
                        <div className='col-3 font-weight-bold'>Contract Address</div>
                        <div className='col'>
                            <Link to={`/${chainLookupId}/contracts/${data.contract.contractAddress}`}>{data.contract.contractAddress}</Link>
                        </div>
                    </div>
                    { !!data.contract.tokenInfo && <>
                        <div className='d-flex'>
                            <div className='col-3 font-weight-bold'>Token Name</div>
                            <div className='col'>{data.contract.tokenInfo.name}</div>
                        </div>
                        <div className='d-flex'>
                            <div className='col-3 font-weight-bold'>Token Symbol</div>
                            <div className='col'>{data.contract.tokenInfo.symbol}</div>
                        </div>
                        <div className='d-flex'>
                            <div className='col-3 font-weight-bold'>Total Supply</div>
                            <div className='col'>
                            {data.contract.tokenInfo.totalSupply ? 
                                formatNice(parseInt(data.contract.tokenInfo.totalSupply) / Math.pow(10, data.contract.tokenInfo.decimals))
                            :
                                'Private'
                            }
                            </div>
                        </div>
                        {chain.features.includes('secretwasm') &&
                            <div className='d-flex'>
                                <div className='col-3 font-weight-bold'>Permit Support</div>
                                <div className='col'>{data.contract.tokenInfo.permitSupport ? 'Yes' : 'No'}</div>
                            </div>
                        }
                    </>}
                    <div className='d-flex'>
                        <div className='col-3 font-weight-bold'>Contract Label</div>
                        <div className='col'>{data.contract.label}</div>
                    </div>

                    <div className='d-flex'>
                        <div className='col-3 font-weight-bold'>Verified</div>
                        <div className='col d-flex gap-4'>
                            {data.verification ? 'Yes' : 'No'}
                            { !data.verification &&
                                <Link to={`/${chainLookupId}/codes/verify`}>Verify Contract Code</Link>
                            }
                        </div>
       
                    </div>
                    { !!data.verification?.code_zip &&
                        <div className='d-flex'>
                            <div className='col-3 font-weight-bold'>Source Code</div>
                            <div className='col d-flex gap-3'>
                                <button type='button' className='buttonLink' onClick={handleDownloadCode}>Download</button>
                                <Link to={`/${chainLookupId}/contracts/${data.contract.contractAddress}/source`} className='buttonLink'>View in Browser</Link>
                            </div>
                        </div>
                    }
                    <div className='d-flex'>
                        <div className='col-3 font-weight-bold'>Created Height</div>
                        <div className='col'>
                            { data.contract.created?.block_height ? 
                                <Link to={`/${chainLookupId}/blocks/${data.contract.created.block_height}`}>{parseInt(data.contract.created.block_height).toLocaleString()}</Link>
                            : 'Unknown' }
                        </div>
                    </div>
                    <div className='d-flex'>
                        <div className='col-3 font-weight-bold'>Creator</div>
                        <div className='col'><Link to={`/${chainLookupId}/accounts/${data.contract.creator}`}>{data.contract.creator}</Link></div>
                    </div>
                    <div className='d-flex'>
                        <div className='col-3 font-weight-bold'>Admin</div>
                        <div className='col'>
                            {data.contract.admin ?
                                <Link to={`/${chainLookupId}/accounts/${data.contract.admin}`}>{data.contract.admin}</Link>
                            : 'None'}
                        </div>
                    </div>
                </div>
            </Card>
            <TabbedCard
                tabs={[
                    {
                        title: "Transactions",
                        content: (
                            <>
                                {!!data.recentTransactions.length &&
                                    <TransactionLabels />
                                }
                                {data.recentTransactions.map((tx) =><Fragment key={tx.hash}>
                                    <div style={{borderBottom: '1px solid var(--light-gray)'}} />
                                    <TransactionRow transaction={tx} chain={chain} />
                                </Fragment>)}
                                {!data.recentTransactions.length && <div className='py-4 w-full text-center'>
                                    No transactions found.
                                </div>}
                            </>
                        )
                    },
                    {
                        title: "History",
                        content: historyTabContent,
                    }
                ]}
            />
        </div>
    )
}

export default SingleTokenPage;