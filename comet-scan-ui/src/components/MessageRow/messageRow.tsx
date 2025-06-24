import { FC, useState } from "react";
import styles from './MessageRow.module.scss'
import { ParsedMessage } from "../../utils/messageParsing";
import { FaChevronDown } from "react-icons/fa";

const MessageRow: FC<{ message: ParsedMessage, messageIndex: number }> = ({ message, messageIndex }) => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleAccordion = () => {
        setIsOpen(!isOpen);
    };

    return (
        <div className={styles.messageRow}>
            <div 
                className={styles.messageHeader} 
                onClick={toggleAccordion}
            >
                <h4>#{messageIndex + 1} {message.title}</h4>
                <FaChevronDown className={`${styles.arrow} ${isOpen ? styles.arrowOpen : ''}`} />
            </div>
            {isOpen && (
                <div className={`d-flex flex-column gap-2 w-full ${styles.messageContent}`}>
                    {message.content.map((item, i) => {
                        return (
                            <div className={`d-flex flex-wrap w-full ${styles.messageItem}`} key={i}>
                                <div className='col col-12 col-sm-3 font-weight-bold'>{item[0]}</div>
                                <div className='col ms-3 ms-sm-0 text-break'>{item[1]}</div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

export default MessageRow;