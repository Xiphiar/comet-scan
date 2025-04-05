import { FC, useState } from "react";
import styles from './EventRow.module.scss';
import { TxEvent } from "../../interfaces/lcdTxResponse";
import { defaultKeyContent } from "../../utils/messageParsing";
import { FaChevronDown } from "react-icons/fa";

interface EventRowProps {
    events: TxEvent[];
    messageIndex: number;
    messageTitle: string;
}

const EventRow: FC<EventRowProps> = ({ events, messageIndex, messageTitle }) => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleAccordion = () => {
        setIsOpen(!isOpen);
    };

    return (
        <div className={styles.eventRow}>
            <div 
                className={styles.eventHeader} 
                onClick={toggleAccordion}
            >
                <h4>#{messageIndex + 1} {messageTitle}</h4>
                <FaChevronDown className={`${styles.arrow} ${isOpen ? styles.arrowOpen : ''}`} />
            </div>
            {isOpen && (
                <div className={`d-flex flex-column gap-2 w-full mt-2 ${styles.eventContent}`}>
                    {events.map((event, eventIndex) => (
                        <div key={eventIndex} className={styles.eventItem}>
                            <h5>Event: {event.type}</h5>
                            <div className='d-flex flex-column gap-2 w-full mt-2'>
                                {event.attributes.map((attr, attrIndex) => (
                                    <div className='d-flex w-full' key={attrIndex}>
                                        <div className='col col-3 font-weight-bold'>{attr.key}</div>
                                        <div className='col'>{defaultKeyContent(attr.value)}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default EventRow; 