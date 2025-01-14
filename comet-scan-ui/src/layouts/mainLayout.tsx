import { FC } from "react";
import { Link, Outlet, useParams } from "react-router-dom";
import styles from './mainLayout.module.scss';
import useConfig from "../hooks/useConfig";
import Toggle from "../components/Toggle/Toggle";

const MainLayout: FC = () => {
    const { chain } = useParams();
    const { getChain } = useConfig()
    const chainConfig = getChain(chain);

    return (
        <>
            <header>
                <div className={styles.navbar}>
                    <Link to='/' className='d-flex align-items-center px-4 gap-2'>
                        <img src='/logo.svg' style={{height: '30px', marginBottom: '8px'}} />
                        <div style={{fontFamily: 'Bunken Tech', fontSize: '20px', marginTop: '4px', color: 'var(--main)'}}>Comet Scan</div>
                    </Link>
                    <Link to={`/${chain}`}>Overview</Link>
                    <Link to={`/${chain}/blocks`}>Blocks</Link>
                    <Link to={`/${chain}/transactions`}>Transactions</Link>
                    <Link to={`/${chain}/proposals`}>Proposals</Link>
                    <Link to={`/${chain}/validators`}>Validators</Link>
                    { (chainConfig.features.includes('secretwasm') || chainConfig.features.includes('cosmwasm')) &&
                        <Link to={`/${chain}/contracts`}>Contracts</Link>
                    }
                    <div style={{marginLeft: 'auto', paddingRight: '16px'}} className='d-flex align-items-center'>
                        <Toggle />
                    </div>
                </div>
            </header>
            <div style={{display: 'flex', justifyContent: 'center'}}>
                <div style={{width: '100%', maxWidth: '1400px'}} className='px-md-4'>
                    <Outlet />
                </div>
            </div>
            <footer>
                <div style={{height: '16px'}} />
            </footer>
        </>
    )
}

export default MainLayout;