import { FC, useState } from "react";
import useConfig from "../../hooks/useConfig";
import Card from "../../components/Card";
import { Link } from "react-router-dom";
import Spinner from "../../components/Spinner";
import styles from './MainPage.module.scss';
import Toggle from "../../components/Toggle/Toggle";
import Selector from "../../components/Selector/Selector";

type Props = {
    isLoading?: boolean;
    loadingError?: string;
}

type Option = 'Mainnet' | 'Testnet';
const options: Option[] = ['Mainnet', 'Testnet'];

const MainPage: FC<Props> = ({isLoading, loadingError}) => {
    const { chains } = useConfig();

    const [selected, setSelected] = useState<Option>('Mainnet');
    const filteredChains = chains.filter(chain => {
        if (selected === 'Mainnet') return !chain.isTestnet;
        if (selected === 'Testnet') return chain.isTestnet;
        return false;
    });

    return (<>
    
        <div style={{position: 'absolute', top: '16px', right: '16px'}}>
            <Toggle />
        </div>
                    
        <div className='d-flex flex-column align-items-center' style={{paddingTop: '15vh'}}>
            <div className='d-flex align-items-center gap-4' style={{color: 'var(--main)'}}>
                <img src='/logo.svg' style={{height: '120px', fill: 'red'}} />
                <h1 style={{marginTop: '32px', fontFamily: 'Bunken Tech'}}>Comet Scan</h1>
            </div>
            { isLoading ?
                <div className='d-flex justify-content-center align-items-center pt-4 mt-4'>
                    <Spinner />
                </div>
            : loadingError ?
                <div className='text-center pt-4 mt-4'>
                    Failed to load application:
                    <pre style={{margin: '0px 0px 12px 0px'}}>{loadingError}</pre>
                    Try again later.
                </div>
            : 
                <>
                    <Selector options={options} selected={selected} onSelect={s => setSelected(s as Option)} className='mt-4' />
                    <div className='d-flex flex-wrap mt-4 justify-content-center w-100 px-4'>
                        { filteredChains.map(chain =>
                            <Link to={`/${chain.id}`} className='d-flex col col-6 col-md-3 col-lg-2 text-black' key={chain.chainId}>
                                <Card className='flex-grow-1' conentClassName={`${styles.chainCard}`} >
                                    <img src={`/logos/${chain.logoFile}`} style={{height: '64px'}} />
                                    <h3>{chain.name}</h3>
                                </Card>
                            </Link>
                        )}
                    </div>
                </>
            }
        </div>
    </>)
}

export default MainPage