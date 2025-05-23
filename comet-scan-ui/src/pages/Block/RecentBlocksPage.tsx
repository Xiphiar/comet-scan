import { FC, Fragment } from "react";
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
        <div className='d-flex flex-column'>
            <TitleAndSearch chain={chain} title={title} />
            <Card className='col'>
                <h3>Recent Blocks</h3>
                {!!data.blocks.length &&
                    <div className='d-flex mt-4 mb-1'>
                        <div className='col col-2 col-lg-2'>
                            Height
                        </div>
                        <div className='col col-2 d-none d-lg-block'>
                            Hash
                        </div>
                        <div className='col col-2 col-lg-2'>
                            Transactions
                        </div>
                        <div className='col col-6 col-lg-2'>
                            Proposer
                        </div>
                        <div className='col col-2 col-lg-2'>
                            Time
                        </div>
                    </div>
                }
                {data.blocks.map((block) =><Fragment key={block.hash}>
                    <div style={{borderBottom: '1px solid var(--light-gray)'}} />
                    <BlockRow block={block} chain={chain} />
                </Fragment>)}
                {!data.blocks.length && <div className='py-4 w-full text-center'>
                    No blocks found.
                </div>}
            </Card>
        </div>
    )
}

export default RecentBlocksPage;