import { FC, ReactElement, useRef, useState } from "react";
import styles from './TitleAndSearch.module.scss'
import { ChainConfig, FrontendChainConfig } from "../interfaces/config.interface";
import { fromBech32, normalizeBech32 } from "@cosmjs/encoding";
import useConfig from "../hooks/useConfig";
import { Link, useParams } from "react-router-dom";
import Card from "./Card";
import sleep from "../utils/sleep";

const txHashRegex = /[0-9A-Fa-f]/g;


type ParsedBech32 = {
    type: 'ADDRESS' | 'VALIDATOR',
    prefix: string;
    chain: FrontendChainConfig;
}
const parseBech32 = (addr: string, chains: FrontendChainConfig[], currentChain: FrontendChainConfig): ParsedBech32 | undefined => {
    try {
        const {prefix} = fromBech32(addr);
        if (prefix.includes('pub')) return undefined;
        if (prefix.includes('valcons')) return undefined;

        const cleanPrefix = prefix.replace('valoper', '');

        // This is fucky, TODO something more reliable
        const matchedChains = chains.filter(c => c.prefix === cleanPrefix);
        console.log(matchedChains)
        if (!matchedChains.length) return undefined;
        let chain = matchedChains[0];
        if (matchedChains.length > 1) {
            chain = currentChain;
        }

        if (prefix.includes('valoper')) return {
            type: 'VALIDATOR',
            prefix: cleanPrefix,
            chain,
        }
        return {
            type: 'ADDRESS',
            prefix,
            chain,
        }
    } catch {
        return undefined;
    }
}

interface SearchResult {
    title: string | ReactElement;
    link: string;
}

const TitleAndSearch: FC<{chain: FrontendChainConfig, title: string}> = ({chain, title}) => {
    const {chains} = useConfig();
    const searchInputElement = useRef(null)
    const [searchInput, setSearchInput] = useState('');
    const [focused, setFocused] = useState(false);

    const onBlur = async () => {
        // Sleep for a small amount of time before hiding the results, otherwise result links can't be clicked
        await sleep(150);
        setFocused(false);
    }

    const handleSearch = async (e?: any) => {
        e?.preventDefault?.();
        // alert('todo')
    }

    let searchResults: SearchResult[] = [];
    if (searchInput.length) {
        // Check if block
        if (!isNaN(searchInput as any)) {
            searchResults.push({
                title: `${chain.name} Block ${parseInt(searchInput).toLocaleString()}`,
                link: `/${chain.id}/blocks/${parseInt(searchInput)}`
            })
        }

        // Check if TX hash
        if (txHashRegex.test(searchInput) && searchInput.length === 64) {
            searchResults.push({
                title: `${chain.name} Transaction ${searchInput.toUpperCase()}`,
                link: `/${chain.id}/transactions/${searchInput.toUpperCase()}`
            })
        }

        // Check if Bech32 Address
        const data = parseBech32(searchInput, chains, chain);
        if (data && data.type === 'VALIDATOR') {
            searchResults.push({
                title: `${data.chain.name} Validator ${searchInput}`,
                link: `/${data.chain.id}/validators/${searchInput}`
            })
        }

        if (data && data.type === 'ADDRESS') {
            searchResults.push({
                title: `${data.chain.name} Account ${searchInput}`,
                link: `/${data.chain.id}/accounts/${searchInput}`
            })
            if (data.chain.features.includes('cosmwasm') || data.chain.features.includes('secretwasm')) {
                searchResults.push({
                    title: `${data.chain.name} Contract ${searchInput}`,
                    link: `/${data.chain.id}/contracts/${searchInput}`
                })
            }
        }
    } else searchResults = []

    return (
        <div className={styles.titleAndSearchWrapper}>
            <div className='d-flex gap-4 align-items-center'>
                {!!chain.logoFile && <img src={`/logos/${chain.logoFile}`} style={{height: '50px'}} />}
                <h1 style={{display: 'block', fontFamily: 'Bunken Tech'}}>{chain.name} {title}</h1>
            </div>
            <form onSubmit={handleSearch}>
                <input
                    type='text'
                    ref={searchInputElement}
                    tabIndex={1}
                    placeholder='Search for an address, transaction, or block'
                    value={searchInput}
                    onChange={e => setSearchInput(e.target.value.trim())}
                    onFocus={() => setFocused(true)}
                    onBlur={onBlur}
                />
            </form>
            { (!!searchInput.length && focused) &&
                <Card className={styles.searchResults} conentClassName={styles.searchResultsContent}>
                    { searchResults.map(sr =>
                        <Link
                            to={sr.link}
                            key={sr.link}
                            className={styles.searchLink}
                            onClick={() => setSearchInput('')}
                        >{sr.title}</Link>
                    )}
                    { !searchResults.length &&
                        <div style={{padding: '12px'}}>Unknown Search Input</div>
                    }
                </Card>
            }
        </div>
    )
}

export default TitleAndSearch;