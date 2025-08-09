import { FC } from "react";
import { Link, useParams } from "react-router-dom";
import useConfig from "../../hooks/useConfig";
import useAsync from "../../hooks/useAsync";
import { SingleCodePageResponse } from "@comet-scan/types";
import { getSingleCodePage } from "../../api/pagesApi";
import ContentLoading from "../../components/ContentLoading";
import Card from "../../components/Card";
import TitleAndSearch from "../../components/TitleAndSearch";
import ContractRow from "../../components/ContractRow/ContractRow";
import { toast } from "react-fox-toast";
const SingleCodePage: FC = () => {
    const { chain: chainLookupId, codeId } = useParams();
    const { getChain } = useConfig();
    const chain = getChain(chainLookupId);
    const { data, error } = useAsync<SingleCodePageResponse>(getSingleCodePage(chain.chainId, codeId));
    const title = `Code`;

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
                        <div className='col-3 font-weight-bold'>Code ID</div>
                        <div className='col'>{data.code.codeId}</div>
                    </div>
                    <div className='d-flex'>
                        <div className='col-3 font-weight-bold'>Code Hash</div>
                        <div className='col'>{data.code.codeHash}</div>
                    </div>
                    <div className='d-flex'>
                        <div className='col-3 font-weight-bold'>Creator</div>
                        <div className='col'>
                            { data.code.creator ?
                                <Link to={`/${chainLookupId}/accounts/${data.code.creator}`}>{data.code.creator}</Link>
                            :
                                'Unknown'
                            }
                        </div>
                    </div>
                    <div className='d-flex'>
                        <div className='col-3 font-weight-bold'>Source</div>
                        <div className='col'>{data.code.source || 'Unknown'}</div>
                    </div>
                    <div className='d-flex'>
                        <div className='col-3 font-weight-bold'>Builder</div>
                        <div className='col'>{data.code.builder || 'Unknown'}</div>
                    </div>

                    <div className='d-flex'>
                        <div className='col-3 font-weight-bold'>Verified</div>
                        <div className='col d-flex gap-4'>
                            {data.verification ? 'Yes' : 'No'}
                            { !data.verification &&
                                <Link to={`/${chainLookupId}/codes/verify`}>Verify Code</Link>
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
                </div>
            </Card>
            <Card>
                <h3>Contracts</h3>
                {!!data.contracts.length &&
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
                }
                {data.contracts.map((contract) =><>
                    <div style={{borderBottom: '1px solid var(--light-gray)'}} />
                    <ContractRow contract={contract} chain={chain} />
                </>)}
                {!data.contracts.length && <div className='py-4 w-full text-center'>
                    No contracts found using this code.
                </div>}
            </Card>
        </div>
    )
}

export default SingleCodePage;