import { FC } from "react";
import { Transaction } from "../../interfaces/models/transactions.interface";
import styles from './MessageRow.module.scss'
import { formatTxType, truncateString } from "../../utils/format";

const MessageRow: FC<{ transaction: Transaction, messageIndex: number }> = ({ transaction, messageIndex }) => {
    const message = transaction.transaction.tx.body.messages[messageIndex];
    const txType = formatTxType(message["@type"]);
    return (
        <div className={styles.messageRow}>
            <h4>#{messageIndex + 1} {txType}</h4>
            <div className='d-flex flex-column gap-2 w-full mt-2'>
                {Object.keys(message).map(key => {
                    let value = message[key];
                    if (typeof value === 'object') value = JSON.stringify(value, undefined, 2);

                    if (value.length > 64) value = (
                        <details className={styles.description}>
                            <summary data-open="Close" data-close="Show">{truncateString(value, 30)}</summary>
                            <div className='text-break'>{value}</div>
                        </details>
                    )

                    return (
                        <div className='d-flex w-full'>
                            <div className='col col-3 font-weight-bold'>{key}</div>
                            <div className='col'>
                                {value}  
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export default MessageRow;