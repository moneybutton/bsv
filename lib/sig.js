/**
 * Signature
 * =========
 *
 * A signature is the thing you make when you want to sign a transaction, or
 * the thing you want to verify if you want to ensure that someone signed a
 * transaction. It has an r and s value, which are the cryptographic big
 * numbers that define a signature. And since this is a bitcoin library, it
 * also has nhashtype, which is the way to hash a transaction and is used in
 * the binary format of a signature when it is in a transaction. We also
 * support a public key recover value, recovery, allowing one to compute the
 * public key from a signature. The "compressed" value is also necessary to
 * accurately compute the public key from a signature.
 *
 * There are a few different formats of a signature in bitcoin. One is DER, the
 * other is the TxFormat which is the same as DER but with the nhashtype byte
 * appended, and the final one is Compact, which is used by Bitcoin Signed
 * Message (BSM).
 */
'use strict'
let dependencies = {
  BN: require('./bn'),
  Struct: require('./struct')
}

let inject = function (deps) {
  let BN = deps.BN
  let Struct = deps.Struct

  /**
   * r, s: big numbers constiting a cryptographic signature
   * nhashtype: found at the end of a signature in a transaction
   * recovery: public key recovery number
   * compressed: whether the recovered pubkey is compressed
   */
  function Sig (r, s, nhashtype, recovery, compressed) {
    if (!(this instanceof Sig)) {
      return new Sig(r, s, nhashtype, recovery, compressed)
    }
    if (r instanceof BN) {
      this.fromObject({r, s, nhashtype, recovery, compressed})
    } else if (r) {
      let obj = r
      this.fromObject(obj)
    }
  }

  Sig.prototype = Object.create(Struct.prototype)
  Sig.prototype.constructor = Sig

  Sig.SIGHASH_ALL = 0x00000001
  Sig.SIGHASH_NONE = 0x00000002
  Sig.SIGHASH_SINGLE = 0x00000003
  Sig.SIGHASH_ANYONECANPAY = 0x00000080

  Sig.prototype.fromBuffer = function (buf) {
    try {
      return this.fromDER(buf, true)
    } catch (e) {}
    try {
      return this.fromCompact(buf)
    } catch (e) {}
    return this.fromTxFormat(buf)
  }

  Sig.prototype.toBuffer = function () {
    if (this.nhashtype !== undefined) {
      return this.toTxFormat()
    } else if (this.recovery !== undefined) {
      return this.toCompact()
    }
    return this.toDER()
  }

  // The format used by "message"
  Sig.prototype.fromCompact = function (buf) {
    let compressed = true
    let recovery = buf.slice(0, 1)[0] - 27 - 4
    if (recovery < 0) {
      compressed = false
      recovery = recovery + 4
    }

    let b2 = buf.slice(1, 33)
    let b3 = buf.slice(33, 65)

    if (!(recovery === 0 || recovery === 1 || recovery === 2 || recovery === 3)) {
      throw new Error('i must be 0, 1, 2, or 3')
    }
    if (b2.length !== 32) {
      throw new Error('r must be 32 bytes')
    }
    if (b3.length !== 32 || buf.length > 65) {
      throw new Error('s must be 32 bytes')
    }

    this.compressed = compressed
    this.recovery = recovery
    this.r = BN().fromBuffer(b2)
    this.s = BN().fromBuffer(b3)

    return this
  }

  // The format used in a tx, except without the nhashtype at the end
  Sig.prototype.fromDER = function (buf, strict) {
    let obj = Sig.parseDER(buf, strict)
    this.r = obj.r
    this.s = obj.s

    return this
  }

  // The format used in a tx
  Sig.prototype.fromTxFormat = function (buf) {
    let nhashtype = buf.readUInt8(buf.length - 1)
    let derbuf = buf.slice(0, buf.length - 1)
    this.fromDER(derbuf, false)
    this.nhashtype = nhashtype
    return this
  }

  Sig.prototype.fromString = function (str) {
    let buf = new Buffer(str, 'hex')
    this.fromDER(buf)

    return this
  }

  /**
   * In order to mimic the non-strict DER encoding of OpenSSL, set strict = false.
   */
  Sig.parseDER = function (buf, strict) {
    if (strict === undefined) {
      strict = true
    }

    if (!Buffer.isBuffer(buf)) {
      throw new Error('DER formatted signature should be a buffer')
    }

    let header = buf[0]

    if (header !== 0x30) {
      throw new Error('Header byte should be 0x30')
    }

    let length = buf[1]
    let buflength = buf.slice(2).length
    if (strict && length !== buflength) {
      throw new Error('Length byte should length of what follows')
    } else {
      length = length < buflength ? length : buflength
    }

    let rheader = buf[2 + 0]
    if (rheader !== 0x02) {
      throw new Error('Integer byte for r should be 0x02')
    }

    let rlength = buf[2 + 1]
    let rbuf = buf.slice(2 + 2, 2 + 2 + rlength)
    let r = BN().fromBuffer(rbuf)
    let rneg = buf[2 + 1 + 1] === 0x00
    if (rlength !== rbuf.length) {
      throw new Error('Length of r incorrect')
    }

    let sheader = buf[2 + 2 + rlength + 0]
    if (sheader !== 0x02) {
      throw new Error('Integer byte for s should be 0x02')
    }

    let slength = buf[2 + 2 + rlength + 1]
    let sbuf = buf.slice(2 + 2 + rlength + 2, 2 + 2 + rlength + 2 + slength)
    let s = BN().fromBuffer(sbuf)
    let sneg = buf[2 + 2 + rlength + 2 + 2] === 0x00
    if (slength !== sbuf.length) {
      throw new Error('Length of s incorrect')
    }

    let sumlength = 2 + 2 + rlength + 2 + slength
    if (length !== sumlength - 2) {
      throw new Error('Length of signature incorrect')
    }

    let obj = {
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
   * the nhashtype, at the end. It is really the tx format, not DER format.
   *
   * A canonical signature exists of: [30] [total len] [02] [len R] [R] [02] [len S] [S] [hashtype]
   * Where R and S are not negative (their first byte has its highest bit not set), and not
   * excessively padded (do not start with a 0 byte, unless an otherwise negative number follows,
   * in which case a single 0 byte is necessary and even required).
   *
   * See https://bitcointalk.org/index.php?topic=8392.msg127623#msg127623
   */
  Sig.isTxDER = function (buf) {
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
    let nLenR = buf[3]
    if (5 + nLenR >= buf.length) {
      //  Non-canonical signature: S length misplaced
      return false
    }
    let nLenS = buf[5 + nLenR]
    if ((nLenR + nLenS + 7) !== buf.length) {
      //  Non-canonical signature: R+S length mismatch
      return false
    }

    let R = buf.slice(4)
    if (buf[4 - 2] !== 0x02) {
      //  Non-canonical signature: R value type mismatch
      return false
    }
    if (nLenR === 0) {
      //  Non-canonical signature: R length is zero
      return false
    }
    if (R[0] & 0x80) {
      //  Non-canonical signature: R value negative
      return false
    }
    if (nLenR > 1 && (R[0] === 0x00) && !(R[1] & 0x80)) {
      //  Non-canonical signature: R value excessively padded
      return false
    }

    let S = buf.slice(6 + nLenR)
    if (buf[6 + nLenR - 2] !== 0x02) {
      //  Non-canonical signature: S value type mismatch
      return false
    }
    if (nLenS === 0) {
      //  Non-canonical signature: S length is zero
      return false
    }
    if (S[0] & 0x80) {
      //  Non-canonical signature: S value negative
      return false
    }
    if (nLenS > 1 && (S[0] === 0x00) && !(S[1] & 0x80)) {
      //  Non-canonical signature: S value excessively padded
      return false
    }
    return true
  }

  /**
   * Compares to bitcoind's IsLowDERSignature
   * See also ECDSA signature algorithm which enforces this.
   * See also BIP 62, "low S values in signatures"
   */
  Sig.prototype.hasLowS = function () {
    if (this.s.lt(1) || this.s.gt(BN().fromBuffer(new Buffer('7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A0', 'hex')))) {
      return false
    }
    return true
  }

  /**
   * Ensures the nhashtype is exactly equal to one of the standard options or combinations thereof.
   * Translated from bitcoind's IsDefinedHashtypeSignature
   */
  Sig.prototype.hasDefinedHashtype = function () {
    if (this.nhashtype < Sig.SIGHASH_ALL || this.nhashtype > Sig.SIGHASH_SINGLE) {
      return false
    }
    return true
  }

  Sig.prototype.toCompact = function (recovery, compressed) {
    recovery = typeof recovery === 'number' ? recovery : this.recovery
    compressed = typeof compressed === 'boolean' ? compressed : this.compressed

    if (!(recovery === 0 || recovery === 1 || recovery === 2 || recovery === 3)) {
      throw new Error('recovery must be equal to 0, 1, 2, or 3')
    }

    let val = recovery + 27 + 4
    if (compressed === false) {
      val = val - 4
    }
    let b1 = new Buffer([val])
    let b2 = this.r.toBuffer({size: 32})
    let b3 = this.s.toBuffer({size: 32})
    return Buffer.concat([b1, b2, b3])
  }

  Sig.prototype.toDER = function () {
    let rnbuf = this.r.toBuffer()
    let snbuf = this.s.toBuffer()

    let rneg = rnbuf[0] & 0x80
    let sneg = snbuf[0] & 0x80

    let rbuf = rneg ? Buffer.concat([new Buffer([0x00]), rnbuf]) : rnbuf
    let sbuf = sneg ? Buffer.concat([new Buffer([0x00]), snbuf]) : snbuf

    let length = 2 + rbuf.length + 2 + sbuf.length
    let rlength = rbuf.length
    let slength = sbuf.length
    let rheader = 0x02
    let sheader = 0x02
    let header = 0x30

    let der = Buffer.concat([new Buffer([header, length, rheader, rlength]), rbuf, new Buffer([sheader, slength]), sbuf])
    return der
  }

  Sig.prototype.toTxFormat = function () {
    let derbuf = this.toDER()
    let buf = new Buffer(1)
    buf.writeUInt8(this.nhashtype, 0)
    return Buffer.concat([derbuf, buf])
  }

  Sig.prototype.toString = function () {
    let buf = this.toDER()
    return buf.toString('hex')
  }

  return Sig
}

inject = require('./injector')(inject, dependencies)
let Sig = inject()
module.exports = Sig
