import { FC } from "react";
import { FrontendChainConfig } from "../../interfaces/config.interface";
import { Transaction } from "../../interfaces/models/transactions.interface";
import { Link } from "react-router-dom";
import styles from './TransactionRow.module.scss'
import { formatTxType, truncateString } from "../../utils/format";
import { weiFormatNice } from "../../utils/coin";

const TransactionRow: FC<{ transaction: Transaction, chain: FrontendChainConfig }> = ({ transaction, chain }) => {
    const txType = transaction.transaction.tx.body.messages.length > 1 ? `${transaction.transaction.tx.body.messages.length} Messages` : transaction.transaction.tx.body.messages[0]["@type"];
    const totalAmount = 0 // TODO
    const fee = transaction.transaction.tx.auth_info.fee.amount.find(coin => coin.denom === chain.bondingDenom)?.amount || '0';
    return (
        <Link
            to={`/${chain.id}/transactions/${transaction.hash}`}
            className={styles.dataRow}
            // style={position + 1 < total ? {borderBottom: '1px solid var(--light-grey)'} : undefined }
        >
            <div className='col col-2'>{truncateString(transaction.hash, 10)}</div>
            <div className='col col-6'>{formatTxType(txType)}</div>
            <div className='col col-2'>{totalAmount} {chain.bondingDisplayDenom}</div>
            <div className='col col-2'>{weiFormatNice(fee, chain.bondingDecimals)} {chain.bondingDisplayDenom}</div>
        </Link>
    )
}

export default TransactionRow;