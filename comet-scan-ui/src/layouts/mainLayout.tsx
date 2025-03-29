import { FC, useState } from "react";
import { Link, Outlet, useParams } from "react-router-dom";
import styles from './mainLayout.module.scss';
import useConfig from "../hooks/useConfig";
import Toggle from "../components/Toggle/Toggle";
import MobileNav from "../components/MobileNav/MobileNav";
import ConnectWallet from "../components/ConnectWallet/ConnectWallet";

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
                    <div style={{marginLeft: 'auto', paddingRight: '16px'}} className='d-none d-lg-flex align-items-center gap-3'>
                        <ConnectWallet chainConfig={chainConfig} />
                        <Toggle />
                    </div>
                    <div className='d-flex d-lg-none justify-content-end flex-grow-1'>
                        <HamburgerButton onClick={()=>setShowMobileNav(true)} />
                    </div>
                </div>
            </header>
            <MobileNav show={showMobileNav} hide={()=>setShowMobileNav(false)} chain={chainConfig} />
            <div style={{display: 'flex', justifyContent: 'center', flexGrow: 1}}>
                <div style={{width: '100%', maxWidth: '1400px'}} className='d-flex flex-column flex-grow-1 px-md-4'>
                    <Outlet />
                </div>
            </div>
            <footer className={styles.footer}>
                <div className={styles.footerContent}>
                    <div className={styles.footerSection}>
                        <div className={styles.developedBy}>Developed by</div>
                        <a href="https://trivium.network" target="_blank" rel="noopener noreferrer">
                            <img src='/Trivium_w_name_white.svg' alt="Trivium" className={styles.footerLogo} />
                        </a>
                    </div>
                    <div className={styles.socialLinks}>
                        <a href="https://trivium.network" target="_blank" rel="noopener noreferrer" title="Website">
                            <img src='/world-globe-white-icon.svg' alt="Website" className={styles.socialIcon} />
                        </a>
                        <a href="#" target="_blank" rel="noopener noreferrer" title="Discord">
                            <img src='/discord-white-icon.svg' alt="Discord" className={styles.socialIcon} />
                        </a>
                        <a href="#" target="_blank" rel="noopener noreferrer" title="X">
                            <img src='/x-social-media-white-icon.svg' alt="X" className={styles.socialIcon} />
                        </a>
                        <a href="#" target="_blank" rel="noopener noreferrer" title="Telegram">
                            <img src='/telegram-white-icon.svg' alt="Telegram" className={styles.socialIcon} />
                        </a>
                    </div>
                </div>
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