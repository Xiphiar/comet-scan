import { FC, ReactElement, useState, useEffect, Fragment } from "react";
import { FrontendChainConfig, Transaction } from "@comet-scan/types";
import { Link } from "react-router-dom";
import styles from './TransactionRow.module.scss'
import { formatAmounts, formatTime, truncateString } from "../../utils/format";
import { weiFormatNice } from "../../utils/coin";
import { formatTxType, parseMessages, ParsedMessage } from "../../utils/messageParsing";
import { combineCoins } from "../../utils/denoms";
import { SmallSpinner } from "../SmallSpinner/smallSpinner";
import { useUser } from "../../hooks/useUser";
import useConfig from "../../hooks/useConfig";
import Tooltip from "../Tooltip/Tooltip";

const TransactionRow: FC<{ transaction: Transaction, chain: FrontendChainConfig }> = ({ transaction, chain }) => {
    const { user } = useUser();
    const { chains: allChains } = useConfig();
    const txType = transaction.transaction.tx.body.messages.length > 1 ? `${transaction.transaction.tx.body.messages.length} Messages` : transaction.transaction.tx.body.messages[0]["@type"];
    const fee = transaction.transaction.tx.auth_info.fee.amount.find(coin => coin.denom === chain.bondingDenom)?.amount || '0';
    const [parsedMessages, setParsedMessages] = useState<ParsedMessage[] | undefined>(undefined);
    const [allAmounts, setAllAmounts] = useState<ReactElement | undefined>(undefined);
    const timeDisplay = formatTime(transaction.timestamp);

    useEffect(() => {
        (async () => {
            const messages = await parseMessages(chain, allChains, transaction.transaction, [], user?.encryptionUtils);
            setParsedMessages(messages);
            processAmounts(messages);
        })();
    }, [chain, transaction.transaction, user?.encryptionUtils]);
    
    // const allAmounts = parsedMessages ? combineCoins(parsedMessages.map(m => m.amounts)) : [];

    const processAmounts = async (_parsedMessages?: ParsedMessage[]) => {
        try {
            if (!_parsedMessages) _parsedMessages = parsedMessages;
            const amounts = _parsedMessages ? combineCoins(_parsedMessages.map(m => m.amounts)) : [];
            setAllAmounts(await formatAmounts(amounts, chain));
        } catch (error) {
            console.error('Error processing amounts:', error);
        }
    }

    const allTitlesSame = parsedMessages ? parsedMessages.every(msg => msg.title === parsedMessages[0].title) : false;
    const txTypeDisplay = parsedMessages ?
        ( transaction.transaction.tx.body.messages.length > 1 ?
            <div className='d-flex align-items-center gap-2'>
                <div>{parsedMessages[0].title}</div>
                <Tooltip
                    content={allTitlesSame ?
                        `This transaction contains ${transaction.transaction.tx.body.messages.length} messages of the same type.`
                        : `This transaction contains ${transaction.transaction.tx.body.messages.length} different messages.`
                    }
                >
                    { allTitlesSame ?
                        <div className={styles.badge}>x{transaction.transaction.tx.body.messages.length}</div>
                    :
                        <div className={styles.badge}>+{transaction.transaction.tx.body.messages.length - 1}</div>
                    }
                </Tooltip>
            </div>
        :
            parsedMessages[0].title
        )
    :
        formatTxType(txType)
    ;

    const amountDisplay = allAmounts === undefined ? (
        <div style={{marginLeft: '24px'}}>
            <SmallSpinner />
        </div>
    ) : (
        allAmounts
    )
    
    return (<Fragment key={transaction.hash}>
        <Link
            to={`/${chain.id}/transactions/${transaction.hash}`}
            className={styles.dataRow}
            key={transaction.hash}
        >
            <div className='d-none d-sm-flex col col-2'>{truncateString(transaction.hash, 4)}</div>
            <div className='col col-7 col-sm-6 col-md-4 col-lg-3'>{txTypeDisplay}</div>
            <div className='col col-1' style={!transaction.succeeded ? {color: 'red'} : undefined}>
                {transaction.succeeded ? 'Success' : 'Failed'}
            </div>
            <div className='d-none d-md-flex col col-2 col-lg-2'>
                {amountDisplay}
            </div>
            <div className='d-none d-lg-flex col col-1'>{weiFormatNice(fee, chain.bondingDecimals)} {chain.bondingDisplayDenom}</div>
            <div className='col col-4 col-sm-3 align-items-end'>{timeDisplay}</div>
        </Link>
        <Link
            to={`/${chain.id}/transactions/${transaction.hash}`}
            className={styles.mobileTxRow}
            key={transaction.hash}
        >
            <div>
                <div style={{color: 'var(--text-color)', fontSize: '110%'}}>{truncateString(transaction.hash, 6)}</div>
                <div style={!transaction.succeeded ? {color: 'red'} : undefined}>
                    {transaction.succeeded ? 'Success' : 'Failed'}
                </div>
            </div>
            <div>
                <div>Type</div>
                <div>{txTypeDisplay}</div>
            </div>
            <div>
                <div>Amount</div>
                <div>{amountDisplay}</div>
            </div>
            <div>
                <div>Fee</div>
                <div>{weiFormatNice(fee, chain.bondingDecimals)} {chain.bondingDisplayDenom}</div>
            </div>
            <div>
                <div>Time</div>
                <div>{timeDisplay}</div>
            </div>
        </Link>
    </Fragment>)
}

export default TransactionRow;

export const TransactionLabels = () => (
    <div className='d-none d-md-flex mt-4 mb-1'>
        <div className='d-none d-sm-flex col col-2'>
            Hash
        </div>
        <div className='col col-7 col-sm-6 col-md-4 col-lg-3'>
            Type
        </div>
        <div className='col col-1'>
            Result
        </div>
        <div className='d-none d-md-flex col col-2'>
            Amount
        </div>
        <div className='d-none d-lg-flex col col-1'>
            Fee
        </div>
        <div className='col col-4 col-sm-3 text-end'>
            Time
        </div>
    </div>
)
