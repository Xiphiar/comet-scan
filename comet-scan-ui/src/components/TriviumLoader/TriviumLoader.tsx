import React from 'react';
import styles from './TriviumLoader.module.scss';

interface TriviumLoaderProps {
  size?: number | string; // Optional size prop
  className?: string; // Allow passing additional class names
}

const TriviumLoader: React.FC<TriviumLoaderProps> = ({ size = 64, className = '' }) => {
  const containerStyle = {
    width: size,
    height: size,
  };

  return (
    <div style={containerStyle} className={`${styles.loaderContainer} ${className}`}>
      <svg
        className={styles.loaderSvg}
        viewBox="0 0 96 96" // Adjusted viewBox to tightly fit the logo part
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer Triangle */}
        <path
          className={styles.outerTriangle}
          fillRule="evenodd"
          clipRule="evenodd"
          d="M63.897 80.8314C56.8317 93.069 39.1683 93.0689 32.103 80.8314L2.48666 29.5344C-4.57867 17.2969 4.25301 2.00002 18.3837 2.00002L77.6164 2.00003C91.747 2.00003 100.579 17.2969 93.5133 29.5344L63.897 80.8314ZM37.765 77.5625C42.3139 85.4415 53.6861 85.4415 58.2351 77.5625L87.8514 26.2655C92.4003 18.3866 86.7142 8.53788 77.6164 8.53788L18.3837 8.53787C9.28584 8.53787 3.5997 18.3866 8.14861 26.2655L37.765 77.5625Z"
          fill="var(--main)"
        />
        {/* Center Circle */}
        <circle
          className={styles.centerCircle}
          cx="47.9998"
          cy="37.4553"
          r="12.2615"
          stroke="var(--main)"
          strokeWidth="6.5"
        />
        {/* Top Connecting Line */}
        <path
          className={styles.topLine}
          d="M58.7287 43.4327C71.0881 22.0256 47.1069 5.21443 41.2561 5.26887"
          stroke="var(--main)"
          strokeWidth="6.5"
        />
        {/* Right Connecting Line */}
        <path
          className={styles.rightLine}
          d="M37.2715 43.4327C49.1955 64.0857 76.189 52.8776 79.1137 47.8775"
          stroke="var(--main)"
          strokeWidth="6.5"
        />
        {/* Left Connecting Line */}
        <path
          className={styles.leftLine}
          d="M48.3066 25.1938C23.9299 25.1938 21.0056 55.0476 23.937 60.139"
          stroke="var(--main)"
          strokeWidth="6.5"
        />
      </svg>
    </div>
  );
};

export default TriviumLoader; 