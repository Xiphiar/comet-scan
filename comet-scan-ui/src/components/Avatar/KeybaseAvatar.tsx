import { FC } from "react";
import styles from './Avatar.module.scss'
import { stringToColor } from "../../utils/format";

type Props = {
    avatarUrl: string | undefined;
    moniker: string | undefined;
    size?: string;
}


const ValidatorAvatar: FC<Props> = ({ avatarUrl, moniker, size = '40px' }) => {
    const color = stringToColor(moniker);
    
    return (
        <div className={styles.avatarWrapper} style={{height: size, width: size}}>
            { avatarUrl ?
                <img src={avatarUrl} />
            :
                <div style={{backgroundColor: color}}>{moniker?.charAt(0).toUpperCase()}</div>
            }
        </div>
    )
}

export default ValidatorAvatar;