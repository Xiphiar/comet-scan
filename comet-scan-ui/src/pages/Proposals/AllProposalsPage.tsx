import { FC } from "react";
import { useParams } from "react-router-dom";
import useConfig from "../../hooks/useConfig";
import useAsync from "../../hooks/useAsync";
import ContentLoading from "../../components/ContentLoading";
import Card from "../../components/Card";
import TitleAndSearch from "../../components/TitleAndSearch";
import { AllProposalsPageResponse } from "../../interfaces/responses/explorerApiResponses";
import { getAllProposalsPage } from "../../api/pagesApi";
import { ProposalRow } from "../Overview/ProposalsCard";

const AllProposalsPage: FC = () => {
    const { chain: chainLookupId } = useParams();
    const { getChain } = useConfig();
    const chain = getChain(chainLookupId);
    const { data, error } = useAsync<AllProposalsPageResponse>(getAllProposalsPage(chain.chainId));

    if (!chain) {
        return (
            <div>
                <h1>Chain Not Found</h1>
            </div>
        )
    }
    const title = `Proposals`

    if (!data) {
        return <ContentLoading chain={chain} title={title} error={error} />
    }

    return (
        <div className='d-flex flex-column mx-4'>
            <TitleAndSearch chain={chain} title={title} />
            <Card className='col'>
                <h3>All Proposals</h3>
                {!!data.proposals.length &&
                    <div className='d-flex mt-4 mb-1'>
                        <div className='col col-1'>
                            ID
                        </div>
                        <div className='col-5 col-md-7 flex-grow-1'>
                            Title
                        </div>
                        <div className='col col-2'>
                            Type
                        </div>
                        <div className='col col-2'>
                            Status
                        </div>
                        <div className='col col-2 d-none d-sm-block text-end'>
                            Ends
                        </div>
                    </div>
                }
                {data.proposals.map((tx) =><>
                    <div style={{borderBottom: '1px solid var(--light-gray)'}} />
                    <ProposalRow proposal={tx} chain={chain} />
                </>)}
                {!data.proposals.length && <div className='py-4 w-full text-center'>
                    No proposals found.
                </div>}
            </Card>
        </div>
    )
}

export default AllProposalsPage;