import { FC, Fragment, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import useConfig from "../../hooks/useConfig";
import useAsync from "../../hooks/useAsync";
import { SingleAccountPageResponse } from "../../interfaces/responses/explorerApiResponses";
import { getPaginatedAccountTransactions, getSingleAccountPage } from "../../api/pagesApi";
import ContentLoading from "../../components/ContentLoading";
import Card from "../../components/Card";
import TitleAndSearch from "../../components/TitleAndSearch";
import { weiFormatNice } from "../../utils/coin";
import TransactionRow, { TransactionLabels } from "../../components/TransactionRow/TransactionRow";
import AssetRow from "../../components/AssetRow/AssetRow";
import ContractRow from "../../components/ContractRow/ContractRow";
import { Transaction } from "../../interfaces/models/transactions.interface";
import ReactPaginate from "react-paginate";
import Spinner from "../../components/Spinner";
import styles from './SingleAccountPage.module.scss';
import sleep from "../../utils/sleep";

const SingleAccountPage: FC = () => {
    const { chain: chainLookupId, accountAddress } = useParams();
    const { getChain } = useConfig();
    const chain = getChain(chainLookupId);
    const { data, error } = useAsync<SingleAccountPageResponse>(getSingleAccountPage(chain.chainId, accountAddress), { updateOn: [chain.chainId, accountAddress] });
    const title = `Account`;

    const [transactions, setTransactions] = useState<Transaction[] | undefined>(data?.recentTransactions);
    const [loadingTransactions, setLoadingTransactions] = useState(true);
    const [page, setPage] = useState(1);

    useEffect(()=>{
        if (data && !transactions?.length) {
            setTransactions(data.recentTransactions);   
            setLoadingTransactions(false)
        }
    }, [data])

    const changePage = async (oldPage: number, newPage: number) => {
        try {
            setPage(newPage);
            setLoadingTransactions(true);
            await sleep(2000)
            const txs = await getPaginatedAccountTransactions(chain.chainId, accountAddress, page);
            setTransactions(txs.transactions);
        } catch (err: any) {
            console.error(`Error Loading Transactions page ${page}:`, err);
            setPage(oldPage)
        } finally {
            setLoadingTransactions(false);
        }
    }

    if (!chain) {
        return (
            <div>
                <h1>Chain Not Found</h1>
            </div>
        )
    }

    if (!data || !transactions) {
        return <ContentLoading chain={chain} title={title} error={error} />
    }

    const totalPages = Math.ceil(data.totalTransactions / 10);

    return (
        <div className='d-flex flex-column'>
            <TitleAndSearch chain={chain} title={title} />
            <div className='d-flex flex-wrap'>
                <Card className="col" conentClassName="justify-content-start">
                    <h3>Overview</h3>
                    <div style={{borderBottom: '1px solid var(--light-gray)', paddingTop: '8px'}} />
                    <div className='d-flex flex-column gap-3 mt-3'>
                        <div className='d-flex'>
                            <div className='col-3 font-weight-bold'>Account Address</div>
                            <div className='col'>{data.account.address}</div>
                        </div>
                        <div className='d-flex'>
                            <div className='col-3 font-weight-bold'>Account Type</div>
                            <div className='col'>{data.account.accountType}</div>
                        </div>
                        <div className='d-flex'>
                            <div className='col-3 font-weight-bold'>Held Balance</div>
                            <div className='col'>{weiFormatNice(data.account.heldBalanceInBondingDenom, chain.bondingDecimals)} {chain.bondingDisplayDenom}</div>
                        </div>
                        <div className='d-flex'>
                            <div className='col-3 font-weight-bold'>Delegated Balance</div>
                            <div className='col'>{weiFormatNice(data.account.totalDelegatedBalance, chain.bondingDecimals)} {chain.bondingDisplayDenom}</div>
                        </div>
                        <div className='d-flex'>
                            <div className='col-3 font-weight-bold'>Unbonding Balance</div>
                            <div className='col'>{weiFormatNice(data.account.totalUnbondingBalance, chain.bondingDecimals)} {chain.bondingDisplayDenom}</div>
                        </div>
                        <div className='d-flex'>
                            <div className='col-3 font-weight-bold'>Total Balance</div>
                            <div className='col'>{weiFormatNice(data.account.totalBalanceInBondingDenom, chain.bondingDecimals)} {chain.bondingDisplayDenom}</div>
                        </div>
                    </div>
                </Card>
                <Card className='col d-flex flex-column' style={{justifyContent: 'flex-start'}}>
                    <h3>Assets</h3>
                    <div style={{borderBottom: '1px solid var(--light-gray)', paddingTop: '8px'}} />
                    {/* TODO fix shitty scrolling. maybe use pages instead */}

                    {data.account.nativeAssets.length ?
                        <div style={{overflowY: 'scroll', height: 'calc(100% - 24px)', maxHeight: '320px', paddingRight: '8px'}}>
                            {data.account.nativeAssets.map((coin, i) =><Fragment key={i}>
                                <AssetRow coin={coin} chain={chain} />
                                { i < data.account.nativeAssets.length - 1 && <div style={{borderBottom: '1px solid var(--light-gray)'}} />}
                            </Fragment>)}
                        </div>
                    :
                        <div className='py-4 w-full text-center'>
                            No assets found.
                        </div>
                    }
                </Card>
            </div>
            <Card conentClassName='position-relative'>
                <h3>Transactions</h3>
                {!!data.recentTransactions.length &&
                    <TransactionLabels />
                }
                { transactions.map((tx) =><Fragment key={tx.hash}>
                    <div style={{borderBottom: '1px solid var(--light-gray)'}} />
                    <TransactionRow transaction={tx} chain={chain} />
                </Fragment>)}
                {(!transactions.length) && <div className='py-4 w-full text-center'>
                    No transactions found.
                </div>}
                { !!data.totalTransactions &&
                    <ReactPaginate
                        breakLabel="..."
                        nextLabel=">"
                        onPageChange={e => changePage(page, e.selected + 1)}
                        pageRangeDisplayed={2}
                        pageCount={totalPages}
                        previousLabel="<"
                        renderOnZeroPageCount={null}
                        className="react-paginate"
                    />
                }
                { loadingTransactions &&
                    <div className={styles.loadingOverlay}>
                        <Spinner />
                    </div>
                }
            </Card>
            <Card>
                <h3>Created Contracts</h3>
                {!!data.instantiatedContracts.length && <>
                    <div className='d-flex mt-4 mb-1'>
                        <div className='col col-5 col-md-4'>
                            Label
                        </div>
                        <div className='col col-5 col-md-3'>
                            Address
                        </div>
                        <div className='col col-2 col-md-1 text-end text-md-start'>
                            Code ID
                        </div>
                        <div className='col col-2 d-none d-md-block'>
                            Created
                        </div>
                        <div className='col col-2 d-none d-md-block'>
                            Executions
                        </div>
                    </div>
                    <div style={{borderBottom: '1px solid var(--light-gray)'}} />
                </>}
                {data.instantiatedContracts.map((contract, i) =><Fragment key={i}>
                    <ContractRow contract={contract} chain={chain} />
                    { i < data.instantiatedContracts.length - 1 && <div style={{borderBottom: '1px solid var(--light-gray)'}} />}
                </Fragment>)}
                {!data.instantiatedContracts.length && <div className='py-4 w-full text-center'>
                    No created contracts.
                </div>}
            </Card>
            <Card>
                <h3>Administered Contracts</h3>
                {!!data.administratedContracts.length && <>
                    <div className='d-flex mt-4 mb-1'>
                        <div className='col col-5 col-md-4'>
                            Label
                        </div>
                        <div className='col col-5 col-md-3'>
                            Address
                        </div>
                        <div className='col col-2 col-md-1 text-end text-md-start'>
                            Code ID
                        </div>
                        <div className='col col-2 d-none d-md-block'>
                            Created
                        </div>
                        <div className='col col-2 d-none d-md-block'>
                            Executions
                        </div>
                    </div>
                    <div style={{borderBottom: '1px solid var(--light-gray)'}} />
                </>}
                {data.administratedContracts.map((contract, i) =><Fragment key={i}>
                    <ContractRow contract={contract} chain={chain} />
                    { i < data.administratedContracts.length - 1 && <div style={{borderBottom: '1px solid var(--light-gray)'}} />}
                </Fragment>)}
                {!data.administratedContracts.length && <div className='py-4 w-full text-center'>
                    No administered contracts.
                </div>}
            </Card>
        </div>
    )
}

export default SingleAccountPage;