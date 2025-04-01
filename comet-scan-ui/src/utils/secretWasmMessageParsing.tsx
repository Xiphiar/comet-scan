import { EncryptionUtils, fromBase64, fromUtf8 } from "secretjs";
import { defaultKeyContent, formatTxType, ParsedMessage, ParsedMessageContent } from "./messageParsing";
import { Link } from "react-router-dom";
import { FrontendChainConfig } from "../interfaces/config.interface";
import { formatAmounts, maybeParseJson, truncateStringEnd } from "./format";
import { LcdTxResponse } from "../interfaces/lcdTxResponse";
import { match, P } from "ts-pattern";
import JsonView from "react18-json-view";
import { LightWasmContract } from "../interfaces/models/contracts.interface";
import { Coin } from "@keplr-wallet/types";

// Get executed contract addresses from events for a specific message index
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

// Returns the label and address if the address is found in contractInfos, otherwise just returns the address
const getContractLinkString = (address: string, contractInfos: LightWasmContract[]): string => {
    const contractInfo = contractInfos.find(ci => ci.contractAddress === address);
    if (!contractInfo) return address;
    return `${truncateStringEnd(contractInfo.label)} - ${address}`
}

const defaultSecretWasmResponse = async (msg: any, messageIndex: string, tx: LcdTxResponse, executedContracts: LightWasmContract[], messageDisplay: any, config: FrontendChainConfig): Promise<ParsedMessage> => {
    // Get the addresses of contracts called for this message
    const calledContracts = getAllExecutedContracts(tx, messageIndex, msg.contract)

    const content: ParsedMessageContent = [
        [
            'Executed Contract',
            <Link to={`/${config.id}/contracts/${msg.contract}`}>{getContractLinkString(msg.contract, executedContracts)}</Link>
        ],
        ['Sender', <Link to={`/${config.id}/accounts/${msg.sender}`}>{msg.sender}</Link>],
        ['Message', messageDisplay],
        ['Sent Funds', !msg.sent_funds?.length ? 'None' : await formatAmounts(msg.sent_funds, config)],
    ];
    if (calledContracts.length) content.push([
        'Called Contracts',
        <div className='d-flex flex-column gap-1 align-items-start'>
            {calledContracts.map(c => <Link key={c} to={`/${config.id}/contracts/${c}`}>{getContractLinkString(c, executedContracts)}</Link>)}
        </div>
    ])
    return {
        title: formatTxType(msg['@type']),
        content,
        amounts: msg.sent_funds,
    }
}

