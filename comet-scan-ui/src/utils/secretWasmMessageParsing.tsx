import { EncryptionUtils, fromBase64, fromUtf8 } from "secretjs";
import { defaultKeyContent, formatTxType, ParsedMessage } from "./messageParsing";
import { Link } from "react-router-dom";
import { FrontendChainConfig } from "../interfaces/config.interface";
import { formatAmounts } from "./format";

const defaultSecretWasmResponse = async (msg: any, messageDisplay: any, config: FrontendChainConfig): Promise<ParsedMessage> => {
    return {
        title: formatTxType(msg['@type']),
        content: [
            ['Contract', <Link to={`/${config.id}/contracts/${msg.contract}`}>{msg.contract}</Link>],
            ['Sender', <Link to={`/${config.id}/accounts/${msg.sender}`}>{msg.sender}</Link>],
            ['Message', messageDisplay],
            ['Sent Funds', !msg.sent_funds?.length ? 'None' : await formatAmounts(msg.sent_funds, config)]
        ],
        amounts: msg.sent_funds,
    }
}

export const parseSecretWasmMessage = async (msg: any, encryptionUtils: EncryptionUtils, config: FrontendChainConfig): Promise<ParsedMessage> => {
    try {
        const contractInputMsgBytes = fromBase64(msg.msg);
        const nonce = contractInputMsgBytes.slice(0, 32);
        const ciphertext = contractInputMsgBytes.slice(64);

        const plaintext = await encryptionUtils.decrypt(ciphertext, nonce);
        const decryptedMsg = JSON.parse(fromUtf8(plaintext).slice(64)); // first 64 chars is the codeHash

        // TODO determine the type of contract from the address. For now we'll just parse some basic SNIP20 messages

        const executeFunction = Object.keys(decryptedMsg)[0];

        if (executeFunction === 'deposit' && msg.sent_funds?.length) {
            return {
                title: 'Wrap Token',
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
            return {
                title: 'Unwrap Token',
                content: [
                    ['Contract', <Link to={`/${config.id}/contracts/${msg.contract}`}>{msg.contract}</Link>],
                    ['Sender', <Link to={`/${config.id}/accounts/${msg.sender}`}>{msg.sender}</Link>],
                    // ['Amount', !msg.sent_funds?.length ? 'None' : await formatAmounts(msg.sent_funds, config)] // TODO get amount from logs, or denom from backend?
                ],
                amounts: msg.amount,
            }
        }

        return defaultSecretWasmResponse(msg, defaultKeyContent(decryptedMsg), config);
    } catch (e) {
        // If decryption fails, keep showing "Encrypted"
        return defaultSecretWasmResponse(msg, 'Encrypted', config);
    }
}