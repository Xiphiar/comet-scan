import { FC, Fragment } from "react";
import { useParams } from "react-router-dom";
import useConfig from "../../hooks/useConfig";
import useAsync from "../../hooks/useAsync";
import ContentLoading from "../../components/ContentLoading";
import Card from "../../components/Card";
import TitleAndSearch from "../../components/TitleAndSearch";
import { getAllTokensPage } from "../../api/pagesApi";
import { AllTokensPageResponse } from "../../interfaces/responses/explorerApiResponses";
import TokenRow from "../../components/TokenRow/TokenRow";


const AllTokensPage: FC = () => {
    const { chain: chainLookupId } = useParams();
    const { getChain } = useConfig();
    const chain = getChain(chainLookupId);
    const { data, error } = useAsync<AllTokensPageResponse>(getAllTokensPage(chain.chainId));

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

    return (
        <div className='d-flex flex-column'>
            <TitleAndSearch chain={chain} title={title} />
            <Card className='col'>
                <h3>Top Tokens</h3>
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
            </Card>
        </div>
    )
}

export default AllTokensPage;