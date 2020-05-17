/**
 * Signature
 * =========
 *
 * A signature is the thing you make when you want to sign a transaction, or
 * the thing you want to verify if you want to ensure that someone signed a
 * transaction. It has an r and s value, which are the cryptographic big
 * numbers that define a signature. And since this is a bitcoin library, it
 * also has nHashType, which is the way to hash a transaction and is used in
 * the binary format of a signature when it is in a transaction. We also
 * support a public key recover value, recovery, allowing one to compute the
 * public key from a signature. The "compressed" value is also necessary to
 * accurately compute the public key from a signature.
 *
 * There are a few different formats of a signature in bitcoin. One is DER, the
 * other is the TxFormat which is the same as DER but with the nHashType byte
 * appended, and the final one is Compact, which is used by Bitcoin Signed
 * Message (Bsm).
 */
'use strict'

import { Bn } from './bn'
import { Struct } from './struct'

/**
   * r, s: big numbers constiting a cryptographic signature
   * nHashType: found at the end of a signature in a transaction
   * recovery: public key recovery number
   * compressed: whether the recovered pubKey is compressed
   */
class Sig extends Struct {
  constructor (r, s, nHashType, recovery, compressed) {
    super({ r, s, nHashType, recovery, compressed })
  }

  fromBuffer (buf) {
    try {
      return this.fromDer(buf, true)
    } catch (e) {}
    try {
      return this.fromCompact(buf)
    } catch (e) {}
    return this.fromTxFormat(buf)
  }

  toBuffer () {
    if (this.nHashType !== undefined) {
      return this.toTxFormat()
    } else if (this.recovery !== undefined) {
      return this.toCompact()
    }
    return this.toDer()
  }

  // The format used by "message"
  fromCompact (buf) {
    let compressed = true
    let recovery = buf.slice(0, 1)[0] - 27 - 4
    if (recovery < 0) {
      compressed = false
      recovery = recovery + 4
    }

    if (
      !(recovery === 0 || recovery === 1 || recovery === 2 || recovery === 3)
    ) {
      throw new Error('i must be 0, 1, 2, or 3')
    }

    this.compressed = compressed
    this.recovery = recovery

    const rsbuf = buf.slice(1)
    this.fromRS(rsbuf)

    return this
  }

  static fromCompact (buf) {
    return new this().fromCompact(buf)
  }

  fromRS (rsbuf) {
    const b2 = rsbuf.slice(0, 32)
    const b3 = rsbuf.slice(32, 64)
    if (b2.length !== 32) {
      throw new Error('r must be 32 bytes')
    }
    if (b3.length !== 32 || rsbuf.length > 64) {
      throw new Error('s must be 32 bytes')
    }
    this.r = new Bn().fromBuffer(b2)
    this.s = new Bn().fromBuffer(b3)
    return this
  }

  static fromRS (rsbuf) {
    return new this().fromRS(rsbuf)
  }

  // The format used in a tx, except without the nHashType at the end
  fromDer (buf, strict) {
    const obj = Sig.parseDer(buf, strict)
    this.r = obj.r
    this.s = obj.s

    return this
  }

  static fromDer (buf, strict) {
    return new this().fromDer(buf, strict)
  }

  // The format used in a tx
  fromTxFormat (buf) {
    if (buf.length === 0) {
      // allow setting a "blank" signature
      this.r = new Bn(1)
      this.s = new Bn(1)
      this.nHashType = 1
      return this
    }
    const nHashType = buf.readUInt8(buf.length - 1)
    const derbuf = buf.slice(0, buf.length - 1)
    this.fromDer(derbuf, false)
    this.nHashType = nHashType
    return this
  }

  static fromTxFormat (buf) {
    return new this().fromTxFormat(buf)
  }

  fromString (str) {
    return this.fromHex(str)
  }

  /**
     * In order to mimic the non-strict DER encoding of OpenSSL, set strict = false.
     */
  static parseDer (buf, strict) {
    if (strict === undefined) {
      strict = true
    }

    if (!Buffer.isBuffer(buf)) {
      throw new Error('DER formatted signature should be a buffer')
    }

    const header = buf[0]

    if (header !== 0x30) {
      throw new Error('Header byte should be 0x30')
    }

    let length = buf[1]
    const buflength = buf.slice(2).length
    if (strict && length !== buflength) {
      throw new Error('LEngth byte should length of what follows')
    } else {
      length = length < buflength ? length : buflength
    }

    const rheader = buf[2 + 0]
    if (rheader !== 0x02) {
      throw new Error('Integer byte for r should be 0x02')
    }

    const rlength = buf[2 + 1]
    const rbuf = buf.slice(2 + 2, 2 + 2 + rlength)
    const r = new Bn().fromBuffer(rbuf)
    const rneg = buf[2 + 1 + 1] === 0x00
    if (rlength !== rbuf.length) {
      throw new Error('LEngth of r incorrect')
    }

    const sheader = buf[2 + 2 + rlength + 0]
    if (sheader !== 0x02) {
      throw new Error('Integer byte for s should be 0x02')
    }

    const slength = buf[2 + 2 + rlength + 1]
    const sbuf = buf.slice(2 + 2 + rlength + 2, 2 + 2 + rlength + 2 + slength)
    const s = new Bn().fromBuffer(sbuf)
    const sneg = buf[2 + 2 + rlength + 2 + 2] === 0x00
    if (slength !== sbuf.length) {
      throw new Error('LEngth of s incorrect')
    }

    const sumlength = 2 + 2 + rlength + 2 + slength
    if (length !== sumlength - 2) {
      throw new Error('LEngth of signature incorrect')
    }

    const obj = {
      header: header,
      length: length,
      rheader: rheader,
      rlength: rlength,
      rneg: rneg,
      rbuf: rbuf,
      r: r,
      sheader: sheader,
      slength: slength,
      sneg: sneg,
      sbuf: sbuf,
      s: s
    }

    return obj
  }

