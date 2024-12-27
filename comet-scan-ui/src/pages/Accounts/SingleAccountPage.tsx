import { FC } from "react";
import { useParams } from "react-router-dom";
import useConfig from "../../hooks/useConfig";
import useAsync from "../../hooks/useAsync";
import { SingleAccountPageResponse } from "../../interfaces/responses/explorerApiResponses";
import { getSingleAccountPage } from "../../api/pagesApi";
import ContentLoading from "../../components/ContentLoading";
import Card from "../../components/Card";
import TitleAndSearch from "../../components/TitleAndSearch";
import { weiFormatNice } from "../../utils/coin";
import TransactionRow from "../../components/TransactionRow/TransactionRow";
import AssetRow from "../../components/AssetRow/AssetRow";
import ContractRow from "../../components/ContractRow/ContractRow";

const SingleAccountPage: FC = () => {
    const { chain: chainLookupId, accountAddress } = useParams();
    const { getChain } = useConfig();
    const chain = getChain(chainLookupId);
    const { data } = useAsync<SingleAccountPageResponse>(getSingleAccountPage(chain.chainId, accountAddress));
    const title = `Account`;

    if (!chain) {
        return (
            <div>
                <h1>Chain Not Found</h1>
            </div>
        )
    }

    if (!data) {
        return <ContentLoading chain={chain} title={title} />
    }
 
    return (
        <div className='d-flex flex-column gap-2 mx-4'>
            <TitleAndSearch chain={chain} title={title} />
            <div className='d-flex flex-wrap gap-2'>
                <Card className="col">
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
                <Card className='col'>
                    <h3>Assets</h3>
                    <div style={{borderBottom: '1px solid var(--light-gray)', paddingTop: '8px'}} />
                    {/* TODO fix shitty scrolling. maybe use pages instead */}
                    <div style={{overflowY: 'scroll', height: 'calc(100% - 24px)', paddingRight: '8px'}}>
                        {data.account.nativeAssets.map((coin, i) =><>
                            <AssetRow coin={coin} chain={chain} />
                            { i < data.account.nativeAssets.length - 1 && <div style={{borderBottom: '1px solid var(--light-gray)'}} />}
                        </>)}
                    </div>
                    {!data.account.nativeAssets.length && <div className='py-4 w-full text-center'>
                        No assets found.
                    </div>}
                </Card>
            </div>
            <Card>
                <h3>Recent Transactions</h3>
                {!!data.recentTransactions.length &&
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
                {data.recentTransactions.map((tx) =><>
                    <div style={{borderBottom: '1px solid var(--light-gray)'}} />
                    <TransactionRow transaction={tx} chain={chain} />
                </>)}
                {!data.recentTransactions.length && <div className='py-4 w-full text-center'>
                    No transactions found.
                </div>}
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
                        <div className='col col-2 col-md-1'>
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
                {data.instantiatedContracts.map((contract, i) =><>
                    <ContractRow contract={contract} chain={chain} />
                    { i < data.instantiatedContracts.length - 1 && <div style={{borderBottom: '1px solid var(--light-gray)'}} />}
                </>)}
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
                        <div className='col col-2 col-md-1'>
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
                {data.administratedContracts.map((contract, i) =><>
                    <ContractRow contract={contract} chain={chain} />
                    { i < data.administratedContracts.length - 1 && <div style={{borderBottom: '1px solid var(--light-gray)'}} />}
                </>)}
                {!data.administratedContracts.length && <div className='py-4 w-full text-center'>
                    No administered contracts.
                </div>}
            </Card>
        </div>
    )
}

export default SingleAccountPage;