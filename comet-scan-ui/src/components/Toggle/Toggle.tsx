import { FC } from "react";
import styles from './Toggle.module.scss';
import useConfig from "../../hooks/useConfig";

const Toggle: FC = () => {
    const {themeClass, setThemeClass} = useConfig();
    const nextTheme = themeClass === 'theme-light' ? 'theme-dark' : 'theme-light';
    return (
        <div>
            <input type="checkbox" className={styles.checkbox} id="checkbox" checked={themeClass === 'theme-dark'} onChange={() => setThemeClass(nextTheme)} />
            <label htmlFor="checkbox" className={styles['checkbox-label']}>
            <i className="fas fa-moon" style={{color: '#FFF'}} />
            <i className="fas fa-sun" style={{color: '#f39c12'}} />
                <span className={styles.ball} />
            </label>
        </div>
    )
}

export default Toggle;