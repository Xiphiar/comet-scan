/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-empty */
/* eslint-disable prefer-const */
import { AnyJson, ArrayLog, EncryptionUtils, fromBase64, fromHex, fromUtf8, IbcResponse, JsonLog, MsgExecuteContractResponse, MsgInstantiateContractResponse, TxResponse } from "secretjs";
import { Tx as TxPb } from "secretjs/dist/grpc_gateway/cosmos/tx/v1beta1/tx.pb";
import { TxResponse as TxResponsePb } from "secretjs/dist/grpc_gateway/cosmos/base/abci/v1beta1/abci.pb";
import { TxMsgData } from "secretjs/dist/protobuf/cosmos/base/abci/v1beta1/abci";
import { MsgMigrateContractResponse } from "secretjs/dist/protobuf/secret/compute/v1beta1/msg";

type ComputeMsgToNonce = { [msgIndex: number]: Uint8Array };

async function decodeTxResponse(
    encryptionUtils: EncryptionUtils,
    txResp: TxResponsePb,
  ): Promise<TxResponse> {

    const nonces: ComputeMsgToNonce = [];

    const tx = txResp.tx as TxPb;

    // Decoded input tx messages
    for (
      let i = 0;
      !isNaN(Number(tx?.body?.messages?.length)) &&
      i < Number(tx?.body?.messages?.length);
      i++
    ) {
      const msg: AnyJson = tx.body!.messages![i];

      // Check if the message needs decryption
      let contractInputMsgFieldName = "";
      if (msg["@type"] === "/secret.compute.v1beta1.MsgInstantiateContract") {
        contractInputMsgFieldName = "init_msg";
      } else if (
        msg["@type"] === "/secret.compute.v1beta1.MsgExecuteContract" ||
        msg["@type"] === "/secret.compute.v1beta1.MsgMigrateContract"
      ) {
        contractInputMsgFieldName = "msg";
      }

      if (contractInputMsgFieldName !== "") {
        // Encrypted, try to decrypt
        try {
          const contractInputMsgBytes = fromBase64(
            msg[contractInputMsgFieldName],
          );

          const nonce = contractInputMsgBytes.slice(0, 32);
          const ciphertext = contractInputMsgBytes.slice(64);

          const plaintext = await encryptionUtils.decrypt(
            ciphertext,
            nonce,
          );
          msg[contractInputMsgFieldName] = JSON.parse(
            fromUtf8(plaintext).slice(64), // first 64 chars is the codeHash as a hex string
          );

          nonces[i] = nonce; // Fill nonces array to later use it in output decryption
        } catch (decryptionError) {
          // Not encrypted or can't decrypt because not original sender
        }
      }

      tx.body!.messages![i] = msg;
    }

    let rawLog: string = txResp.raw_log!;
    let jsonLog: JsonLog = [];
    let arrayLog: ArrayLog = [];
    let ibcResponses: Array<Promise<IbcResponse>> = [];
    const events = txResp.events ?? [];
    if (txResp.code === 0 && rawLog === "") {
      for (const event of events) {
        const eventAttributes = event.attributes ?? [];
        const msgIndexAttr = eventAttributes.find(
          (attr) => attr["key"] === "msg_index",
        );
        if (!msgIndexAttr) continue;
        const msgIndex = Number(msgIndexAttr["value"]);
        for (const attr of eventAttributes) {
          if (attr.key === "msg_index") continue;
          // Try to decrypt
          if (event.type === "wasm") {
            const nonce = nonces[msgIndex];
            if (nonce && nonce.length === 32) {
              try {
                attr.key = fromUtf8(
                  await encryptionUtils.decrypt(
                    fromBase64(attr.key!),
                    nonce,
                  ),
                ).trim();
              } catch (e) {}
              try {
                attr.value = fromUtf8(
                  await encryptionUtils.decrypt(
                    fromBase64(attr.value!),
                    nonce,
                  ),
                ).trim();
              } catch (e) {}
            }
          }

          const entryToPush = {
            msg: msgIndex,
            type: event.type!,
            key: attr.key!,
            value: attr.value!,
          };
          if (
            !arrayLog.find(
              (entry) => JSON.stringify(entry) === JSON.stringify(entryToPush),
            )
          ) {
            arrayLog.push(entryToPush);
          }
          const jsonLogMsgIndexEntry = jsonLog?.find(
            (log) => log.msg_index === msgIndex,
          );
          if (!jsonLogMsgIndexEntry) {
            jsonLog.push({
              msg_index: msgIndex,
              events: [
                {
                  type: event.type!,
                  attributes: [
                    {
                      key: attr.key!,
                      value: attr.value!,
                    },
                  ],
                },
              ],
            });
          } else {
            const jsonLogEventEntry = jsonLogMsgIndexEntry.events.find(
              (log) => log.type === event.type!,
            );
            if (!jsonLogEventEntry) {
              jsonLogMsgIndexEntry.events.push({
                type: event.type!,
                attributes: [
                  {
                    key: attr.key!,
                    value: attr.value!,
                  },
                ],
              });
            } else {
              const attributeToPush = {
                key: attr.key!,
                value: attr.value!,
              };
              if (
                !jsonLogEventEntry.attributes.find(
                  (entry) =>
                    JSON.stringify(entry) === JSON.stringify(attributeToPush),
                )
              ) {
                jsonLogEventEntry.attributes.push(attributeToPush);
              }
            }
          }
        }
      }
    } else if (txResp.code !== 0 && rawLog !== "") {
      try {
        const errorMessageRgx =
          /; message index: (\d+):(?: dispatch: submessages:)* encrypted: (.+?): (?:instantiate|execute|query|reply to|migrate) contract failed/g;
        const rgxMatches = errorMessageRgx.exec(rawLog);
        if (rgxMatches?.length === 3) {
          const encryptedError = fromBase64(rgxMatches[2]);
          const msgIndex = Number(rgxMatches[1]);

          const decryptedBase64Error = await encryptionUtils.decrypt(
            encryptedError,
            nonces[msgIndex],
          );

          const decryptedError = fromUtf8(decryptedBase64Error);

          rawLog = rawLog.replace(
            `encrypted: ${rgxMatches[2]}`,
            decryptedError,
          );

          try {
            jsonLog = JSON.parse(decryptedError);
          } catch (e) {}
        }
      } catch (decryptionError) {
        // Not encrypted or can't decrypt because not original sender
      }
    }

    const txMsgData = TxMsgData.decode(fromHex(txResp.data!));
    const data = new Array<Uint8Array>(txMsgData.msg_responses.length);

    for (
      let msgIndex = 0;
      msgIndex < txMsgData.msg_responses.length;
      msgIndex++
    ) {
      data[msgIndex] = txMsgData.msg_responses[msgIndex].value;

      const nonce = nonces[msgIndex];
      if (nonce && nonce.length === 32) {
        // Check if the output data needs decryption

        try {
          const { "@type": type_url } = tx.body!.messages![msgIndex] as AnyJson;

          if (type_url === "/secret.compute.v1beta1.MsgInstantiateContract") {
            const decoded = MsgInstantiateContractResponse.decode(
              txMsgData.msg_responses[msgIndex].value,
            );
            const decrypted = fromBase64(
              fromUtf8(await encryptionUtils.decrypt(decoded.data, nonce)),
            );
            data[msgIndex] = MsgInstantiateContractResponse.encode({
              address: decoded.address,
              data: decrypted,
            }).finish();
          } else if (
            type_url === "/secret.compute.v1beta1.MsgExecuteContract"
          ) {
            const decoded = MsgExecuteContractResponse.decode(
              txMsgData.msg_responses[msgIndex].value,
            );
            const decrypted = fromBase64(
              fromUtf8(await encryptionUtils.decrypt(decoded.data, nonce)),
            );
            data[msgIndex] = MsgExecuteContractResponse.encode({
              data: decrypted,
            }).finish();
          } else if (
            type_url === "/secret.compute.v1beta1.MsgMigrateContract"
          ) {
            const decoded = MsgMigrateContractResponse.decode(
              txMsgData.msg_responses[msgIndex].value,
            );
            const decrypted = fromBase64(
              fromUtf8(await encryptionUtils.decrypt(decoded.data, nonce)),
            );
            data[msgIndex] = MsgMigrateContractResponse.encode({
              data: decrypted,
            }).finish();
          }
        } catch (decryptionError) {
          // Not encrypted or can't decrypt because not original sender
        }
      }
    }

    return {
      height: Number(txResp.height),
      timestamp: txResp.timestamp!,
      transactionHash: txResp.txhash!,
      code: txResp.code!,
      codespace: txResp.codespace!,
      info: txResp.info!,
      tx,
      rawLog,
      jsonLog,
      arrayLog,
      events: txResp.events!,
      data,
      gasUsed: Number(txResp.gas_used),
      gasWanted: Number(txResp.gas_wanted),
      ibcResponses,
    };
}

export default decodeTxResponse;