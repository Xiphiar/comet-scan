import { FC, useState, useRef, useEffect } from 'react';
import { FrontendChainConfig } from '../../interfaces/config.interface';
import { useUser } from '../../hooks/useUser';
import { SmallSpinnerBlack } from '../SmallSpinner/smallSpinner';
import { truncateString } from '../../utils/format';
import styles from './ConnectWallet.module.scss';
import { Link } from 'react-router-dom';

interface ConnectWalletProps {
    chainConfig: FrontendChainConfig;
    isMobile?: boolean;
}

const ConnectWallet: FC<ConnectWalletProps> = ({ chainConfig, isMobile = false }) => {
    const { user, connectWallet, disconnectWallet, isLoading } = useUser();
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleDisconnect = () => {
        disconnectWallet();
        setShowDropdown(false);
    };

    if (!chainConfig.enableWalletConnect) {
        return null;
    }

    return user ? (
        <div style={{position: 'relative'}} ref={dropdownRef}>
            <button 
                onClick={() => !isMobile && setShowDropdown(!showDropdown)}
                className={styles.connectButton}
            >
                <img src='/logos/keplr.svg' style={{height: '20px'}} />
                {truncateString(user.address)}
            </button>
            {showDropdown && !isMobile && (
                <div className={styles.dropdown}>
                    <Link 
                        to={`/${chainConfig.id}/accounts/${user.address}`} 
                        className={styles.dropdownItem}
                        onClick={() => setShowDropdown(false)}
                    >
                        View Account
                    </Link>
                    <button onClick={handleDisconnect} className={styles.dropdownItem}>
                        Disconnect
                    </button>
                </div>
            )}
        </div>
    ) : (
        <button
            type='button'
            className={styles.connectButton}
            onClick={() => connectWallet(chainConfig)}
            disabled={isLoading}
        >
            <img src='/logos/keplr.svg' style={{height: '20px'}} />
            Connect {isLoading && <SmallSpinnerBlack />}
        </button>
    );
};

export default ConnectWallet; 