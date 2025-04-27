import { ReactElement } from "react";
import { FrontendChainConfig } from "../interfaces/config.interface";
import { combineCoins, stringToCoin } from "./denoms";
import { Link } from "react-router-dom";
import { formatAmounts, formatCoin, truncateString } from "./format";
import { Coin } from "../interfaces/models/blocks.interface";
import { LcdTxResponse } from "../interfaces/lcdTxResponse";
import MessageRow from "../components/MessageRow/messageRow";
import { fromBase64, fromUtf8, EncryptionUtils } from "secretjs";
import { parseSecretWasmMessage } from "./secretWasmMessageParsing";
import { fromBech32 } from "@cosmjs/encoding";
import JsonView from "react18-json-view";
import { LightWasmContract } from "../interfaces/models/contracts.interface";

export const formatTxType = (txType: string) => {
    switch(txType) {
        case '/secret.compute.v1beta1.MsgExecuteContract': return 'Execute Contract';
        case '/secret.compute.v1beta1.MsgInstantiateContract': return 'Instantiate Contract';
        case '/secret.compute.v1beta1.MsgStoreCode': return 'Store Code';
        case '/cosmwasm.wasm.v1.MsgExecuteContract': return 'Execute Contract';
        case '/ibc.core.client.v1.MsgUpdateClient': return 'Update IBC Client';
        case '/ibc.core.channel.v1.MsgAcknowledgement': return 'IBC Packet Acknowledgement';
        case '/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward': return 'Claim Rewards';
        case '/cosmos.staking.v1beta1.MsgDelegate': return 'Delegate';
        case '/cosmos.bank.v1beta1.MsgSend': return 'Send Coins';
        case '/cosmos.gov.v1beta1.MsgSubmitProposal': return 'Submit Proposal';
        case '/cosmos.gov.v1.MsgSubmitProposal': return 'Submit Proposal';
        case '/cosmos.staking.v1beta1.MsgUndelegate': return 'Undelegate';
        case '/cosmos.staking.v1beta1.MsgBeginRedelegate': return 'Redelegate';
        case '/cosmos.feegrant.v1beta1.MsgGrantAllowance': return 'Grant Fee Allowance'
        case '/ibc.core.channel.v1.MsgTimeout': return 'IBC Timeout'
        case '/ibc.applications.transfer.v1.MsgTransfer': return 'IBC Transfer'
        case '/cosmos.distribution.v1beta1.MsgWithdrawValidatorCommission': return 'Withdraw Validator Commission'
        case '/cosmos.authz.v1.MsgExec': return 'Authz Execute'
        case '/cosmos.authz.v1beta1.MsgExec': return 'Authz Execute'
        case '/ibc.core.channel.v1.MsgRecvPacket': return 'IBC Received'
        case '/canine_chain.storage.MsgPostProof': return 'Post Storage Proof'
        default: return txType;
    }
}

type Input = { "@type": string } & any;

export type ParsedMessageContent = Array<
    [string, string | ReactElement]
>;

export interface ParsedMessage {
    title: string;
    content: ParsedMessageContent;
    amounts: Coin[];
}

