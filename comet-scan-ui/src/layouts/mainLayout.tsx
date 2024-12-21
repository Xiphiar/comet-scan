import { FC } from "react";
import { Link, Outlet, useParams } from "react-router-dom";
import styles from './mainLayout.module.scss';

const MainLayout: FC = () => {
    const { chain } = useParams();

    return (
        <>
            <header>
                <div className={styles.navbar}>
                    <Link to='/' className='d-flex align-items-center px-4 gap-2'>
                        <img src='/logo.svg' style={{height: '30px', marginBottom: '8px'}} />
                        <div style={{fontFamily: 'Bunken Tech', fontSize: '20px', marginTop: '4px', color: 'var(--main)'}}>Comet Scan</div>
                    </Link>
                    <Link to={`/${chain}`} style={{color: 'black'}}>Overview</Link>
                    <Link to={`/${chain}/blocks`} style={{color: 'black'}}>Blocks</Link>
                    <Link to={`/${chain}/transactions`} style={{color: 'black'}}>Transactions</Link>
                    <Link to={`/${chain}/proposals`} style={{color: 'black'}}>Proposals</Link>
                    <Link to={`/${chain}/validators`} style={{color: 'black'}}>Validators</Link>
                </div>
            </header>
            <Outlet />
            <footer>

            </footer>
        </>
    )
}

export default MainLayout;