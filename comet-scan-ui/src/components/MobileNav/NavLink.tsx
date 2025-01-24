import { FC, PropsWithChildren, useMemo } from "react";
import { LinkProps, Link, useLocation } from "react-router-dom";
import styles from './NavLink.module.scss'

type NavLinkProps = LinkProps & React.RefAttributes<HTMLAnchorElement> & {
  root?: boolean;
};

const NavLink: FC<PropsWithChildren<NavLinkProps>> = ({children, to, root, ...props}) => {
  const { pathname } = useLocation();

  const isActive = useMemo(()=>{
    if (pathname.includes(to.toString())) return true;
    if (pathname === '/' && root) return true;
    return false;
  },[pathname, root, to])
  
  return <Link
    to={to}
    {...props}
    className={isActive ? `${styles.navLink} ${styles.activeLink}` : styles.navLink}
  >
    {children}
  </Link>
}

export default NavLink;