import { FC } from "react";
import { FrontendChainConfig } from "../interfaces/config.interface";
import TitleAndSearch from "./TitleAndSearch";
import Spinner from "./Spinner";

const ContentLoading: FC<{chain: FrontendChainConfig, title: string}> = ({chain, title}) => {
    return (
        <div className='d-flex flex-column gap-2 px-4' style={{ height: '80vh'}}>
            <TitleAndSearch chain={chain} title={title} />
            <div className='d-flex w-100 h-100 align-items-center justify-content-center'>
                <Spinner />
            </div>
        </div>
    )
}

export default ContentLoading;