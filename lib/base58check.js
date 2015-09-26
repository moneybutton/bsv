/**
 * Base58 Check Encoding
 * =====================
 *
 * Base58 check encoding. The usual way to use it is
 * Base58Check(buf).toString() or Base58Check(str).toBuffer().
 */
'use strict'
let dependencies = {
  Base58: require('./base58'),
  cmp: require('./cmp'),
  Hash: require('./hash'),
  Struct: require('./struct')
}

let inject = function (deps) {
  let Base58 = deps.Base58
  let cmp = deps.cmp
  let Hash = deps.Hash
  let Struct = deps.Struct

  let Base58Check = function Base58Check (buf) {
    if (!(this instanceof Base58Check)) {
      return new Base58Check(buf)
    }
    this.fromObject({
      buf: buf
    })
  }

  Base58Check.prototype = Object.create(Struct.prototype)
  Base58Check.prototype.constructor = Base58Check

  Base58Check.prototype.fromHex = function (hex) {
    return this.fromBuffer(new Buffer(hex, 'hex'))
  }

  Base58Check.prototype.toHex = function () {
    return this.toBuffer().toString('hex')
  }

  Base58Check.decode = function (s) {
    if (typeof s !== 'string') {
      throw new Error('Input must be a string')
    }

    let buf = Base58.decode(s)

    if (buf.length < 4) {
      throw new Error('Input string too short')
    }

    let data = buf.slice(0, -4)
    let csum = buf.slice(-4)

    let hash = Hash.sha256sha256(data)
    let hash4 = hash.slice(0, 4)

    if (!cmp(csum, hash4)) {
      throw new Error('Checksum mismatch')
    }

    return data
  }

  Base58Check.encode = function (buf) {
    if (!Buffer.isBuffer(buf)) {
      throw new Error('Input must be a buffer')
    }
    let checkedBuf = new Buffer(buf.length + 4)
    let hash = Hash.sha256sha256(buf)
    buf.copy(checkedBuf)
    hash.copy(checkedBuf, buf.length)
    return Base58.encode(checkedBuf)
  }

  Base58Check.prototype.fromBuffer = function (buf) {
    this.buf = buf
    return this
  }

  Base58Check.prototype.fromString = function (str) {
    let buf = Base58Check.decode(str)
    this.buf = buf
    return this
  }

  Base58Check.prototype.toBuffer = function () {
    return this.buf
  }

  Base58Check.prototype.toString = function () {
    return Base58Check.encode(this.buf)
  }

  return Base58Check
}

inject = require('./injector')(inject, dependencies)
let Base58Check = inject()
module.exports = Base58Check
