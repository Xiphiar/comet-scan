import { FC } from 'react';
import { FrontendChainConfig } from '../../interfaces/config.interface';
import { useUser } from '../../hooks/useUser';
import SmallSpinnerBlack from '../SmallSpinner/smallSpinner';
import { truncateString } from '../../utils/format';
import styles from './ConnectWallet.module.scss';

interface ConnectWalletProps {
    chainConfig: FrontendChainConfig;
}

const ConnectWallet: FC<ConnectWalletProps> = ({ chainConfig }) => {
    const { user, connectWallet, isLoading } = useUser();

    if (!chainConfig.enableWalletConnect) {
        return null;
    }

    return user ? (
        <div className={styles.connectButton} style={{maxWidth: '200px'}}>
            <img src='/logos/keplr.svg' style={{height: '20px'}} />
            {truncateString(user.address)}
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