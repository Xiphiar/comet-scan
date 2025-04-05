import { FC, useState } from "react";
import useAsync from "../../hooks/useAsync";
import { getStatusPage } from "../../api/pagesApi";
import Card from "../../components/Card";
import Spinner from "../../components/Spinner";
import styles from './StatusPage.module.scss';
import Toggle from "../../components/Toggle/Toggle";
import Selector from "../../components/Selector/Selector";
import { formatTime } from "../../utils/format";
import { GrStatusGood, GrStatusWarning, GrStatusCritical } from "react-icons/gr";
import { BiBlock } from "react-icons/bi";
import { MdOutlineAccessTime } from "react-icons/md";
import { HiDatabase } from "react-icons/hi";

type Props = {
    isLoading?: boolean;
    loadingError?: string;
}

type Option = 'Mainnet' | 'Testnet';
const options: Option[] = ['Mainnet', 'Testnet'];

const StatusPage: FC<Props> = ({isLoading: propsIsLoading, loadingError: propsLoadingError}) => {
    const [selected, setSelected] = useState<Option>('Mainnet');
    
    const { data, error } = useAsync(getStatusPage());
    const isLoading = propsIsLoading || (!data && !error);
    const loadingError = propsLoadingError || error?.toString();

    const filteredChains = data?.chainStatuses.filter(chain => {
        if (selected === 'Mainnet') return !chain.chainConfig.isTestnet;
        if (selected === 'Testnet') return chain.chainConfig.isTestnet;
        return false;
    }) || [];

    const getStatusIcon = (latestBlockTime: string) => {
        const now = new Date();
        const blockTime = new Date(latestBlockTime);
        const diff = now.getTime() - blockTime.getTime();
        
        const hourMs = 60 * 60 * 1000;
        const dayMs = 24 * hourMs;
        
        if (diff > dayMs) {
            return <GrStatusCritical className={styles.statusIconCritical} />;
        } else if (diff > hourMs) {
            return <GrStatusWarning className={styles.statusIconWarning} />;
        } else {
            return <GrStatusGood className={styles.statusIconGood} />;
        }
    };

    return (<>
        <div style={{position: 'absolute', top: '16px', right: '16px'}}>
            <Toggle />
        </div>
                    
        <div className='d-flex flex-column align-items-center' style={{paddingTop: '15vh'}}>
            <div className='d-flex flex-wrap align-items-center justify-content-center gap-4' style={{color: 'var(--main)'}}>
                <svg height={'120px'} width={'142px'}>
                    <use xlinkHref="/logo.svg#cometscanLogo" height={'120px'} width={'142px'} />
                </svg>
                <h1 className={styles.title}>Chain Status</h1>
            </div>
            { isLoading ?
                <div className='d-flex justify-content-center align-items-center pt-4 mt-4'>
                    <Spinner />
                </div>
            : loadingError ?
                <div className='text-center pt-4 mt-4'>
                    Failed to load status information:
                    <pre style={{margin: '0px 0px 12px 0px'}}>{loadingError}</pre>
                    Try again later.
                </div>
            : 
                <>
                    <Selector options={options} selected={selected} onSelect={s => setSelected(s as Option)} className='mt-4' />
                    <div className='d-flex flex-wrap mt-4 justify-content-center w-100 px-4'>
                        { filteredChains.map(chainStatus => {
                            const chain = chainStatus.chainConfig;
                            const latestBlockTime = new Date(chainStatus.latestBlockTime);
                            const now = new Date();
                            const diff = now.getTime() - latestBlockTime.getTime();
                            
                            const hourMs = 60 * 60 * 1000;
                            const dayMs = 24 * hourMs;
                            
                            let statusClass = '';
                            if (diff > dayMs) {
                                statusClass = styles.statusCritical;
                            } else if (diff > hourMs) {
                                statusClass = styles.statusWarning;
                            }
                            
                            return (
                                <div className='d-flex col col-6 col-md-4 col-lg-3 text-black' key={chain.chainId}>
                                    <Card className={`flex-grow-1 ${statusClass}`} conentClassName={`${styles.statusCard}`}>
                                        <div className={styles.statusHeader}>
                                            <img src={chain.logoFile} style={{height: '48px'}} />
                                            <h3>{chain.name}</h3>
                                            <div className={styles.statusIndicator}>
                                                {getStatusIcon(chainStatus.latestBlockTime)}
                                            </div>
                                        </div>
                                        <div className={styles.statusInfo}>
                                            <div className={styles.statusItem}>
                                                <BiBlock /> <span className={styles.label}>Earliest Block:</span> {chainStatus.earliestBlockHeight}
                                                <div className={styles.timeInfo}>
                                                    <MdOutlineAccessTime /> {new Date(chainStatus.earliestBlockTime).toLocaleString()}
                                                </div>
                                            </div>
                                            <div className={styles.statusItem}>
                                                <BiBlock /> <span className={styles.label}>Latest Block:</span> {chainStatus.latestBlockHeight}
                                                <div className={styles.timeInfo}>
                                                    <MdOutlineAccessTime /> {latestBlockTime.toLocaleString()}
                                                    <div>{formatTime(chainStatus.latestBlockTime)}</div>
                                                </div>
                                            </div>
                                            <div className={styles.statusItem}>
                                                <HiDatabase /> <span className={styles.label}>Blocks Kept:</span> {chain.pruneBlocksAfter || 'All'}
                                            </div>
                                        </div>
                                    </Card>
                                </div>
                            );
                        })}
                    </div>
                </>
            }
        </div>
    </>);
}

export default StatusPage; 