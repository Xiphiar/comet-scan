import { CSSProperties, FC, PropsWithChildren } from "react";
import styles from './Card.module.scss';

type Props = {
    className?: string;
    style?: CSSProperties;
}

const Card: FC<PropsWithChildren<Props>> = ({children, className, style}) => {
    return (
        <div className={`${styles.card} ${className}`} style={style}>
            {children}
        </div>
    )
};

export default Card;