import { FC } from "react";
import styles from './ErrorAlert.module.scss'

type Props = {
    title?: string;
    children: string;
}
const ErrorAlert: FC<Props> = ({title, children}) => {

    return <div className={styles.wrapper}>
        {!!title && <div className={styles.title}>{title}</div>}
        {children}
    </div>
}

export default ErrorAlert