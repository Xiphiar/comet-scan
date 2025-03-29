import { FC } from "react";
import { FrontendChainConfig } from "../interfaces/config.interface";
import TitleAndSearch from "./TitleAndSearch";
import Spinner from "./Spinner";
import parseError from "../utils/parseError";

const ContentLoading: FC<{chain: FrontendChainConfig, title: string, error: any | undefined}> = ({chain, title, error}) => {
    const parsedError = parseError(error);
    return (
        <div className='d-flex flex-column flex-grow-1 px-4'>
            <TitleAndSearch chain={chain} title={title} />
            <div className='d-flex flex-grow-1 w-100 h-100 align-items-center justify-content-center mt-2'>
                { error ?
                    <h2>{parsedError}</h2>
                :
                    <Spinner />
                }
            </div>
        </div>
    )
}

export default ContentLoading;