export const parseMessages = async (config: FrontendChainConfig, allConfigs: FrontendChainConfig[], tx: LcdTxResponse, executedContracts: LightWasmContract[], encryptionUtils?: EncryptionUtils, skipExec = false): Promise<ParsedMessage[]> => {
    const msgs = tx.tx.body.messages;
    const parsed = await Promise.all(msgs.map(async (msg, i):Promise<ParsedMessage> => {
        switch(msg['@type']) {

            case '/cosmos.bank.v1beta1.MsgSend': {
                return {
                    title: formatTxType(msg['@type']),
                    content: [
                        [`Amount${msg.amount.length > 1 ? 's' : ''}`, await formatAmounts(msg.amount, config)],
                        ['From', <Link to={`/${config.id}/accounts/${msg.from_address}`}>{msg.from_address}</Link>],
                        ['To', <Link to={`/${config.id}/accounts/${msg.to_address}`}>{msg.to_address}</Link>],
                    ],
                    amounts: msg.amount,
                }
            }

            case '/cosmwasm.wasm.v1.MsgExecuteContract': {
                return {
                    title: formatTxType(msg['@type']),
                    content: [
                        ['Contract', <Link to={`/${config.id}/contracts/${msg.contract}`}>{msg.contract}</Link>],
                        ['Sender', <Link to={`/${config.id}/accounts/${msg.sender}`}>{msg.sender}</Link>],
                        ['Sent Funds', !msg.sent_funds?.length ? 'None' : await formatAmounts(msg.sent_funds, config)],
                        ['Message', defaultKeyContent(msg.msg)],
                    ],
                    amounts: msg.sent_funds,
                }
            }

            case '/secret.compute.v1beta1.MsgExecuteContract': {
                return parseSecretWasmMessage(msg, i.toString(), tx, executedContracts, config, encryptionUtils);
            }

            case '/secret.compute.v1beta1.MsgInstantiateContract': {
                let initMsgDisplay: string | ReactElement = 'Encrypted';
                if (encryptionUtils) {
                    initMsgDisplay = await decryptSecretMessage(msg.init_msg, encryptionUtils);
                }

                // Find the contract address from events
                const instantiateEvent = tx.tx_response.events.find(event => 
                    event.type === 'instantiate' && 
                    event.attributes.some(attr => 
                        attr.key === 'contract_address' && 
                        event.attributes.some(a => a.key === 'msg_index' && a.value === i.toString())
                    )
                );
                const contractAddress = instantiateEvent?.attributes.find(attr => attr.key === 'contract_address')?.value;

                const content: Array<[string, string | ReactElement]> = [
                    ['Code ID', <Link to={`/${config.id}/codes/${msg.code_id}`}>{msg.code_id}</Link>],
                    ['Label', msg.label],
                    ['Sender', <Link to={`/${config.id}/accounts/${msg.sender}`}>{msg.sender}</Link>],
                    ['Admin', msg.admin ? <Link to={`/${config.id}/accounts/${msg.admin}`}>{msg.admin}</Link> : 'None'],
                    ['Init Message', initMsgDisplay],
                    ['Init Funds', !msg.init_funds?.length ? 'None' : await formatAmounts(msg.init_funds, config)]
                ];

                if (contractAddress) {
                    content.push(['Contract Address', <Link to={`/${config.id}/contracts/${contractAddress}`}>{contractAddress}</Link>]);
                }

                return {
                    title: formatTxType(msg['@type']),
                    content,
                    amounts: msg.init_funds,
                }
            }

            case '/secret.compute.v1beta1.MsgStoreCode': {
                const wasmSizeBytes = Math.ceil(msg.wasm_byte_code.length * 0.75); // base64 to bytes conversion
                const wasmSizeKB = wasmSizeBytes / 1024;
                const sizeDisplay = wasmSizeBytes < 1024 
                    ? `${wasmSizeBytes} bytes`
                    : `${wasmSizeKB.toFixed(2)} KB`;

                // Find the code_id from events
                const codeIdEvent = tx.tx_response.events.find(event => 
                    event.type === 'message' && 
                    event.attributes.some(attr => 
                        attr.key === 'code_id' && 
                        event.attributes.some(a => a.key === 'msg_index' && a.value === i.toString())
                    )
                );
                const codeId = codeIdEvent?.attributes.find(attr => attr.key === 'code_id')?.value;

                const content: Array<[string, string | ReactElement]> = [
                    ['Sender', <Link to={`/${config.id}/accounts/${msg.sender}`}>{msg.sender}</Link>],
                    ['WASM Size', sizeDisplay],
                    ['Builder', msg.builder || 'None'],
                    ['Source', msg.source || 'None']
                ];

                if (codeId) {
                    content.push(['Code ID', <Link to={`/${config.id}/codes/${codeId}`}>{codeId}</Link>]);
                }

                return {
                    title: formatTxType(msg['@type']),
                    content,
                    amounts: [],
                }
            }

            case '/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward': {
                const withdrawrewardsEvents = tx.tx_response.events.filter(e => e.type === 'withdraw_rewards');
                const eventForThisMessageIndex = withdrawrewardsEvents.find(e => e.attributes.find(a => a.key === 'msg_index' && a.value === i.toString()))
                const amount = eventForThisMessageIndex?.attributes.find(a => a.key === 'amount')?.value;
                const coin = amount ? stringToCoin(amount) : undefined;
                const display = coin ? await formatCoin(coin, config) : undefined;

                const content: Array<[string, string |ReactElement]> = [
                    ['Delegator', <Link to={`/${config.id}/accounts/${msg.delegator_address}`}>{msg.delegator_address}</Link>],
                    ['Validator', <Link to={`/${config.id}/validators/${msg.validator_address}`}>{msg.validator_address}</Link>], // TODO display validator moniker and image
                ]
                if (display) content.push(['Amount', display])
                return {
                    title: formatTxType(msg['@type']),
                    content: content,
                    amounts: coin ? [coin] : [],
                }
            }

            case '/cosmos.distribution.v1beta1.MsgWithdrawValidatorCommission': {
                const withdrawCommissionEvents = tx.tx_response.events.filter(e => e.type === 'withdraw_commission');
                const eventForThisMessageIndex = withdrawCommissionEvents.find(e => e.attributes.find(a => a.key === 'msg_index' && a.value === i.toString()))
                const amount = eventForThisMessageIndex?.attributes.find(a => a.key === 'amount')?.value;
                const coin = amount ? stringToCoin(amount) : undefined;
                const display = coin ? await formatCoin(coin, config) : undefined;

                const content: Array<[string, string |ReactElement]> = [
                    ['Validator', <Link to={`/${config.id}/validators/${msg.validator_address}`}>{msg.validator_address}</Link>], // TODO display validator moniker and image
                ]
                if (display) content.push(['Amount', display])
                return {
                    title: formatTxType(msg['@type']),
                    content: content,
                    amounts: coin ? [coin] : [],
                }
            }

            case '/cosmos.staking.v1beta1.MsgDelegate': {
                return {
                    title: formatTxType(msg['@type']),
                    content: [
                        ['Delegator', <Link to={`/${config.id}/accounts/${msg.delegator_address}`}>{msg.delegator_address}</Link>],
                        ['Validator', <Link to={`/${config.id}/validators/${msg.validator_address}`}>{msg.validator_address}</Link>], // TODO display validator moniker and image
                        ['Amount', await formatCoin(msg.amount, config)],
                    ],
                    amounts: [msg.amount]
                }
            }

            case '/cosmos.staking.v1beta1.MsgUndelegate': {
                return {
                    title: formatTxType(msg['@type']),
                    content: [
                        ['Delegator', <Link to={`/${config.id}/accounts/${msg.delegator_address}`}>{msg.delegator_address}</Link>],
                        ['Validator', <Link to={`/${config.id}/validators/${msg.validator_address}`}>{msg.validator_address}</Link>], // TODO display validator moniker and image
                        ['Amount', await formatCoin(msg.amount, config)],
                    ],
                    amounts: [msg.amount],
                }
            }

            case '/cosmos.staking.v1beta1.MsgBeginRedelegate': {
                return {
                    title: formatTxType(msg['@type']),
                    content: [
                        ['Delegator', <Link to={`/${config.id}/accounts/${msg.delegator_address}`}>{msg.delegator_address}</Link>],
                        ['Old Validator', <Link to={`/${config.id}/validators/${msg.validator_src_address}`}>{msg.validator_src_address}</Link>], // TODO display validator moniker and image
                        ['New Validator', <Link to={`/${config.id}/validators/${msg.validator_dst_address}`}>{msg.validator_dst_address}</Link>], // TODO display validator moniker and image
                        ['Amount', await formatCoin(msg.amount, config)],
                    ],
                    amounts: [msg.amount],
                }
            }

            case '/cosmos.feegrant.v1beta1.MsgGrantAllowance': {
                return {
                    title: formatTxType(msg['@type']),
                    content: [
                        ['Granter', <Link to={`/${config.id}/accounts/${msg.granter}`}>{msg.granter}</Link>],
                        ['Grant Recipient', <Link to={`/${config.id}/accounts/${msg.grantee}`}>{msg.grantee}</Link>],
                        ...await parseGrantType(msg.allowance, config)
                    ],
                    amounts: msg.allowance.spend_limit || [],
                }
            }

            case '/cosmos.authz.v1.MsgExec':
            case '/cosmos.authz.v1beta1.MsgExec': {
                if (skipExec) return {
                    title: formatTxType(msg['@type']),
                    content: Object.keys(msg).map(key => {
                        const value = defaultKeyContent(msg[key])
                        return [key, value]
                    }),
                    amounts: [],
                }

                const parsedSubMessages = await parseMessages(config, allConfigs, tx, executedContracts, encryptionUtils, true);
                const allAmounts = combineCoins(parsedSubMessages.map(m => m.amounts));
                return {
                    title: formatTxType(msg['@type']),
                    content: [
                        ['Sender', <Link to={`/${config.id}/accounts/${msg.grantee}`}>{msg.grantee}</Link>],
                        [
                            'Messages',
                            <div className='d-flex flex-column gap-1'>
                                {parsedSubMessages.map((msg, i) =>
                                    <MessageRow message={msg} messageIndex={i} key={`${msg.title}${i}`} />
                                )}
                            </div>
                        ]
                    ],
                    amounts: allAmounts,
                }
            }

            case '/ibc.core.client.v1.MsgUpdateClient': {
                return {
                    title: formatTxType(msg['@type']),
                    content: [
                        ['Signer', <Link to={`/${config.id}/accounts/${msg.signer}`}>{msg.signer}</Link>],
                        ['Client ID', msg.client_id],
                        // ['Message', defaultKeyContent(msg.client_message)] // Doesn't seem to be on all messages of this type???
                    ],
                    amounts: [],
                }
            }

            case '/ibc.core.channel.v1.MsgTimeout': {
                return {
                    title: formatTxType(msg['@type']),
                    content: [
                        ['Signer', <Link to={`/${config.id}/accounts/${msg.signer}`}>{msg.signer}</Link>],
                        ['Next Sequence', defaultKeyContent(msg.next_sequence_recv)],
                        ['Packet', defaultKeyContent(msg.packet)],
                        ['Proof Height', defaultKeyContent(msg.proof_height)],
                        ['Proof Unreceived', defaultKeyContent(msg.proof_unreceived)],
                    ],
                    amounts: [],
                }
            }

            case '/ibc.applications.transfer.v1.MsgTransfer': {
                // TODO determine if receiver is on a chain we support, and link to that account
                // TODO once we index IBC, show destination chain info

                let receiver: string | ReactElement = msg.receiver;

                // If a mainnet chain, check and see of the receiver is on a chain we support
                if (!config.isTestnet) {
                    // Get prefix from receiver address
                    const prefix = fromBech32(msg.receiver).prefix;

                    // Try to find a mainnet chain in the config with this prefix
                    const c = allConfigs.filter(c => !c.isTestnet && c.prefix === prefix);

                    // If we found only 1 matching chain, display a link to the account on that chain
                    // Maybe if we start indexing IBC channels in the future, we could do this with testnet chains too
                    if (c.length === 1) receiver = <Link to={`/${c[0].id}/accounts/${msg.receiver}`}>{msg.receiver}</Link>
                }

                const content: Array<[string, ReactElement | string]> = [
                    ['Sender', <Link to={`/${config.id}/accounts/${msg.sender}`}>{msg.sender}</Link>],
                    ['Receiver', receiver],
                    ['Amount', await formatCoin(msg.token, config)],
                    ['Memo', defaultKeyContent(msg.memo)],
                    ['Source Channel', defaultKeyContent(msg.source_channel)],
                    ['Source Port', defaultKeyContent(msg.source_port)],
                    ['Timeout Height', defaultKeyContent(parseInt(msg.timeout_height.revision_height).toLocaleString())],
                ]
                if (msg.timeout_timestamp !== '0') content.push(['Timeout Timestamp', new Date(parseInt(msg.timeout_timestamp) / 1000000).toLocaleString()]);

                return {
                    title: formatTxType(msg['@type']),
                    content,
                    amounts: [msg.token],
                }
            }

            case '/ibc.core.channel.v1.MsgRecvPacket_': {
                return {
                    title: formatTxType(msg['@type']),
                    content: [
                        ['Signer', <Link to={`/${config.id}/accounts/${msg.signer}`}>{msg.signer}</Link>],
                        ['Packet', defaultKeyContent(msg.packet)],
                        ['Proof Commitment', defaultKeyContent(msg.proof_commitment)],
                        ['Proof Height', parseInt(msg.proof_height.revision_height).toLocaleString()],
                    ],
                    amounts: [],
                }
            }

            case '/canine_chain.storage.MsgPostProof': {
                return {
                    title: formatTxType(msg['@type']),
                    content: [
                        ['Creator', <Link to={`/${config.id}/accounts/${msg.creator}`}>{msg.creator}</Link>],
                        ['Owner', defaultKeyContent(msg.owner)],
                        ['Hash List', defaultKeyContent(msg.hash_list)],
                        ['Item', defaultKeyContent(msg.item)],
                        ['Merkle', defaultKeyContent(msg.merkle)],
                        ['Start', defaultKeyContent(msg.start)],
                        ['To Prove', defaultKeyContent(msg.to_prove)],
                    ],
                    amounts: [],
                }
            }

            default: {
                // console.log('Unknown message type', msg['@type'], JSON.stringify(msg, null, 2));
                return {
                    title: formatTxType(msg['@type']),
                    content: Object.keys(msg).map(key => {
                        const value = defaultKeyContent(msg[key])
                        return [key, value]
                    }),
                    amounts: [],
                }
            }
        }

    }))

    return parsed;
}

