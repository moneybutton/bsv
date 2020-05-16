/**
 * Base58 Check Encoding
 * =====================
 *
 * Base58 check encoding. The usual way to use it is
 * new Base58Check(buf).toString() or new Base58Check(str).toBuffer().
 */
'use strict'

import { Base58 } from './base-58'
import { cmp } from './cmp'
import { Hash } from './hash'
import { Struct } from './struct'

class Base58Check extends Struct {
  constructor (buf) {
    super({ buf })
  }

  fromHex (hex) {
    return this.fromBuffer(Buffer.from(hex, 'hex'))
  }

  toHex () {
    return this.toBuffer().toString('hex')
  }

  static decode (s) {
    if (typeof s !== 'string') {
      throw new Error('Input must be a string')
    }

    let buf = Base58.decode(s)

    if (buf.length < 4) {
      throw new Error('Input string too short')
    }

    let data = buf.slice(0, -4)
    let csum = buf.slice(-4)

    let hash = Hash.sha256Sha256(data)
    let hash4 = hash.slice(0, 4)

    if (!cmp(csum, hash4)) {
      throw new Error('Checksum mismatch')
    }

    return data
  }

  static encode (buf) {
    if (!Buffer.isBuffer(buf)) {
      throw new Error('Input must be a buffer')
    }
    let checkedBuf = Buffer.alloc(buf.length + 4)
    let hash = Hash.sha256Sha256(buf)
    buf.copy(checkedBuf)
    hash.copy(checkedBuf, buf.length)
    return Base58.encode(checkedBuf)
  }

  fromBuffer (buf) {
    this.buf = buf
    return this
  }

  fromString (str) {
    let buf = Base58Check.decode(str)
    this.buf = buf
    return this
  }

  toBuffer () {
    return this.buf
  }

  toString () {
    return Base58Check.encode(this.buf)
  }
}

export { Base58Check }
