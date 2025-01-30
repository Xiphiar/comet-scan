import { ReactElement } from "react";
import { FrontendChainConfig } from "../interfaces/config.interface";
import { combineCoins, stringToCoin } from "./denoms";
import { Link } from "react-router-dom";
import { formatAmounts, formatCoin, truncateString } from "./format";
import { Coin } from "../interfaces/models/blocks.interface";
import { LcdTxResponse } from "../interfaces/lcdTxResponse";
import MessageRow from "../components/MessageRow/messageRow";

export const formatTxType = (txType: string) => {
    switch(txType) {
        case '/secret.compute.v1beta1.MsgExecuteContract': return 'Execute Contract';
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
        case '/cosmos.authz.v1beta1.MsgExec': return 'Authz Execute'
        case '/ibc.core.channel.v1.MsgRecvPacket': return 'IBC Received'
        case '/canine_chain.storage.MsgPostProof': return 'Post Storage Proof'
        default: return txType;
    }
}

type Input = { "@type": string } & any;

export interface ParsedMessage {
    title: string;
    content: Array<
        [string, string | ReactElement]
    >,
    amounts: Coin[],
}

export const parseMessages = (config: FrontendChainConfig, tx: LcdTxResponse, skipExec = false): ParsedMessage[] => {
    const msgs = tx.tx.body.messages;
    const parsed: ParsedMessage[] = msgs.map((msg, i):ParsedMessage => {
        switch(msg['@type']) {

            case '/cosmos.bank.v1beta1.MsgSend': {
                return {
                    title: formatTxType(msg['@type']),
                    content: [
                        [`Amount${msg.amount.length > 1 ? 's' : ''}`, formatAmounts(msg.amount)],
                        ['From', <Link to={`/${config.id}/accounts/${msg.from_address}`}>{msg.from_address}</Link>],
                        ['To', <Link to={`/${config.id}/accounts/${msg.to_address}`}>{msg.to_address}</Link>],
                    ],
                    amounts: msg.amount,
                }
            }

            case '/secret.compute.v1beta1.MsgExecuteContract': {
                return {
                    title: formatTxType(msg['@type']),
                    content: [
                        ['Contract', <Link to={`/${config.id}/contracts/${msg.contract}`}>{msg.contract}</Link>],
                        ['Sender', <Link to={`/${config.id}/accounts/${msg.sender}`}>{msg.sender}</Link>],
                        ['Message', 'Encrypted'],
                        ['Sent Funds', !msg.sent_funds.length ? 'None' : formatAmounts(msg.sent_funds)]
                    ],
                    amounts: msg.sent_funds,
                }
            }

            case '/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward': {
                const withdrawrewardsEvents = tx.tx_response.events.filter(e => e.type === 'withdraw_rewards');
                const eventForThisMessageIndex = withdrawrewardsEvents.find(e => e.attributes.find(a => a.key === 'msg_index' && a.value === i.toString()))
                const amount = eventForThisMessageIndex?.attributes.find(a => a.key === 'amount')?.value;
                const coin = amount ? stringToCoin(amount) : undefined;
                const display = coin ? formatCoin(coin) : undefined;

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
                const display = coin ? formatCoin(coin) : undefined;

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
                        ['Amount', formatCoin(msg.amount)],
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
                        ['Amount', formatCoin(msg.amount)],
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
                        ['Amount', formatCoin(msg.amount)],
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
                        ...parseGrantType(msg.allowance)
                    ],
                    amounts: msg.allowance.spend_limit || [],
                }
            }

            case '/cosmos.authz.v1beta1.MsgExec': {
                if (skipExec) return {
                    title: formatTxType(msg['@type']),
                    content: Object.keys(msg).map(key => {
                        const value = defaultKeyContent(msg[key])
                        return [key, value]
                    }),
                    amounts: [],
                }

                const parsedSubMessages = parseMessages(config, tx, true);
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
                        ['Message', defaultKeyContent(msg.client_message)]
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

                const content: Array<[string, ReactElement | string]> = [
                    ['Sender', <Link to={`/${config.id}/accounts/${msg.sender}`}>{msg.sender}</Link>],
                    ['Receiver', msg.receiver],
                    ['Amount', formatCoin(msg.token)],
                    ['Memo', defaultKeyContent(msg.memo)],
                    ['Source Channel', defaultKeyContent(msg.source_channel)],
                    ['Source Port', defaultKeyContent(msg.source_port)],
                    ['Timeout Height', defaultKeyContent(parseInt(msg.timeout_height.revision_height).toLocaleString())],
                ]
                if (msg.timeout_timestamp !== '0') content.push(['Timeout Timestamp', new Date(parseInt(msg.timeout_timestamp) / 1000000).toLocaleString()]);

                return {
                    title: formatTxType(msg['@type']),
                    content,
                    amounts: [],
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

    })

    return parsed;
}

export const defaultKeyContent = (value: any): string => {
    if (typeof value === 'object') value = JSON.stringify(value, undefined, 2);

    if (value.length > 64) value = (
        <details className='detailsOpenHide'>
            <summary data-open="Close" data-close="Show">{truncateString(value, 30)}</summary>
            <div className='text-break'>{value}</div>
        </details>
    )

    return value
}

const parseGrantType = (allowance: {type: string} & any): [string, string | ReactElement][] => {
    switch (allowance['@type']) {
        case '/cosmos.feegrant.v1beta1.BasicAllowance': return [
            ['Type', 'Basic'],
            ['Expiration', new Date(allowance.expiration).toLocaleString()],
            ['Spend Limit', formatAmounts(allowance.spend_limit)]
        ]
        default: return [
            ['Type', allowance.type],
        ]
    }
}