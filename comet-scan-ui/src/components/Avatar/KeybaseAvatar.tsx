import { FC, useMemo } from "react";
import styles from './Avatar.module.scss'
import useAsync from "../../hooks/useAsync";
import { getKeybaseAvatar } from "../../api/keybaseApi";
import { stringToColor } from "../../utils/format";

type Props = {
    identity: string | undefined;
    moniker: string | undefined;
    size?: string;
}


const KeybaseAvatar: FC<Props> = ({ identity, moniker, size = '40px' }) => {
    const {data: avatarUrl} = useAsync<string>(getKeybaseAvatar(identity));
    const color = stringToColor(identity || moniker);
    
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

export default KeybaseAvatar;