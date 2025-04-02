import { CSSProperties, FC } from "react";
import styles from "./Selector.module.scss";

type Props = {
    options: string[];
    selected: string;
    onSelect: (value: string) => void;
    className?: string;
    style?: CSSProperties;
    height?: number;
    borderThickness?: number;
}


const Selector: FC<Props> = ({ options, selected, onSelect, className = '', style = {}, height = 42, borderThickness = 2 }) => {
    const buttonHeight = height - 4;
    return (
        <div
            className={`${styles.selectWrapper} ${className}`}
            style={{
                height: `${height}px`,
                borderRadius: `${height}px`,
                border: `${borderThickness}px solid var(--main)`,
                fontWeight: 600,
                ...style,
            }}
        >
            {options.map(option => (
                <button 
                    key={option} 
                    onClick={() => onSelect(option)} 
                    className={selected === option ? styles.selectedButton : undefined}
                    style={{
                        height: `${buttonHeight}px`,
                        borderRadius: `${buttonHeight}px`,
                        outline: 'none',
                    }}
                >
                    {option}
                </button>
            ))}
        </div>
    )
}

export default Selector;