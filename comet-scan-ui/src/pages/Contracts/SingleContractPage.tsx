import { FC } from "react";
import { Link, useParams } from "react-router-dom";
import useConfig from "../../hooks/useConfig";
import useAsync from "../../hooks/useAsync";
import { SingleContractPageResponse } from "../../interfaces/responses/explorerApiResponses";
import { getSingleContractPage } from "../../api/pagesApi";
import ContentLoading from "../../components/ContentLoading";
import Card from "../../components/Card";
import TitleAndSearch from "../../components/TitleAndSearch";
import TransactionRow, { TransactionLabels } from "../../components/TransactionRow/TransactionRow";
import { toast } from "react-fox-toast";

const SingleContractPage: FC = () => {
    const { chain: chainLookupId, contractAddress } = useParams();
    const { getChain } = useConfig();
    const chain = getChain(chainLookupId);
    const { data, error } = useAsync<SingleContractPageResponse>(getSingleContractPage(chain.chainId, contractAddress));
    const title = `Contract`;

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
 
    return (
        <div className='d-flex flex-column'>
            <TitleAndSearch chain={chain} title={title} />
            <Card>
                <h3>Overview</h3>
                <div style={{borderBottom: '1px solid var(--light-gray)', paddingTop: '8px'}} />
                <div className='d-flex flex-column gap-3 mt-3'>
                    <div className='d-flex'>
                        <div className='col-3 font-weight-bold'>Address</div>
                        <div className='col'>
                            <Link to={`/${chainLookupId}/accounts/${data.contract.contractAddress}`}>{data.contract.contractAddress}</Link>
                        </div>
                    </div>
                    <div className='d-flex'>
                        <div className='col-3 font-weight-bold'>Label</div>
                        <div className='col'>{data.contract.label}</div>
                    </div>
                    <div className='d-flex'>
                        <div className='col-3 font-weight-bold'>Code ID</div>
                        <div className='col'>
                            <Link to={`/${chainLookupId}/codes/${data.contract.codeId}`}>{data.contract.codeId}</Link>
                        </div>
                    </div>
                    <div className='d-flex'>
                        <div className='col-3 font-weight-bold'>Verified</div>
                        <div className='col d-flex gap-4'>
                            {data.verification ? 'Yes' : 'No'}
                            { !data.verification &&
                                <Link to={`/${chainLookupId}/codes/${data.code.codeId}/verify`}>Verify this Code</Link>
                            }
                        </div>
       
                    </div>
                    { !!data.verification?.code_zip &&
                        <div className='d-flex'>
                            <div className='col-3 font-weight-bold'>Source Code</div>
                            <div className='col'>
                                <button type='button' className='buttonLink' onClick={handleDownloadCode}>Download</button>
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
                    { (!!data.contract.tokenInfo || !!data.contract.nftInfo) &&
                        <div className='d-flex'>
                            <div className='col-3 font-weight-bold'>Contract Type</div>
                            <div className='col'>{data.contract.tokenInfo ? 'Token' : 'NFT'}</div>
                        </div>
                    }
                    { !!data.contract.tokenInfo && <>
                        <div className='d-flex'>
                            <div className='col-3 font-weight-bold'>Token Name</div>
                            <div className='col'>{data.contract.tokenInfo.name}</div>
                        </div>
                        <div className='d-flex'>
                            <div className='col-3 font-weight-bold'>Token Symbol</div>
                            <div className='col'>{data.contract.tokenInfo.symbol}</div>
                        </div>
                    </>}
                    { !!data.contract.nftInfo && <>
                        <div className='d-flex'>
                            <div className='col-3 font-weight-bold'>NFT Collection Name</div>
                            <div className='col'>{data.contract.nftInfo.name}</div>
                        </div>
                        <div className='d-flex'>
                            <div className='col-3 font-weight-bold'>NFT Collection Symbol</div>
                            <div className='col'>{data.contract.nftInfo.symbol}</div>
                        </div>
                    </>}
                </div>
            </Card>
            <Card>
                <h3>Recent Transactions</h3>
                {!!data.recentTransactions.length &&
                    <TransactionLabels />
                }
                {data.recentTransactions.map((tx) =><>
                    <div style={{borderBottom: '1px solid var(--light-gray)'}} />
                    <TransactionRow transaction={tx} chain={chain} />
                </>)}
                {!data.recentTransactions.length && <div className='py-4 w-full text-center'>
                    No transactions found.
                </div>}
            </Card>
        </div>
    )
}

export default SingleContractPage;