'use strict'

var _ = require('../util/_')
var Base58 = require('./base58')
var buffer = require('buffer')
var sha256sha256 = require('../crypto/hash').sha256sha256

/**
 * A Base58check object can encode/decodd Base 58, which is used primarily for
 * string-formatted Bitcoin addresses and private keys. This is the same as
 * Base58, except that it includes a checksum to prevent accidental mistypings.
 *
 * @param {object} obj Can be a string or buffer.
 */
var Base58Check = function Base58Check (obj) {
  if (!(this instanceof Base58Check)) { return new Base58Check(obj) }
  if (Buffer.isBuffer(obj)) {
    var buf = obj
    this.fromBuffer(buf)
  } else if (typeof obj === 'string') {
    var str = obj
    this.fromString(str)
  }
}

Base58Check.prototype.set = function (obj) {
  this.buf = obj.buf || this.buf || undefined
  return this
}

Base58Check.validChecksum = function validChecksum (data, checksum) {
  if (_.isString(data)) {
    data = buffer.Buffer.from(Base58.decode(data))
  }
  if (_.isString(checksum)) {
    checksum = buffer.Buffer.from(Base58.decode(checksum))
  }
  if (!checksum) {
    checksum = data.slice(-4)
    data = data.slice(0, -4)
  }
  return Base58Check.checksum(data).toString('hex') === checksum.toString('hex')
}

Base58Check.decode = function (s) {
  if (typeof s !== 'string') { throw new Error('Input must be a string') }

  var buf = Buffer.from(Base58.decode(s))

  if (buf.length < 4) { throw new Error('Input string too short') }

  var data = buf.slice(0, -4)
  var csum = buf.slice(-4)

  var hash = sha256sha256(data)
  var hash4 = hash.slice(0, 4)

  if (csum.toString('hex') !== hash4.toString('hex')) { throw new Error('Checksum mismatch') }

  return data
}

Base58Check.checksum = function (buffer) {
  return sha256sha256(buffer).slice(0, 4)
}

Base58Check.encode = function (buf) {
  if (!Buffer.isBuffer(buf)) { throw new Error('Input must be a buffer') }
  var checkedBuf = Buffer.alloc(buf.length + 4)
  var hash = Base58Check.checksum(buf)
  buf.copy(checkedBuf)
  hash.copy(checkedBuf, buf.length)
  return Base58.encode(checkedBuf)
}

Base58Check.prototype.fromBuffer = function (buf) {
  this.buf = buf
  return this
}

Base58Check.fromBuffer = function (buf) {
  return new Base58Check().fromBuffer(buf)
}

Base58Check.fromHex = function (hex) {
  return Base58Check.fromBuffer(Buffer.from(hex, 'hex'))
}

Base58Check.prototype.fromString = function (str) {
  var buf = Base58Check.decode(str)
  this.buf = buf
  return this
}

Base58Check.fromString = function (str) {
  var buf = Base58Check.decode(str)
  return new Base58(buf)
}

Base58Check.prototype.toBuffer = function () {
  return this.buf
}

Base58Check.prototype.toHex = function () {
  return this.toBuffer().toString('hex')
}

Base58Check.prototype.toString = function () {
  return Base58Check.encode(this.buf)
}

module.exports = Base58Check