  /**
     * This function is translated from bitcoind's IsDERSignature and is used in
     * the script interpreter.  This "DER" format actually includes an extra byte,
     * the nHashType, at the end. It is really the tx format, not DER format.
     *
     * A canonical signature exists of: [30] [total len] [02] [len R] [R] [02] [len S] [S] [hashtype]
     * Where R and S are not negative (their first byte has its highest bit not set), and not
     * excessively padded (do not start with a 0 byte, unless an otherwise negative number follows,
     * in which case a single 0 byte is necessary and even required).
     *
     * See https://bitcointalk.org/index.php?topic=8392.msg127623#msg127623
     */
  static IsTxDer (buf) {
    if (buf.length < 9) {
      //  Non-canonical signature: too short
      return false
    }
    if (buf.length > 73) {
      // Non-canonical signature: too long
      return false
    }
    if (buf[0] !== 0x30) {
      //  Non-canonical signature: wrong type
      return false
    }
    if (buf[1] !== buf.length - 3) {
      //  Non-canonical signature: wrong length marker
      return false
    }
    const nLEnR = buf[3]
    if (5 + nLEnR >= buf.length) {
      //  Non-canonical signature: S length misplaced
      return false
    }
    const nLEnS = buf[5 + nLEnR]
    if (nLEnR + nLEnS + 7 !== buf.length) {
      //  Non-canonical signature: R+S length mismatch
      return false
    }

    const R = buf.slice(4)
    if (buf[4 - 2] !== 0x02) {
      //  Non-canonical signature: R value type mismatch
      return false
    }
    if (nLEnR === 0) {
      //  Non-canonical signature: R length is zero
      return false
    }
    if (R[0] & 0x80) {
      //  Non-canonical signature: R value negative
      return false
    }
    if (nLEnR > 1 && R[0] === 0x00 && !(R[1] & 0x80)) {
      //  Non-canonical signature: R value excessively padded
      return false
    }

    const S = buf.slice(6 + nLEnR)
    if (buf[6 + nLEnR - 2] !== 0x02) {
      //  Non-canonical signature: S value type mismatch
      return false
    }
    if (nLEnS === 0) {
      //  Non-canonical signature: S length is zero
      return false
    }
    if (S[0] & 0x80) {
      //  Non-canonical signature: S value negative
      return false
    }
    if (nLEnS > 1 && S[0] === 0x00 && !(S[1] & 0x80)) {
      //  Non-canonical signature: S value excessively padded
      return false
    }
    return true
  }

  /**
     * Compares to bitcoind's IsLowDERSignature
     * See also Ecdsa signature algorithm which enforces this.
     * See also Bip 62, "low S values in signatures"
     */
  hasLowS () {
    if (
      this.s.lt(1) ||
        this.s.gt(
          Bn.fromBuffer(
            Buffer.from(
              '7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A0',
              'hex'
            )
          )
        )
    ) {
      return false
    }
    return true
  }

  /**
     * Ensures the nHashType is exactly equal to one of the standard options or combinations thereof.
     * Translated from bitcoind's IsDefinedHashtypeSignature
     */
  hasDefinedHashType () {
    if (
      this.nHashType < Sig.SIGHASH_ALL ||
        this.nHashType > Sig.SIGHASH_SINGLE
    ) {
      return false
    }
    return true
  }

  toCompact (recovery, compressed) {
    recovery = typeof recovery === 'number' ? recovery : this.recovery
    compressed =
        typeof compressed === 'boolean' ? compressed : this.compressed

    if (
      !(recovery === 0 || recovery === 1 || recovery === 2 || recovery === 3)
    ) {
      throw new Error('recovery must be equal to 0, 1, 2, or 3')
    }

    let val = recovery + 27 + 4
    if (compressed === false) {
      val = val - 4
    }
    const b1 = Buffer.from([val])
    const b2 = this.r.toBuffer({ size: 32 })
    const b3 = this.s.toBuffer({ size: 32 })
    return Buffer.concat([b1, b2, b3])
  }

  toRS () {
    return Buffer.concat([
      this.r.toBuffer({ size: 32 }),
      this.s.toBuffer({ size: 32 })
    ])
  }

  toDer () {
    const rnbuf = this.r.toBuffer()
    const snbuf = this.s.toBuffer()

    const rneg = rnbuf[0] & 0x80
    const sneg = snbuf[0] & 0x80

    const rbuf = rneg ? Buffer.concat([Buffer.from([0x00]), rnbuf]) : rnbuf
    const sbuf = sneg ? Buffer.concat([Buffer.from([0x00]), snbuf]) : snbuf

    const length = 2 + rbuf.length + 2 + sbuf.length
    const rlength = rbuf.length
    const slength = sbuf.length
    const rheader = 0x02
    const sheader = 0x02
    const header = 0x30

    const der = Buffer.concat([
      Buffer.from([header, length, rheader, rlength]),
      rbuf,
      Buffer.from([sheader, slength]),
      sbuf
    ])
    return der
  }

  toTxFormat () {
    const derbuf = this.toDer()
    const buf = Buffer.alloc(1)
    buf.writeUInt8(this.nHashType, 0)
    return Buffer.concat([derbuf, buf])
  }

  toString () {
    return this.toHex()
  }
}

Sig.SIGHASH_ALL = 0x00000001
Sig.SIGHASH_NONE = 0x00000002
Sig.SIGHASH_SINGLE = 0x00000003
Sig.SIGHASH_FORKID = 0x00000040
Sig.SIGHASH_ANYONECANPAY = 0x00000080

export { Sig }
