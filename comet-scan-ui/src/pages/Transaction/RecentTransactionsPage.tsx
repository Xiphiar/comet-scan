import { FC, Fragment } from "react";
import { useParams } from "react-router-dom";
import useConfig from "../../hooks/useConfig";
import useAsync from "../../hooks/useAsync";
import ContentLoading from "../../components/ContentLoading";
import Card from "../../components/Card";
import TitleAndSearch from "../../components/TitleAndSearch";
import { TransactionsPageResponse } from "../../interfaces/responses/explorerApiResponses";
import { getRecentTransactionsPage } from "../../api/pagesApi";
import TransactionRow, { TransactionLabels } from "../../components/TransactionRow/TransactionRow";


const RecentTransactionsPage: FC = () => {
    const { chain: chainLookupId } = useParams();
    const { getChain } = useConfig();
    const chain = getChain(chainLookupId);
    const { data, error } = useAsync<TransactionsPageResponse>(getRecentTransactionsPage(chain.chainId));

    if (!chain) {
        return (
            <div>
                <h1>Chain Not Found</h1>
            </div>
        )
    }
    const title = `Transactions`

    if (!data) {
        return <ContentLoading chain={chain} title={title} error={error} />
    }

    return (
        <div className='d-flex flex-column'>
            <TitleAndSearch chain={chain} title={title} />
            <Card className='col'>
                <h3>Recent Transactions</h3>
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

export default RecentTransactionsPage;