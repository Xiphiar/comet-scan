import { FC } from "react";
import styles from './MobileNav.module.scss'
import { FrontendChainConfig } from "../../interfaces/config.interface";
import { NavLink } from "react-router-dom";
import Toggle from "../Toggle/Toggle";

const MobileNav: FC<{show: boolean, hide: ()=>any, chain: FrontendChainConfig}> = ({show, hide, chain: { id, features }}) => {
  const links: [string, string][] = [
    ['Overview', `/${id}/overview`],
    ['Blocks', `/${id}/blocks`],
    ['Transactions', `/${id}/transactions`],
    ['Proposals', `/${id}/proposals`],
    ['Validators', `/${id}/validators`],
  ]
  if (features.includes('secretwasm') || features.includes('cosmwasm')) links.push(['Contracts', `/${id}/contracts`],)
  
  const overlayStyle = show ? undefined : { background: 'transparent', zIndex: -999 }
  const wrapperStyle = show ? undefined : { transform: 'translateX(100%)' }
  return (<>
      <div className={styles.overlayWrapper} style={overlayStyle} />
      <div className={styles.mobileNavWrapper} style={wrapperStyle}>
        <div className='d-flex justify-content-between align-items-center'>
          <button type='button' onClick={hide} className={styles.closeButton}>
            𐌗
          </button>
          <NavLink to='/' onClick={()=>hide()}>
            <img src='/logo.svg' className={styles.navbarLogo} />
          </NavLink>
        </div>
        { links.map(l =>
          <NavLink to={l[1]} onClick={()=>hide()} key={l[0]}>{l[0]}</NavLink>
        )}
        <div style={{paddingRight: '16px'}} className='d-flex justify-content-end'>
          <Toggle />
        </div>
      </div>
    </>
  )
}

export default MobileNav;