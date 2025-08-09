import { FC } from "react";
import styles from './MobileNav.module.scss'
import { FrontendChainConfig } from "@comet-scan/types";
import { NavLink } from "react-router-dom";
import Toggle from "../Toggle/Toggle";
import ConnectWallet from "../ConnectWallet/ConnectWallet";
import { useUser } from "../../hooks/useUser";

const MobileNav: FC<{show: boolean, hide: ()=>any, chain: FrontendChainConfig}> = ({show, hide, chain}) => {
  const { user, disconnectWallet } = useUser();
  const links: [string, string][] = [
    ['Overview', `/${chain.id}/overview`],
    ['Blocks', `/${chain.id}/blocks`],
    ['Transactions', `/${chain.id}/transactions`],
    ['Proposals', `/${chain.id}/proposals`],
    ['Validators', `/${chain.id}/validators`],
  ]
  if (chain.features.includes('secretwasm') || chain.features.includes('cosmwasm')) links.push(['Contracts', `/${chain.id}/contracts`],);
  if (chain.features.includes('tokens')) links.push([
    'Tokens',
    // If featured tokens are enabled for the chain, link to the featured tokens page, otherwise link to the all tokens page
    chain.features.includes('featured_tokens') ? `/${chain.id}/tokens/featured` : `/${chain.id}/tokens`,
  ]);
  
  const overlayStyle = show ? undefined : { background: 'transparent', zIndex: -999 }
  const wrapperStyle = show ? undefined : { transform: 'translateX(100%)' }
  return (<>
      <div className={styles.overlayWrapper} style={overlayStyle} />
      <div className={styles.mobileNavWrapper} style={wrapperStyle}>
        <div className='d-flex justify-content-between align-items-center'>
          <button type='button' onClick={hide} className={styles.closeButton}>
            𐌗
          </button>
          <NavLink to='/' onClick={()=>hide()} className={styles.logoLink}>
            <svg height={'64px'} width={'76px'}>
                <use xlinkHref="/logo.svg#cometscanLogo" height={'64px'} width={'76px'} />
            </svg>
          </NavLink>
        </div>
        <div className='d-flex justify-content-end'>
          <ConnectWallet chainConfig={chain} isMobile={true} />
        </div>
        {user && (
          <NavLink to={`/${chain.id}/accounts/${user.address}`} onClick={()=>hide()}>
            Your Account
          </NavLink>
        )}
        { links.map(l =>
          <NavLink to={l[1]} onClick={()=>hide()} key={l[0]}>{l[0]}</NavLink>
        )}
        {user && (
          <NavLink 
            to="#" 
            onClick={(e) => {
              e.preventDefault();
              disconnectWallet();
            }}
          >
            Disconnect Wallet
          </NavLink>
        )}
        <div style={{paddingRight: '16px'}} className='d-flex justify-content-end'>
          <Toggle />
        </div>
      </div>
    </>
  )
}

export default MobileNav;