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
            {/* <div className='d-flex w-full'>
                <Card className='col'>
                    <h5>Time</h5>
                    {new Date(data.proposal.timestamp).toLocaleString()}
                </Card>
                <Card className='col'>
                    <h5>Proposals</h5>
                    {data.proposals.length}
                </Card>
                <Card className='col'>
                    <h5>Gas Used</h5>
                    {data.proposal.totalGasUsed.toLocaleString()}
                </Card>
                <Card className='col'>
                    <h5>Total Fee</h5>
                    {weiFormatNice(data.proposal.totalFees.find(f => f.denom === chain.bondingDenom)?.amount || '0', chain.bondingDecimals)} {chain.bondingDisplayDenom}
                </Card>
            </div> */}
            <Card className='col'>
                <h3>All Proposals</h3>
                {!!data.proposals.length &&
                    <div className='d-flex mt-4 mb-1'>
                        <div className='col col-1'>
                            ID
                        </div>
                        <div className='col flex-grow-1'>
                            Title
                        </div>
                        <div className='col col-2'>
                            Type
                        </div>
                        <div className='col col-1'>
                            Status
                        </div>
                        <div className='col col-2 text-end'>
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