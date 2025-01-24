import { FC, useState } from "react";
import { Link, Outlet, useParams } from "react-router-dom";
import styles from './mainLayout.module.scss';
import useConfig from "../hooks/useConfig";
import Toggle from "../components/Toggle/Toggle";
import MobileNav from "../components/MobileNav/MobileNav";

const MainLayout: FC = () => {
    const { chain } = useParams();
    const { getChain } = useConfig()
    const chainConfig = getChain(chain);
    const [showMobileNav, setShowMobileNav] = useState(false);

    return (
        <>
            <header>
                <div className={styles.navbar}>
                    <Link to='/' className='d-flex align-items-center px-4 gap-2'>
                        <img src='/logo.svg' style={{height: '30px', marginBottom: '8px'}} />
                        <div style={{fontFamily: 'Bunken Tech', fontSize: '20px', marginTop: '4px', color: 'var(--main)'}}>Comet Scan</div>
                    </Link>
                    <Link to={`/${chain}`} className='d-none d-lg-flex'>Overview</Link>
                    <Link to={`/${chain}/blocks`} className='d-none d-lg-flex'>Blocks</Link>
                    <Link to={`/${chain}/transactions`} className='d-none d-lg-flex'>Transactions</Link>
                    <Link to={`/${chain}/proposals`} className='d-none d-lg-flex'>Proposals</Link>
                    <Link to={`/${chain}/validators`} className='d-none d-lg-flex'>Validators</Link>
                    { (chainConfig.features.includes('secretwasm') || chainConfig.features.includes('cosmwasm')) &&
                        <Link to={`/${chain}/contracts`} className='d-none d-lg-flex'>Contracts</Link>
                    }
                    <div style={{marginLeft: 'auto', paddingRight: '16px'}} className='d-none d-lg-flex align-items-center'>
                        <Toggle />
                    </div>
                    <div className='d-flex d-lg-none justify-content-end flex-grow-1'>
                        <HamburgerButton onClick={()=>setShowMobileNav(true)} />
                    </div>
                </div>
            </header>
            <MobileNav show={showMobileNav} hide={()=>setShowMobileNav(false)} chain={chainConfig} />
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

const HamburgerButton: FC<{onClick: ()=>any}> = ({onClick}) => {
    return <button
      className={styles.hamburgerButton}
      type='button'
      onClick={onClick}
    >
      <span />
      <span />
      <span />
    </button>
  }