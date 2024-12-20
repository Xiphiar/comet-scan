import { sha256 } from "@cosmjs/crypto"
import RIPEMD160 from 'ripemd160'
import { fromBech32, fromBase64, fromHex, toHex } from "@cosmjs/encoding"

export function consensusPubkeyToHexAddress(consensusPubkey: any) {
    let raw = null
    if (typeof consensusPubkey === 'object') {
      if (consensusPubkey['@type'] === '/cosmos.crypto.ed25519.PubKey') {
        // raw = toBase64(fromHex(toHex(sha256(fromBase64(consensusPubkey.key))).slice(0, 40)))
        raw = toHex(sha256(fromBase64(consensusPubkey.key))).slice(0, 40).toUpperCase()
        return raw
      }
      // /cosmos.crypto.secp256k1.PubKey
      if (consensusPubkey['@type'] === '/cosmos.crypto.secp256k1.PubKey') {
        raw = new RIPEMD160().update(Buffer.from(sha256(fromBase64(consensusPubkey.key)))).digest('hex')
        return raw
      }
      if (consensusPubkey.type === 'tendermint/PubKeySecp256k1') {
        raw = new RIPEMD160().update(Buffer.from(sha256(fromBase64(consensusPubkey.value)))).digest('hex').toUpperCase()
        return raw
      }
      raw = sha256(fromBase64(consensusPubkey.value))
    } else {
      raw = sha256(fromHex(toHex(fromBech32(consensusPubkey).data).toUpperCase().replace('1624DE6420', '')))
    }
    const address = toHex(raw).slice(0, 40).toUpperCase()
    return address
  }