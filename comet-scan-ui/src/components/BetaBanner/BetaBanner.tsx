import { FC, useEffect, useState } from "react";
import styles from './BetaBanner.module.scss';

const BetaBanner: FC = () => {
  const [isVisible, setIsVisible] = useState(true);
  
  useEffect(() => {
    const bannerHidden = localStorage.getItem('betaBannerHidden');
    if (bannerHidden === 'true') {
      setIsVisible(false);
    }
  }, []);
  
  const hideBanner = () => {
    setIsVisible(false);
    localStorage.setItem('betaBannerHidden', 'true');
  };
  
  if (!isVisible) return null;
  
  return (
    <div className={styles.banner}>
      <div className={styles.content}>
        Comet Scan is currently in beta, explorer content may not accurately reflect the current state of the network.
      </div>
      <button 
        className={styles.closeButton} 
        onClick={hideBanner} 
        aria-label="Close banner"
      >
        ✕
      </button>
    </div>
  );
};

export default BetaBanner; 