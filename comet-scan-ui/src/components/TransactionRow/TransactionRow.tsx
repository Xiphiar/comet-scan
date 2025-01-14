import { FC } from "react";
import { FrontendChainConfig } from "../../interfaces/config.interface";
import { Transaction } from "../../interfaces/models/transactions.interface";
import { Link } from "react-router-dom";
import styles from './TransactionRow.module.scss'
import { formatAmounts, truncateString } from "../../utils/format";
import { weiFormatNice } from "../../utils/coin";
import { formatTxType, parseMessages } from "../../utils/messageParsing";
import { combineCoins } from "../../utils/denoms";

const TransactionRow: FC<{ transaction: Transaction, chain: FrontendChainConfig }> = ({ transaction, chain }) => {
    const txType = transaction.transaction.tx.body.messages.length > 1 ? `${transaction.transaction.tx.body.messages.length} Messages` : transaction.transaction.tx.body.messages[0]["@type"];
    const fee = transaction.transaction.tx.auth_info.fee.amount.find(coin => coin.denom === chain.bondingDenom)?.amount || '0';
    const parsedMessages = parseMessages(chain, transaction.transaction)
    const allAmounts = combineCoins(parsedMessages.map(m => m.amounts));
    
    return (
        <Link
            to={`/${chain.id}/transactions/${transaction.hash}`}
            className={styles.dataRow}
            // style={position + 1 < total ? {borderBottom: '1px solid var(--light-grey)'} : undefined }
        >
            <div className='col col-2'>{truncateString(transaction.hash, 8)}</div>
            <div className='col col-6'>{formatTxType(txType)}</div>
            <div className='col col-2'>{formatAmounts(allAmounts)}</div>
            <div className='col col-2'>{weiFormatNice(fee, chain.bondingDecimals)} {chain.bondingDisplayDenom}</div>
        </Link>
    )
}

export default TransactionRow;
