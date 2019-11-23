'use strict'

var _ = require('../util/_')
var bs58 = require('bs58')
var buffer = require('buffer')

/**
 * The alphabet for the Bitcoin-specific Base 58 encoding distinguishes between
 * lower case L and upper case i - neither of those characters are allowed to
 * prevent accidentaly miscopying of letters.
 */
var ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'.split('')

/**
 * A Base58 object can encode/decoded Base 58, which is used primarily for
 * string-formatted Bitcoin addresses and private keys. Addresses and private
 * keys actually use an additional checksum, and so they actually use the
 * Base58Check class.
 *
 * @param {object} obj Can be a string or buffer.
 */
var Base58 = function Base58 (obj) {
  if (!(this instanceof Base58)) {
    return new Base58(obj)
  }
  if (Buffer.isBuffer(obj)) {
    var buf = obj
    this.fromBuffer(buf)
  } else if (typeof obj === 'string') {
    var str = obj
    this.fromString(str)
  }
}

Base58.validCharacters = function validCharacters (chars) {
  if (buffer.Buffer.isBuffer(chars)) {
    chars = chars.toString()
  }
  return _.every(_.map(chars, function (char) { return _.includes(ALPHABET, char) }))
}

Base58.prototype.set = function (obj) {
  this.buf = obj.buf || this.buf || undefined
  return this
}

/**
 * Encode a buffer to Bsae 58.
 *
 * @param {Buffer} buf Any buffer to be encoded.
 * @returns {string} A Base 58 encoded string.
 */
Base58.encode = function (buf) {
  if (!buffer.Buffer.isBuffer(buf)) {
    throw new Error('Input should be a buffer')
  }
  return bs58.encode(buf)
}

/**
 * Decode a Base 58 string to a buffer.
 *
 * @param {string} str A Base 58 encoded string.
 * @returns {Buffer} The decoded buffer.
 */
Base58.decode = function (str) {
  if (typeof str !== 'string') {
    throw new Error('Input should be a string')
  }
  return Buffer.from(bs58.decode(str))
}

Base58.prototype.fromBuffer = function (buf) {
  this.buf = buf
  return this
}

Base58.fromBuffer = function (buf) {
  return new Base58().fromBuffer(buf)
}

Base58.fromHex = function (hex) {
  return Base58.fromBuffer(Buffer.from(hex, 'hex'))
}

Base58.prototype.fromString = function (str) {
  var buf = Base58.decode(str)
  this.buf = buf
  return this
}

Base58.fromString = function (str) {
  return new Base58().fromString(str)
}

Base58.prototype.toBuffer = function () {
  return this.buf
}

Base58.prototype.toHex = function () {
  return this.toBuffer().toString('hex')
}

Base58.prototype.toString = function () {
  return Base58.encode(this.buf)
}

module.exports = Base58
