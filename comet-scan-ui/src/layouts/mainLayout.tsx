import { FC, useState } from "react";
import { Link, Outlet, useLocation, useParams } from "react-router-dom";
import styles from './mainLayout.module.scss';
import useConfig from "../hooks/useConfig";
import Toggle from "../components/Toggle/Toggle";
import MobileNav from "../components/MobileNav/MobileNav";
import ConnectWallet from "../components/ConnectWallet/ConnectWallet";
import BetaBanner from "../components/BetaBanner/BetaBanner";
import FeedbackModal from "../components/FeedbackModal/FeedbackModal";

const MainLayout: FC = () => {
    const { chain } = useParams();
    const { getChain } = useConfig()
    const chainConfig = getChain(chain);
    const [showMobileNav, setShowMobileNav] = useState(false);
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const {pathname} = useLocation();

    return (
        <>
            <BetaBanner />
            <header>
                <div className={styles.navbar}>
                    <Link to='/' className='d-flex align-items-center px-4 gap-2'>
                        <svg height={'30px'} width={'36px'}>
                            <use xlinkHref="/logo.svg#cometscanLogo" height={'30px'} width={'36px'} />
                        </svg>
                        <div style={{fontFamily: 'Bunken Tech', fontSize: '20px', marginTop: '4px', color: 'var(--main)', whiteSpace: 'nowrap'}}>Comet Scan</div>
                    </Link>
                    <Link to={`/${chain}`} className={pathname === `/${chain}` ? styles.activeLink : undefined}>Overview</Link>
                    <Link to={`/${chain}/blocks`} className={pathname.startsWith(`/${chain}/blocks`) ? styles.activeLink : undefined}>Blocks</Link>
                    <Link to={`/${chain}/transactions`} className={pathname.startsWith(`/${chain}/transactions`) ? styles.activeLink : undefined}>Transactions</Link>
                    <Link to={`/${chain}/proposals`} className={pathname.startsWith(`/${chain}/proposals`) ? styles.activeLink : undefined}>Proposals</Link>
                    <Link to={`/${chain}/validators`} className={pathname.startsWith(`/${chain}/validators`) ? styles.activeLink : undefined}>Validators</Link>
                    { (chainConfig.features.includes('secretwasm') || chainConfig.features.includes('cosmwasm')) &&
                        <Link to={`/${chain}/contracts`} className={pathname.startsWith(`/${chain}/contracts`) ? styles.activeLink : undefined}>Contracts</Link>
                    }
                    { (chainConfig.features.includes('tokens')) &&
                        <Link
                            // If featured tokens are enabled for the chain, link to the featured tokens page, otherwise link to the all tokens page
                            to={chainConfig.features.includes('featured_tokens') ? `/${chain}/tokens/featured` : `/${chain}/tokens` }
                            className={pathname.startsWith(`/${chain}/tokens`) ? styles.activeLink : undefined}
                        >Tokens</Link>
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
                            <svg height={'60px'} width={'224px'}>
                                <use xlinkHref="/Trivium_w_name_white.svg#triviumLogo" height={'60px'} width={'224px'} />
                            </svg>
                        </a>
                    </div>
                    <div className={styles.socialLinks}>
                        <a href="https://trivium.network" target="_blank" rel="noopener noreferrer" title="Website">
                            <svg height={'24px'} width={'24px'} className={styles.socialIcon}>
                                <use xlinkHref="/world-globe-white-icon.svg#logo" />
                            </svg>
                        </a>
                        <a href="https://discord.gg/tZj7ZhhdP5" target="_blank" rel="noopener noreferrer" title="Discord">
                            <svg height={'24px'} width={'24px'} className={styles.socialIcon}>
                                <use xlinkHref="/discord-white-icon.svg#logo" />
                            </svg>
                        </a>
                        <a href="https://x.com/TriviumNode" target="_blank" rel="noopener noreferrer" title="X">
                            <svg height={'24px'} width={'24px'} className={styles.socialIcon}>
                                <use xlinkHref="/x-social-media-white-icon.svg#logo" />
                            </svg>
                        </a>
                        <a href="https://t.me/TriviumNode" target="_blank" rel="noopener noreferrer" title="Telegram">
                            <svg height={'24px'} width={'24px'} className={styles.socialIcon}>
                                <use xlinkHref="/telegram-white-icon.svg#logo" />
                            </svg>
                        </a>
                        <button 
                            onClick={() => setShowFeedbackModal(true)} 
                            className={styles.feedbackButton}
                            type="button"
                            title="Send Feedback"
                        >
                            <svg height={'24px'} width={'24px'} viewBox="0 0 24 24" className={styles.socialIcon}>
                                <path 
                                    fill="currentColor" 
                                    d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"
                                />
                            </svg>
                        </button>
                        <a href="https://github.com/TriviumNode" target="_blank" rel="noopener noreferrer" title="Github">
                            <svg height={'24px'} width={'24px'} viewBox="0 0 98 96" className={styles.socialIcon}>
                                <use xlinkHref="/github-mark-white.svg#logo" />
                            </svg>
                        </a>
                    </div>
                </div>
            </footer>
            <FeedbackModal 
                isOpen={showFeedbackModal} 
                onClose={() => setShowFeedbackModal(false)} 
            />
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