export const parseSecretWasmMessage = async (msg: any, messageIndex: string, tx: LcdTxResponse, executedContracts: LightWasmContract[], encryptionUtils: EncryptionUtils, config: FrontendChainConfig): Promise<ParsedMessage> => {
    try {
        const contractInputMsgBytes = fromBase64(msg.msg);
        const nonce = contractInputMsgBytes.slice(0, 32);
        const ciphertext = contractInputMsgBytes.slice(64);

        const plaintext = await encryptionUtils.decrypt(ciphertext, nonce);
        const _decryptedMsg = JSON.parse(fromUtf8(plaintext).slice(64)); // first 64 chars is the codeHash

        // TODO determine the type of contract from the address. For now we'll just parse some basic SNIP20 messages

        const executeFunction = Object.keys(_decryptedMsg)[0];
        const calledContracts = getAllExecutedContracts(tx, messageIndex, msg.contract);

        let parsedData: ParsedMessage = {
            title: `Execute Contract: ${formatExecuteFunction(executeFunction)}`,
            content: [
                ['Executed Contract', <Link to={`/${config.id}/contracts/${msg.contract}`}>{getContractLinkString(msg.contract, executedContracts)}</Link>],
                ['Sender', <Link to={`/${config.id}/accounts/${msg.sender}`}>{msg.sender}</Link>],
                ['Message', defaultKeyContent(_decryptedMsg)],
                ['Sent Funds', !msg.sent_funds?.length ? 'None' : await formatAmounts(msg.sent_funds, config)]
            ],
            amounts: msg.sent_funds,
        }

        // Use rust style pattern matching on the execute message. This way we shouldn't have to get the contract type for every contract
        // TODO we do still need to get the token info for tokens though
        await match(_decryptedMsg)
            .with({ deposit: { padding: P.optional(P.string) }}, async () => {
                parsedData = {
                    title: 'Execute Contract: Wrap Token',
                    content: [
                        ['Executed Contract', <Link to={`/${config.id}/contracts/${msg.contract}`}>{getContractLinkString(msg.contract, executedContracts)}</Link>],
                        ['Sender', <Link to={`/${config.id}/accounts/${msg.sender}`}>{msg.sender}</Link>],
                        ['Amount', !msg.sent_funds?.length ? 'None' : await formatAmounts(msg.sent_funds, config)]
                    ],
                    amounts: msg.sent_funds,
                }
            })
            .with({ redeem: { amount: P.string, denom: P.optional(P.string), padding: P.optional(P.string) }}, (decryptedMsg) => {
                const tokenInfo = executedContracts.find(ec => ec.contractAddress === msg.contract)?.tokenInfo;

                const amounts: Coin[] | undefined = tokenInfo ?
                    [{ denom: tokenInfo.symbol, amount: (parseInt(decryptedMsg.redeem.amount) / Math.pow(10, tokenInfo.decimals)).toLocaleString() }]
                    : undefined;

                parsedData = {
                    title: 'Execute Contract: Unwrap Token',
                    content: [
                        ['Executed Contract', <Link to={`/${config.id}/contracts/${msg.contract}`}>{getContractLinkString(msg.contract, executedContracts)}</Link>],
                        ['Sender', <Link to={`/${config.id}/accounts/${msg.sender}`}>{msg.sender}</Link>],
                    ],
                    amounts: amounts, // This is processed based on denom, as long as we don't have the token denom on file (we shouldn't), it should display correctly
                }
                if (tokenInfo) parsedData.content.push([
                    'Amount', `${(parseInt(decryptedMsg.redeem.amount) / Math.pow(10, tokenInfo.decimals)).toLocaleString()} ${tokenInfo.symbol}`
                ])
            })
            .with({ transfer: { recipient: P.string, amount: P.string, memo: P.optional(P.string), decoys: P.optional(P.array(P.string)), entropy: P.optional(P.string), padding: P.optional(P.string) }}, (decryptedMsg) => {
                parsedData = {
                    title: 'Execute Contract: Transfer Token',
                    content: [
                        ['Executed Contract', <Link to={`/${config.id}/contracts/${msg.contract}`}>{getContractLinkString(msg.contract, executedContracts)}</Link>],
                        ['Sender', <Link to={`/${config.id}/accounts/${msg.sender}`}>{msg.sender}</Link>],
                        ['Recipient', <Link to={`/${config.id}/accounts/${decryptedMsg.transfer.recipient}`}>{decryptedMsg.transfer.recipient}</Link>],
                        // TODO get amount from logs, or denom from backend?
                    ],
                    amounts: undefined, // TODO
                }
                if (decryptedMsg.transfer.memo) parsedData.content.push(['Memo', defaultKeyContent(decryptedMsg.transfer.memo)])
                if (decryptedMsg.transfer.decoys?.length) parsedData.title = 'Execute Contract: Transfer Token With Decoys'
            })
            .with({ send: { recipient: P.string, recipient_code_hash: P.optional(P.string), amount: P.string, msg: P.optional(P.string), memo: P.optional(P.string), decoys: P.optional(P.array(P.string)), entropy: P.optional(P.string), padding: P.optional(P.string) }}, (decryptedMsg) => {
                // msg is base64, decode it
                const decodedSubMsg = decryptedMsg.send.msg ? fromUtf8(fromBase64(decryptedMsg.send.msg)) : undefined;

                parsedData = {
                    title: 'Execute Contract: Send Token',
                    content: [
                        ['Executed Contract', <Link to={`/${config.id}/contracts/${msg.contract}`}>{getContractLinkString(msg.contract, executedContracts)}</Link>],
                        ['Sender', <Link to={`/${config.id}/accounts/${msg.sender}`}>{msg.sender}</Link>],
                        // For recipient, if msg is defined assume the recipient is a contract
                        [
                            'Recipient',
                            decryptedMsg.send.msg ? <Link to={`/${config.id}/contracts/${decryptedMsg.send.recipient}`}>{decryptedMsg.send.recipient}</Link>
                            : <Link to={`/${config.id}/accounts/${decryptedMsg.send.recipient}`}>{decryptedMsg.send.recipient}</Link>
                        ],
                        // TODO get amount from logs, or denom from backend?
                    ],
                    amounts: undefined, // TODO
                }

                if (decodedSubMsg) parsedData.content.push(['Message', defaultKeyContent(decodedSubMsg)])
                if (decryptedMsg.send.memo) parsedData.content.push(['Memo', defaultKeyContent(decryptedMsg.send.memo)])
                if (decryptedMsg.send.decoys?.length) parsedData.title = 'Execute Contract: Send Token With Decoys'
            })
            .with({ create_viewing_key: { entropy: P.string, padding: P.optional(P.string) }}, () => {
                parsedData = {
                    title: 'Execute Contract: Create Viewing Key',
                    content: [
                        ['Executed Contract', <Link to={`/${config.id}/contracts/${msg.contract}`}>{getContractLinkString(msg.contract, executedContracts)}</Link>],
                        ['Sender', <Link to={`/${config.id}/accounts/${msg.sender}`}>{msg.sender}</Link>],
                        // TODO decrypt tx.tx_response.data to get the set key
                    ],
                    amounts: undefined, // TODO
                }
            })
            .with({ set_viewing_key: { key: P.string, padding: P.optional(P.string) }}, (decryptedMsg) => {
                parsedData = {
                    title: 'Execute Contract: Set Viewing Key',
                    content: [
                        ['Executed Contract', <Link to={`/${config.id}/contracts/${msg.contract}`}>{getContractLinkString(msg.contract, executedContracts)}</Link>],
                        ['Sender', <Link to={`/${config.id}/accounts/${msg.sender}`}>{msg.sender}</Link>],
                        ['Key', decryptedMsg.set_viewing_key.key], // TODO hide
                    ],
                    amounts: undefined, // TODO
                }
            })
            .with({ transfer_nft: { recipient: P.string, token_id: P.string, memo: P.optional(P.string), padding: P.optional(P.string) }}, (decryptedMsg) => {
                parsedData = {
                    title: 'Execute Contract: Transfer NFT',
                    content: [
                        ['Executed Contract', <Link to={`/${config.id}/contracts/${msg.contract}`}>{getContractLinkString(msg.contract, executedContracts)}</Link>],
                        ['Sender', <Link to={`/${config.id}/accounts/${msg.sender}`}>{msg.sender}</Link>],
                        ['Recipient', <Link to={`/${config.id}/accounts/${decryptedMsg.transfer_nft.recipient}`}>{decryptedMsg.transfer_nft.recipient}</Link>],
                        ['Token ID', decryptedMsg.transfer_nft.token_id],
                    ],
                    amounts: undefined, // TODO
                }
                if (decryptedMsg.transfer_nft.memo) parsedData.content.push(['Memo', defaultKeyContent(decryptedMsg.transfer_nft.memo)])
            })
            .with({ send_nft: { contract: P.string, receiver_info: P.optional(P.any), token_id: P.string, msg: P.optional(P.string), memo: P.optional(P.string), padding: P.optional(P.string) }}, (decryptedMsg) => {
                // msg is base64, decode it
                const decodedSubMsg = decryptedMsg.send_nft.msg ? fromUtf8(fromBase64(decryptedMsg.send_nft.msg)) : undefined;

                parsedData = {
                    title: 'Execute Contract: Send NFT',
                    content: [
                        ['NFT Contract', <Link to={`/${config.id}/contracts/${msg.contract}`}>{getContractLinkString(msg.contract, executedContracts)}</Link>],
                        ['Sender', <Link to={`/${config.id}/accounts/${msg.sender}`}>{msg.sender}</Link>],
                        ['Recipient Contract', <Link to={`/${config.id}/contracts/${decryptedMsg.send_nft.contract}`}>{decryptedMsg.send_nft.contract}</Link>],
                        ['Token ID', decryptedMsg.send_nft.token_id],
                    ],
                    amounts: undefined, // TODO
                }

                if (decodedSubMsg) parsedData.content.push(['Message', defaultKeyContent(decodedSubMsg)]);
                if (decryptedMsg.send_nft.memo) parsedData.content.push(['Memo', defaultKeyContent(decryptedMsg.send_nft.memo)]);
            })
            .with({ revoke_permit: { permit_name: P.string, padding: P.optional(P.string) }}, (decryptedMsg) => {
                parsedData = {
                    title: 'Execute Contract: Revoke Permit',
                    content: [
                        ['Executed Contract', <Link to={`/${config.id}/contracts/${msg.contract}`}>{getContractLinkString(msg.contract, executedContracts)}</Link>],
                        ['Sender', <Link to={`/${config.id}/accounts/${msg.sender}`}>{msg.sender}</Link>],
                        ['Permit Name', decryptedMsg.revoke_permit.permit_name],
                    ],
                    amounts: undefined, // TODO
                }
            })
            .otherwise(() => { /* This is required for async handlers to work properly */ })

        if (calledContracts.length) parsedData.content.push([
            'Called Contracts',
            <div className='d-flex flex-column gap-1 align-items-start'>
                {calledContracts.map(c => <Link key={c} to={`/${config.id}/contracts/${c}`}>{getContractLinkString(c, executedContracts)}</Link>)}
            </div>
        ])

        return parsedData;
    } catch (e) {
        // if (encryptionUtils) console.log(`Decryption failed for message ${messageIndex} on transaction ${tx.tx_response.txhash}:`, e)
        // If decryption fails, keep showing "Encrypted"
        return defaultSecretWasmResponse(msg, messageIndex, tx, executedContracts, 'Encrypted', config);
    }
}

const formatExecuteFunction = (executeFunction: string) => {
  return executeFunction
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}