export const isJson = (str: string): boolean => {
    try {
        JSON.parse(str);
        return true;
    } catch {
        return false;
    }
}

export const maybeParseJson = (str: string): any | undefined => {
    try {
        return JSON.parse(str);
    } catch {
        return undefined;
    }
}

export const defaultKeyContent = (value: any): string | ReactElement => {
    if (!value) {
        console.log('NO VALUE', value);
        return value || '';
    }
    // if (typeof value === 'object') value = JSON.stringify(value, undefined, 2);
    if (typeof value === 'object') return <JsonView src={value} />
    if (isJson(value)) return <JsonView src={JSON.parse(value)} />

    if (value.length > 64) return (
        <details className='detailsOpenHide'>
            <summary data-open="Close" data-close="Show">{truncateString(value, 30)}</summary>
            <div className='text-break'>{value}</div>
        </details>
    )

    return value
}

const parseGrantType = async (allowance: {type: string} & any, config: FrontendChainConfig): Promise<[string, string | ReactElement][]> => {
    switch (allowance['@type']) {
        case '/cosmos.feegrant.v1beta1.BasicAllowance': return [
            ['Type', 'Basic'],
            ['Expiration', new Date(allowance.expiration).toLocaleString()],
            ['Spend Limit', await formatAmounts(allowance.spend_limit, config)]
        ]
        default: return [
            ['Type', allowance.type],
        ]
    }
}

const decryptSecretMessage = async (encryptedMsg: string, encryptionUtils: EncryptionUtils): Promise<string | ReactElement> => {
    try {
        const contractInputMsgBytes = fromBase64(encryptedMsg);
        const nonce = contractInputMsgBytes.slice(0, 32);
        const ciphertext = contractInputMsgBytes.slice(64);

        const plaintext = await encryptionUtils.decrypt(ciphertext, nonce);
        const decryptedMsg = JSON.parse(fromUtf8(plaintext).slice(64)); // first 64 chars is the codeHash
        return defaultKeyContent(decryptedMsg);
    } catch (e) {
        // If decryption fails, keep showing "Encrypted"
        return 'Encrypted';
    }
}