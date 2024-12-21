import { FC } from "react";
import { useParams } from "react-router-dom";
import useConfig from "../../hooks/useConfig";
import useAsync from "../../hooks/useAsync";
import ContentLoading from "../../components/ContentLoading";
import Card from "../../components/Card";
import TitleAndSearch from "../../components/TitleAndSearch";
import { TransactionsPageResponse } from "../../interfaces/responses/explorerApiResponses";
import { getRecentTransactionsPage } from "../../api/pagesApi";
import TransactionRow from "../../components/TransactionRow/TransactionRow";


const RecentTransactionsPage: FC = () => {
    const { chain: chainLookupId } = useParams();
    const { getChain } = useConfig();
    const chain = getChain(chainLookupId);
    const { data } = useAsync<TransactionsPageResponse>(getRecentTransactionsPage(chain.chainId));

    if (!chain) {
        return (
            <div>
                <h1>Chain Not Found</h1>
            </div>
        )
    }
    const title = `Transactions`

    if (!data) {
        return <ContentLoading chain={chain} title={title} />
    }

    return (
        <div className='d-flex flex-column gap-2 mx-4'>
            <TitleAndSearch chain={chain} title={title} />
            {/* <div className='d-flex gap-2 w-full'>
                <Card className='col'>
                    <h5>Time</h5>
                    {new Date(data.block.timestamp).toLocaleString()}
                </Card>
                <Card className='col'>
                    <h5>Transactions</h5>
                    {data.transactions.length}
                </Card>
                <Card className='col'>
                    <h5>Gas Used</h5>
                    {data.block.totalGasUsed.toLocaleString()}
                </Card>
                <Card className='col'>
                    <h5>Total Fee</h5>
                    {weiFormatNice(data.block.totalFees.find(f => f.denom === chain.bondingDenom)?.amount || '0', chain.bondingDecimals)} {chain.bondingDisplayDenom}
                </Card>
            </div> */}
            <div className='d-flex flex-wrap gap-2'>
                <div className='col'>
                    <Card>
                        <h3>Recent Transactions</h3>
                        {!!data.transactions.length &&
                            <div className='d-flex mt-4 mb-1'>
                                <div className='col col-2'>
                                    Hash
                                </div>
                                <div className='col col-6'>
                                    Type
                                </div>
                                <div className='col col-2'>
                                    Amount
                                </div>
                                <div className='col col-2'>
                                    Fee
                                </div>
                            </div>
                        }
                        {data.transactions.map((tx) =><>
                            <div style={{borderBottom: '1px solid var(--light-gray)'}} />
                            <TransactionRow transaction={tx} chain={chain} />
                        </>)}
                        {!data.transactions.length && <div className='py-4 w-full text-center'>
                            No transactions found.
                        </div>}
                    </Card>
                </div>
            </div>
        </div>
    )
}

export default RecentTransactionsPage;