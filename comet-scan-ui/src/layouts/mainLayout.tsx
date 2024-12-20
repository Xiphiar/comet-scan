import { FC } from "react";
import { Link, Outlet, useParams } from "react-router-dom";
import styles from './mainLayout.module.scss';

const MainLayout: FC = () => {
    const { chain } = useParams();

    return (
        <>
            <header>
                <div className={styles.navbar}>
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