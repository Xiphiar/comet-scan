import { FC, ReactNode, useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import styles from './Tooltip.module.scss';

type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

type TooltipProps = {
    children: ReactNode;
    content: string;
    position?: TooltipPosition;
    width?: number;
}

const Tooltip: FC<TooltipProps> = ({ children, content, position = 'top', width }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
    const triggerRef = useRef<HTMLSpanElement>(null);
    const tooltipRef = useRef<HTMLSpanElement>(null);

    const updateTooltipPosition = () => {
        if (!triggerRef.current || !tooltipRef.current) return;

        const triggerRect = triggerRef.current.getBoundingClientRect();
        const tooltipRect = tooltipRef.current.getBoundingClientRect();
        
        let top = 0;
        let left = 0;

        switch (position) {
            case 'top':
                top = triggerRect.top - tooltipRect.height - 10;
                left = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2);
                break;
            case 'bottom':
                top = triggerRect.bottom + 10;
                left = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2);
                break;
            case 'left':
                top = triggerRect.top + (triggerRect.height / 2) - (tooltipRect.height / 2);
                left = triggerRect.left - tooltipRect.width - 10;
                break;
            case 'right':
                top = triggerRect.top + (triggerRect.height / 2) - (tooltipRect.height / 2);
                left = triggerRect.right + 10;
                break;
        }

        setTooltipPosition({ top, left });
    };

    const handleMouseEnter = () => {
        setIsVisible(true);
        setTimeout(updateTooltipPosition, 0);
    };

    const handleMouseLeave = () => {
        setIsVisible(false);
    };

    useEffect(() => {
        if (isVisible) {
            updateTooltipPosition();
            window.addEventListener('scroll', updateTooltipPosition, true);
            window.addEventListener('resize', updateTooltipPosition);
        }
        
        return () => {
            window.removeEventListener('scroll', updateTooltipPosition, true);
            window.removeEventListener('resize', updateTooltipPosition);
        };
    }, [isVisible]);

    const tooltipContent = isVisible && createPortal(
        <span 
            ref={tooltipRef}
            className={`${styles.tooltipText} ${styles[`tooltip${position.charAt(0).toUpperCase() + position.slice(1)}`]}`}
            style={{ 
                top: `${tooltipPosition.top}px`, 
                left: `${tooltipPosition.left}px`,
                opacity: isVisible ? 1 : 0,
                visibility: isVisible ? 'visible' : 'hidden',
                maxWidth: width ? `${width}px` : undefined
            }}
        >
            {content}
        </span>,
        document.body
    );
    
    return (
        <span 
            ref={triggerRef} 
            className={styles.tooltip}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {children}
            {tooltipContent}
        </span>
    );
}

export default Tooltip;