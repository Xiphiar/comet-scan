import { FC, useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import styles from './HiddenText.module.scss';

interface HiddenTextProps {
  text: string;
  className?: string;
}

const HiddenText: FC<HiddenTextProps> = ({ text, className }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };
  
  const maskText = () => {
    return '*'.repeat(text.length);
  };
  
  return (
    <span className={`${styles.container} ${className || ''}`}>
      <span className={styles.textContent}>
        {isVisible ? text : maskText()}
      </span>
      <button 
        className={styles.toggleButton}
        onClick={toggleVisibility}
        type="button"
        aria-label={isVisible ? 'Hide text' : 'Show text'}
      >
        {isVisible ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
      </button>
    </span>
  );
};

export default HiddenText; 