import { FC } from "react";
import { Chain } from "../config/chains";
import TitleAndSearch from "./TitleAndSearch";
import Spinner from "./Spinner";

const ContentLoading: FC<{chain: Chain, title: string}> = ({chain, title}) => {
    return (
        <div className='d-flex flex-column gap-2 px-4'>
            <TitleAndSearch chain={chain} title={title} />
            <Spinner />
        </div>
    )
}

export default ContentLoading;