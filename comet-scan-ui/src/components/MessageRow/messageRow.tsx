import { FC } from "react";
import styles from './MessageRow.module.scss'
import { ParsedMessage } from "../../utils/messageParsing";

const MessageRow: FC<{ message: ParsedMessage, messageIndex: number }> = ({ message, messageIndex }) => {
    return (
        <div className={styles.messageRow}>
            <h4>#{messageIndex + 1} {message.title}</h4>
            <div className='d-flex flex-column gap-2 w-full mt-2'>
                {message.content.map(item => {
                    return (
                        <div className='d-flex w-full'>
                            <div className='col col-3 font-weight-bold'>{item[0]}</div>
                            <div className='col'>{item[1]}</div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export default MessageRow;