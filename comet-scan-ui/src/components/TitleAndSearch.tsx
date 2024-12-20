import { FC, useState } from "react";
import styles from './TitleAndSearch.module.scss'
import { Chain } from "../config/chains";

const TitleAndSearch: FC<{chain: Chain, title: string}> = ({chain, title}) => {
    const [searchInput, setSearchInput] = useState('');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleSearch = async (e?: any) => {
        e?.preventDefault?.();
        alert('todo')
    }

    return (
        <div className={styles.titleAndSearchWrapper}>
            <h1>{chain.name} {title}</h1>
            <form onSubmit={handleSearch}>
                <input type='text' placeholder='Search for an address, transaction, or block' value={searchInput} onChange={e => setSearchInput(e.target.value)} />
            </form>
        </div>
    )
}

export default TitleAndSearch;