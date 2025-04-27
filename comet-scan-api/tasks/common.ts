import { TxEventAttribute } from "../interfaces/lcdTxResponse";
import { Transaction } from "../interfaces/models/transactions.interface";
import { Vote } from "../interfaces/models/votes.interface";
import Votes from "../models/votes.model";
import { importSecretWasmCode, importSecretWasmContract } from "./secretwasm.tasks";

// Loop through all msgs in a tx and perform certain actions based on message type.
// Optionally specify the list of messages to loop through to allow recursion with authz messages.
export const processTxMessages = async (tx: Transaction, msgs = tx.transaction.tx.body.messages) => {
    if (!tx.succeeded) return;

    for (const msg of msgs) {
        switch (msg['@type']) {
            case '/cosmos.gov.v1.MsgVote':
            case '/cosmos.gov.v1beta1.MsgVote': {
                await addVoteToDb(tx.chainId, tx.blockHeight, tx.timestamp, msg)
                break;
            }
            case '/cosmos.authz.v1.MsgExec':
            case '/cosmos.authz.v1beta1.MsgExec': {
                // An authz message contains an array of sub-messages that should be passed back through processTxMessages.
                // This way if an authz message contains nested authz messages, all messages are properly processed.
                const authzMsgs = msg.msgs;
                await processTxMessages(tx, authzMsgs)
            }
            case '/secret.compute.v1beta1.MsgStoreCode': {
                // Get the code ID(s) from events.
                const allEventAttributes = tx.transaction.tx_response.events.reduce(
                    (allAttributes, event) => {
                        allAttributes.push(...event.attributes);
                        return allAttributes;
                    },
                    [] as TxEventAttribute[],
                );
                const codeIdAttributes = allEventAttributes.filter(a => a.key === 'code_id');
                const codeIds = codeIdAttributes.map(a => a.value);

                // Import all the new code IDs
                for (const codeId of codeIds) {
                    await importSecretWasmCode(tx.chainId, codeId);
                }
            }
            case '/secret.compute.v1beta1.MsgInstantiateContract': {
                // Get the contract address(es) from events.
                const instantiateEvents = tx.transaction.tx_response.events.filter(e => e.type === 'instantiate');
                for (const initEvent of instantiateEvents) {
                    const contractAddress = initEvent.attributes.find(a => a.key === 'contract_address')?.value;
                    if (!contractAddress) continue;
                    // This function will also import the code if it hasn't been already
                    await importSecretWasmContract(tx.chainId, contractAddress)
                }
            }
        }
    }
}

export const addVoteToDb = async (chainId: string, blockHeight: number, timestamp: Date, voteMsg: any) => {
    const newVote: Vote = {
        chainId,
        proposalId: voteMsg.proposal_id,
        voter: voteMsg.voter,
        option: voteMsg.option,
        metadata: voteMsg.metadata || undefined,
        height: blockHeight,
        timestamp: timestamp,
    };
    // Assuming each account only votes once per block. If they vote on the same prop multiple times in a single block/tx,
    // only the last vote will be recorded in the DB, which is OK since that will be their effective vote.
    await Votes.findOneAndReplace(
        { chainId, proposalId: voteMsg.proposal_id, voter: voteMsg.voter, height: blockHeight },
        newVote,
        { upsert: true, lean: true }
    );
}