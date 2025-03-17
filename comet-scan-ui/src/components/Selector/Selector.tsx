import { FC } from "react";
import styles from "./Selector.module.scss";

type Props = {
    options: string[];
    selected: string;
    onSelect: (value: string) => void;
    className?: string;
}


const Selector: FC<Props> = ({ options, selected, onSelect, className = '' }) => {
    return (
        <div className={`${styles.selectWrapper} ${className}`}>
            {options.map(option => (
                <button 
                    key={option} 
                    onClick={() => onSelect(option)} 
                    className={selected === option ? styles.selectedButton : undefined}
                >
                    {option}
                </button>
            ))}
        </div>
    )
}

export default Selector;