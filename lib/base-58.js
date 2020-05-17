/**
 * Base58 Encoding
 * ===============
 *
 * Base58 (no check)
 */
'use strict'

import bs58 from 'bs58'
import { Struct } from './struct'

class Base58 extends Struct {
  constructor (buf) {
    super({ buf })
  }

  fromHex (hex) {
    return this.fromBuffer(Buffer.from(hex, 'hex'))
  }

  toHex () {
    return this.toBuffer().toString('hex')
  }

  static encode (buf) {
    if (!Buffer.isBuffer(buf)) {
      throw new Error('Input should be a buffer')
    }
    return bs58.encode(buf)
  }

  static decode (str) {
    if (typeof str !== 'string') {
      throw new Error('Input should be a string')
    }
    return Buffer.from(bs58.decode(str))
  }

  fromBuffer (buf) {
    this.buf = buf
    return this
  }

  fromString (str) {
    const buf = Base58.decode(str)
    this.buf = buf
    return this
  }

  toBuffer () {
    return this.buf
  }

  toString () {
    return Base58.encode(this.buf)
  }
}

export { Base58 }
