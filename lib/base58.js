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

  let Base58 = function Base58 (buf) {
    if (!(this instanceof Base58)) {
      return new Base58(buf)
    }
    this.fromObject({
      buf: buf
    })
  }

  Base58.prototype = Object.create(Struct.prototype)
  Base58.prototype.constructor = Base58

  Base58.prototype.fromHex = function (hex) {
    return this.fromBuffer(new Buffer(hex, 'hex'))
  }

  Base58.prototype.toHex = function () {
    return this.toBuffer().toString('hex')
  }

  Base58.encode = function (buf) {
    if (!Buffer.isBuffer(buf)) {
      throw new Error('Input should be a buffer')
    }
    return bs58.encode(buf)
  }

  Base58.decode = function (str) {
    if (typeof str !== 'string') {
      throw new Error('Input should be a string')
    }
    return bs58.decode(str)
  }

  Base58.prototype.fromBuffer = function (buf) {
    this.buf = buf
    return this
  }

  Base58.prototype.fromString = function (str) {
    let buf = Base58.decode(str)
    this.buf = buf
    return this
  }

  Base58.prototype.toBuffer = function () {
    return this.buf
  }

  Base58.prototype.toString = function () {
    return Base58.encode(this.buf)
  }

  return Base58
}

inject = require('./injector')(inject, dependencies)
let Base58 = inject()
module.exports = Base58
