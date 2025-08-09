import { FC, Fragment, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import useConfig from "../../hooks/useConfig";
import { useAsyncV2 } from "../../hooks/useAsync";
import ContentLoading from "../../components/ContentLoading";
import Card from "../../components/Card";
import TitleAndSearch from "../../components/TitleAndSearch";
import ContractRow from "../../components/ContractRow/ContractRow";
import { getAllContractsPage } from "../../api/pagesApi";
import { AllContractsPageResponse } from "@comet-scan/types";
import { IoDocuments } from "react-icons/io5";
import { FaFileSignature } from "react-icons/fa6";
import { Ri24HoursFill } from "react-icons/ri";
import ReactPaginate from "react-paginate";


const AllContractsPage: FC = () => {
    const { chain: chainLookupId } = useParams();
    const { getChain } = useConfig();
    const chain = getChain(chainLookupId);
    const [searchParams, setSearchParams] = useSearchParams();
    const [currentPage, setCurrentPage] = useState<number>(parseInt(searchParams.get('page') || '1'));

    const { data, error } = useAsyncV2<AllContractsPageResponse>(
        () => getAllContractsPage(chain.chainId, currentPage),
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
    const title = `Contracts`

    if (!data) {
        return <ContentLoading chain={chain} title={title} error={error} />
    }

    // Calculate total pages based on totalContracts and items per page
    const itemsPerPage = 30;
    const totalPages = Math.ceil(data.totalContracts / itemsPerPage);

    return (
        <div className='d-flex flex-column'>
            <TitleAndSearch chain={chain} title={title} />
            <div className='d-flex w-full flex-wrap'>
                <Card className='col col-12 col-sm-4'>
                    <div className='statTitle'><IoDocuments /><h5>Total Contracts</h5></div>
                    {data.totalContracts.toLocaleString()}
                </Card>
                <Card className='col col-12 col-sm-4'>
                    <div className='statTitle'><FaFileSignature /><h5>Total Executions</h5></div>
                    {data.totalExecutions.toLocaleString()}
                </Card>
                <Card className='col col-12 col-sm-4'>
                    <div className='statTitle'><Ri24HoursFill /><h5>Daily Executions</h5></div>
                    {data.dailyExecutions.toLocaleString()}
                </Card>
            </div>
            <Card className='col'>
                <h3>All Contracts</h3>
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
                {data.contracts.map((contract) =><Fragment key={contract.contract.contractAddress}>
                    <div style={{borderBottom: '1px solid var(--light-gray)'}} />
                    <ContractRow contract={contract} chain={chain} />
                </Fragment>)}
                {!data.contracts.length && <div className='py-4 w-full text-center'>
                    No contracts found.
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

export default AllContractsPage;