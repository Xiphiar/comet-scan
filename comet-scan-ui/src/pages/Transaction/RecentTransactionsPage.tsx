import { FC, Fragment, useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import useConfig from "../../hooks/useConfig";
import useAsync from "../../hooks/useAsync";
import ContentLoading from "../../components/ContentLoading";
import Card from "../../components/Card";
import TitleAndSearch from "../../components/TitleAndSearch";
import { TransactionsPageResponse, Transaction } from "@comet-scan/types";
import { getPaginatedTransactionsPage, getRecentTransactionsPage } from "../../api/pagesApi";
import TransactionRow, { TransactionLabels } from "../../components/TransactionRow/TransactionRow";
import ReactPaginate from "react-paginate";
import Spinner from "../../components/Spinner";
import styles from './RecentTransactionsPage.module.scss';


const RecentTransactionsPage: FC = () => {
    const { chain: chainLookupId } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const { getChain } = useConfig();
    const chain = getChain(chainLookupId);
    const initialPage = searchParams.get('page') ? parseInt(searchParams.get('page') as string) : 1;
    const { data: initialData, error } = useAsync<TransactionsPageResponse>(getRecentTransactionsPage(chain.chainId));

    const [transactions, setTransactions] = useState<Transaction[] | undefined>(undefined);
    const [totalTransactions, setTotalTransactions] = useState<number>(0);
    const [loadingTransactions, setLoadingTransactions] = useState(true);
    const [page, setPage] = useState(initialPage);

    useEffect(() => {
        const fetchPagedData = async () => {
            try {
                setLoadingTransactions(true);
                if (page === 1 && initialData) {
                    setTransactions(initialData.transactions);
                    setTotalTransactions(initialData.dailyTransactions * 3); // rough estimate for total based on daily count
                } else {
                    const pagedData = await getPaginatedTransactionsPage(chain.chainId, page);
                    setTransactions(pagedData.transactions);
                    setTotalTransactions(pagedData.total);
                }
            } catch (err) {
                console.error(`Error loading transactions page ${page}:`, err);
            } finally {
                setLoadingTransactions(false);
            }
        };

        if (chain) {
            fetchPagedData();
        }
    }, [chain, page, initialData]);

    const changePage = async (oldPage: number, newPage: number) => {
        try {
            setSearchParams({ page: newPage.toString() });
            setPage(newPage);
            setLoadingTransactions(true);
            const txs = await getPaginatedTransactionsPage(chain.chainId, newPage);
            setTransactions(txs.transactions);
            setTotalTransactions(txs.total);
        } catch (err: any) {
            console.error(`Error Loading Transactions page ${page}:`, err);
            setPage(oldPage);
            setSearchParams({ page: oldPage.toString() });
        } finally {
            setLoadingTransactions(false);
        }
    };

    if (!chain) {
        return (
            <div>
                <h1>Chain Not Found</h1>
            </div>
        )
    }
    const title = `Transactions`

    if (!transactions || loadingTransactions && !transactions.length) {
        return <ContentLoading chain={chain} title={title} error={error} />
    }

    const totalPages = Math.ceil(totalTransactions / 30);

    return (
        <div className='d-flex flex-column'>
            <TitleAndSearch chain={chain} title={title} />
            <Card className='col position-relative'>
                <h3>Recent Transactions</h3>
                {!!transactions.length &&
                    <TransactionLabels />
                }
                {transactions.map((tx) =><Fragment key={tx.hash}>
                    <div style={{borderBottom: '1px solid var(--light-gray)'}} />
                    <TransactionRow transaction={tx} chain={chain} />
                </Fragment>)}
                {!transactions.length && <div className='py-4 w-full text-center'>
                    No transactions found.
                </div>}
                {!!totalTransactions &&
                    <ReactPaginate
                        breakLabel="..."
                        nextLabel=">"
                        onPageChange={e => changePage(page, e.selected + 1)}
                        pageRangeDisplayed={2}
                        pageCount={totalPages}
                        previousLabel="<"
                        renderOnZeroPageCount={null}
                        className="react-paginate"
                        forcePage={page - 1}
                    />
                }
                {(loadingTransactions && transactions.length > 0) &&
                    <div className={styles.loadingOverlay}>
                        <Spinner />
                    </div>
                }
            </Card>
        </div>
    )
}

export default RecentTransactionsPage;