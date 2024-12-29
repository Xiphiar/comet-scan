import { FC } from "react";
import { useParams } from "react-router-dom";
import useAsync from "../../hooks/useAsync";
import ContentLoading from "../../components/ContentLoading";
import Card from "../../components/Card";
import TitleAndSearch from "../../components/TitleAndSearch";
import { BlocksPageResponse } from "../../interfaces/responses/explorerApiResponses";
import { getRecentBlocksPage } from "../../api/pagesApi";
import BlockRow from "../../components/BlockRow/BlockRow";
import useConfig from "../../hooks/useConfig";

const RecentBlocksPage: FC = () => {
    const { chain: chainLookupId } = useParams();
    const { getChain } = useConfig();
    const chain = getChain(chainLookupId);
    const { data, error } = useAsync<BlocksPageResponse>(getRecentBlocksPage(chain.chainId));

    if (!chain) {
        return (
            <div>
                <h1>Chain Not Found</h1>
            </div>
        )
    }
    const title = `Blocks`

    if (!data) {
        return <ContentLoading chain={chain} title={title} error={error} />
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
                    <h5>Blocks</h5>
                    {data.blocks.length}
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
                        <h3>Recent Blocks</h3>
                        {!!data.blocks.length &&
                            <div className='d-flex mt-4 mb-1'>
                                <div className='col col-2'>
                                    Height
                                </div>
                                <div className='col col-2'>
                                    Hash
                                </div>
                                <div className='col col-2'>
                                    Transactions
                                </div>
                                <div className='col col-4'>
                                    Proposer
                                </div>
                                <div className='col col-2'>
                                    Time
                                </div>
                            </div>
                        }
                        {data.blocks.map((tx) =><>
                            <div style={{borderBottom: '1px solid var(--light-gray)'}} />
                            <BlockRow block={tx} chain={chain} />
                        </>)}
                        {!data.blocks.length && <div className='py-4 w-full text-center'>
                            No blocks found.
                        </div>}
                    </Card>
                </div>
            </div>
        </div>
    )
}

export default RecentBlocksPage;