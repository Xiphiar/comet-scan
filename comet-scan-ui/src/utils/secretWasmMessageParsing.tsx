import { EncryptionUtils, fromBase64, fromUtf8 } from "secretjs";
import { defaultKeyContent, formatTxType, ParsedMessage, ParsedMessageContent } from "./messageParsing";
import { Link } from "react-router-dom";
import { FrontendChainConfig } from "../interfaces/config.interface";
import { formatAmounts } from "./format";
import { LcdTxResponse } from "../interfaces/lcdTxResponse";

const getAllExecutedContracts = (tx: LcdTxResponse, messageIndex: string, exclude?: string): string[] => {
    // Get all wasm events
    const wasmEvents = tx.tx_response.events.filter(e => e.type === 'wasm');

    // Filter correct message index
    const messageWasmEvents = wasmEvents.filter(e => {
        const msgIndexAttribute = e.attributes.find(a => a.key === 'msg_index');
        if (msgIndexAttribute?.value === messageIndex) return true;
        return false;
    });

    const contracts: string[] = [];
    messageWasmEvents.forEach(e => {
        const address = e.attributes.find(a => a.key === 'contract_address')?.value;
        if (!contracts.includes(address)) contracts.push(address);
    })
    return contracts.filter(c => c !== exclude);
}

const defaultSecretWasmResponse = async (msg: any, messageIndex: string, tx: LcdTxResponse, messageDisplay: any, config: FrontendChainConfig): Promise<ParsedMessage> => {
    const calledContracts = getAllExecutedContracts(tx, messageIndex, msg.contract)

    const content: ParsedMessageContent = [
        ['Executed Contract', <Link to={`/${config.id}/contracts/${msg.contract}`}>{msg.contract}</Link>],
        ['Sender', <Link to={`/${config.id}/accounts/${msg.sender}`}>{msg.sender}</Link>],
        ['Message', messageDisplay],
        ['Sent Funds', !msg.sent_funds?.length ? 'None' : await formatAmounts(msg.sent_funds, config)],
    ];
    if (calledContracts.length) content.push([
        'Called Contracts',
        <div className='d-flex flex-column gap-1 align-items-start'>{calledContracts.map(c => <Link key={c} to={`/${config.id}/contracts/${c}`}>{c}</Link>)}</div>
    ])
    return {
        title: formatTxType(msg['@type']),
        content,
        amounts: msg.sent_funds,
    }
}

export const parseSecretWasmMessage = async (msg: any, messageIndex: string, tx: LcdTxResponse, encryptionUtils: EncryptionUtils, config: FrontendChainConfig): Promise<ParsedMessage> => {
    try {
        const contractInputMsgBytes = fromBase64(msg.msg);
        const nonce = contractInputMsgBytes.slice(0, 32);
        const ciphertext = contractInputMsgBytes.slice(64);

        const plaintext = await encryptionUtils.decrypt(ciphertext, nonce);
        const decryptedMsg = JSON.parse(fromUtf8(plaintext).slice(64)); // first 64 chars is the codeHash

        // TODO determine the type of contract from the address. For now we'll just parse some basic SNIP20 messages

        const executeFunction = Object.keys(decryptedMsg)[0];
        const calledContracts = getAllExecutedContracts(tx, messageIndex, msg.contract);

        let parsedData: ParsedMessage = {
            title: `Execute Contract: ${formatExecuteFunction(executeFunction)}`,
            content: [
                ['Contract', <Link to={`/${config.id}/contracts/${msg.contract}`}>{msg.contract}</Link>],
                ['Sender', <Link to={`/${config.id}/accounts/${msg.sender}`}>{msg.sender}</Link>],
                ['Message', defaultKeyContent(decryptedMsg)],
                ['Sent Funds', !msg.sent_funds?.length ? 'None' : await formatAmounts(msg.sent_funds, config)]
            ],
            amounts: msg.amount,
        }

        if (executeFunction === 'deposit' && msg.sent_funds?.length) {
            parsedData = {
                title: 'Execute Contract: Wrap Token',
                content: [
                    ['Contract', <Link to={`/${config.id}/contracts/${msg.contract}`}>{msg.contract}</Link>],
                    ['Sender', <Link to={`/${config.id}/accounts/${msg.sender}`}>{msg.sender}</Link>],
                    ['Amount', !msg.sent_funds?.length ? 'None' : await formatAmounts(msg.sent_funds, config)]
                ],
                amounts: msg.amount,
            }
        }

        if (executeFunction === 'redeem') {
            console.log(decryptedMsg);
            parsedData = {
                title: 'Execute Contract: Unwrap Token',
                content: [
                    ['Contract', <Link to={`/${config.id}/contracts/${msg.contract}`}>{msg.contract}</Link>],
                    ['Sender', <Link to={`/${config.id}/accounts/${msg.sender}`}>{msg.sender}</Link>],
                    // ['Amount', !msg.sent_funds?.length ? 'None' : await formatAmounts(msg.sent_funds, config)] // TODO get amount from logs, or denom from backend?
                ],
                amounts: msg.amount,
            }
        }

        if (calledContracts.length) parsedData.content.push([
            'Called Contracts',
            <div className='d-flex flex-column gap-1 align-items-start'>{calledContracts.map(c => <Link key={c} to={`/${config.id}/contracts/${c}`}>{c}</Link>)}</div>
        ])

        return parsedData;
    } catch {
        // If decryption fails, keep showing "Encrypted"
        return defaultSecretWasmResponse(msg, messageIndex, tx, 'Encrypted', config);
    }
}

const formatExecuteFunction = (executeFunction: string) => {
  return executeFunction
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}