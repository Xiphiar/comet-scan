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
    const filteredMoniker = moniker?.replace(/[^0-9a-zA-Z]/gi, '');
    const firstLetter = filteredMoniker?.charAt(0).toUpperCase();
    
    return (
        <div className={styles.avatarWrapper} style={{height: size, width: size}}>
            { avatarUrl ?
                <div style={{backgroundColor: color}}>
                    <img src={avatarUrl} alt={firstLetter} />
                </div>
            :
                <div style={{backgroundColor: color}}>{firstLetter}</div>
            }
        </div>
    )
}

export default ValidatorAvatar;