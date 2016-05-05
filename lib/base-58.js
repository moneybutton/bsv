/**
 * Base58 Encoding
 * ===============
 *
 * Base58 (no check)
 */
'use strict'
let dependencies = {
  bs58: require('bs58'),
  Struct: require('./struct')
}

let inject = function (deps) {
  let bs58 = deps.bs58
  let Struct = deps.Struct

  class Base58 extends Struct {
    constructor (buf) {
      super()
      this.fromObject({buf})
    }

    fromHex (hex) {
      return this.fromBuffer(new Buffer(hex, 'hex'))
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
      return new Buffer(bs58.decode(str))
    }

    fromBuffer (buf) {
      this.buf = buf
      return this
    }

    fromString (str) {
      let buf = Base58.decode(str)
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

  return Base58
}

inject = require('injecter')(inject, dependencies)
let Base58 = inject()
module.exports = Base58
