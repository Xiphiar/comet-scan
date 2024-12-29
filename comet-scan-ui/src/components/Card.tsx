import { CSSProperties, FC, PropsWithChildren } from "react";
import styles from './Card.module.scss';

type Props = {
    className?: string;
    conentClassName?: string;
    style?: CSSProperties;
    gap?: string;
}

const Card: FC<PropsWithChildren<Props>> = ({children, className, conentClassName, style, gap = '8px'}) => {
    return (
        <div className={`d-flex flex-column ${className}`} /*style={{padding: gap}}*/>
            <div className={`${styles.card} ${conentClassName}`} style={{
                margin: gap,
                ...style
            }}>
                {children}
            </div>
        </div>
    )
};

export default Card;