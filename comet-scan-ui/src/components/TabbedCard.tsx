import { CSSProperties, FC, PropsWithChildren, ReactElement, ReactNode, useState } from "react";
import styles from './Card.module.scss';

type Tab = {
    title: string;
    content: ReactNode;
};

type Props = {
    className?: string;
    conentClassName?: string;
    style?: CSSProperties;
    gap?: string;
    tabs: Tab[];
    title?: string;
    overlay?: ReactElement;
};

const TabbedCard: FC<Props> = ({
    className,
    conentClassName,
    style,
    gap = '8px',
    tabs,
    title,
    overlay,
}) => {
    const [activeTabIndex, setActiveTabIndex] = useState(0);

    return (
        <div className={`${styles.cardWrapper} ${overlay ? 'position-relative' : ''} ${className}`}>
            <div className={`${styles.card} ${conentClassName}`} style={{
                margin: gap,
                ...style
            }}>
                {!!overlay && overlay }
                {!!title && <h3 className='mb-3'>{title}</h3>}
                <div className="d-flex mb-3 gap-1">
                    {tabs.map((tab, index) => (
                        <div 
                            key={`tab-${index}`}
                            className={`px-3 py-2 ${styles.tab} ${index === activeTabIndex ? `border-bottom fw-bold ${styles.activeTab}` : ''}`}
                            onClick={() => setActiveTabIndex(index)}
                        >
                            {tab.title}
                        </div>
                    ))}
                </div>
                {tabs[activeTabIndex]?.content}
            </div>
        </div>
    );
};

export default TabbedCard; 