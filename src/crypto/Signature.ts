import { signature } from '@xmtp/proto'
import Long from 'long'
import * as secp from '@noble/secp256k1'
import PublicKey from './PublicKey'

// Signature represents an ECDSA signature with recovery bit.
export default class Signature implements signature.Signature {
  ecdsaCompact: signature.Signature_ECDSACompact | undefined // eslint-disable-line camelcase
  walletEcdsaCompact: signature.Signature_WalletECDSACompact | undefined // eslint-disable-line camelcase

  constructor(obj: Partial<signature.Signature>) {
    if (!obj.ecdsaCompact) {
      throw new Error('invalid signature')
    }
    if (obj.ecdsaCompact.bytes.length !== 64) {
      throw new Error(
        `invalid signature length: ${obj.ecdsaCompact.bytes.length}`
      )
    }
    this.ecdsaCompact = obj.ecdsaCompact
    if (obj.ecdsaCompact.recovery !== 0 && obj.ecdsaCompact.recovery !== 1) {
      throw new Error(`invalid recovery bit: ${obj.ecdsaCompact.recovery}`)
    }
    this.ecdsaCompact.recovery = obj.ecdsaCompact.recovery
  }

  // Return the public key that validates this signature given the provided digest.
  // Return undefined if the signature is malformed.
  getPublicKey(digest: Uint8Array): PublicKey | undefined {
    if (!this.ecdsaCompact) {
      throw new Error('invalid signature')
    }
    const bytes = secp.recoverPublicKey(
      digest,
      this.ecdsaCompact.bytes,
      this.ecdsaCompact.recovery
    )
    return bytes
      ? new PublicKey({
          secp256k1Uncompressed: { bytes },
          timestamp: Long.fromNumber(0),
        })
      : undefined
  }

  toBytes(): Uint8Array {
    return signature.Signature.encode(this).finish()
  }

  static fromBytes(bytes: Uint8Array): Signature {
    return new Signature(signature.Signature.decode(bytes))
  }
}
