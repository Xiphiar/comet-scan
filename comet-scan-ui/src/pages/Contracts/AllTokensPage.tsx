import { FC, Fragment, useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import useConfig from "../../hooks/useConfig";
import { useAsyncV2 } from "../../hooks/useAsync";
import ContentLoading from "../../components/ContentLoading";
import Card from "../../components/Card";
import TitleAndSearch from "../../components/TitleAndSearch";
import { getAllTokensPage } from "../../api/pagesApi";
import { AllTokensPageResponse } from "../../interfaces/responses/explorerApiResponses";
import TokenRow from "../../components/TokenRow/TokenRow";
import ReactPaginate from "react-paginate";
import Selector from "../../components/Selector/Selector";


const AllTokensPage: FC = () => {
    const { chain: chainLookupId } = useParams();
    const { getChain } = useConfig();
    const chain = getChain(chainLookupId);
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [currentPage, setCurrentPage] = useState<number>(parseInt(searchParams.get('page') || '1'));
    
    const { data, error } = useAsyncV2<AllTokensPageResponse>(
        () => getAllTokensPage(chain.chainId, currentPage),
        [chain.chainId, currentPage]
    );

    const handlePageChange = (selectedItem: { selected: number }) => {
        const newPage = selectedItem.selected + 1;
        setCurrentPage(newPage);
        setSearchParams({ page: newPage.toString() });
    };

    if (!chain) {
        return (
            <div>
                <h1>Chain Not Found</h1>
            </div>
        )
    }
    const title = `Tokens`

    if (!data) {
        return <ContentLoading chain={chain} title={title} error={error} />
    }

    // Calculate total pages based on totalTokens and items per page
    const itemsPerPage = 30;
    const totalPages = Math.ceil(data.totalTokens / itemsPerPage);

    return (
        <div className='d-flex flex-column'>
            <TitleAndSearch chain={chain} title={title} />
            <Card className='col'>
                <div className='d-flex justify-content-between align-items-center'>
                    <h3>All Tokens</h3>
                    { chain.features.includes('featured_tokens') &&
                        <Selector
                            options={['Featured', 'All']}
                            selected={'All'}
                            onSelect={() => navigate(`/${chain.id}/tokens/featured`)}
                            style={{fontWeight: 500}}
                            height={32}
                            borderThickness={1}
                        />
                    }
                </div>
                {!!data.tokenContracts.length &&
                    <div className='d-flex mt-4 mb-1'>
                        <div className='col col-4'>
                            Token
                        </div>
                        <div className='col col-4'>
                            Address
                        </div>
                        <div className='col col-2'>
                            Supply
                        </div>
                        <div className='col col-2 text-end'>
                            Executions
                        </div>
                    </div>
                }
                {data.tokenContracts.map((contract) =><Fragment key={contract.contract.contractAddress}>
                    <div style={{borderBottom: '1px solid var(--light-gray)'}} />
                    <TokenRow contract={contract} chain={chain} />
                </Fragment>)}
                {!data.tokenContracts.length && <div className='py-4 w-full text-center'>
                    No tokens found.
                </div>}
                
                {totalPages > 1 && (
                    <div className="mt-4 d-flex justify-content-center">
                        <ReactPaginate
                            breakLabel="..."
                            nextLabel=">"
                            onPageChange={handlePageChange}
                            pageRangeDisplayed={2}
                            pageCount={totalPages}
                            previousLabel="<"
                            renderOnZeroPageCount={null}
                            className="react-paginate"
                            forcePage={currentPage - 1}
                        />
                    </div>
                )}
            </Card>
        </div>
    )
}

export default AllTokensPage;