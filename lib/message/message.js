'use strict'

var bsv = require('../../')
var _ = bsv.deps._
var PrivateKey = bsv.PrivateKey
var PublicKey = bsv.PublicKey
var Address = bsv.Address
var BufferWriter = bsv.encoding.BufferWriter
var ECDSA = bsv.crypto.ECDSA
var Signature = bsv.crypto.Signature
var sha256sha256 = bsv.crypto.Hash.sha256sha256
var JSUtil = bsv.util.js
var $ = bsv.util.preconditions

/**
 * constructs a new message to sign and verify.
 *
 * @param {String} message
 * @returns {Message}
 */
var Message = function Message (message) {
  if (!(this instanceof Message)) {
    return new Message(message)
  }

  $.checkArgument(_.isString(message) || Buffer.isBuffer(message), 'First argument should be a string or Buffer')

  if (_.isString(message)) {
    this.messageBuffer = Buffer.from(message)
  }

  if (Buffer.isBuffer(message)) {
    this.messageBuffer = message
  }
  return this
}

Message.sign = function (message, privateKey) {
  return new Message(message).sign(privateKey)
}

Message.verify = function (message, address, signature) {
  return new Message(message).verify(address, signature)
}

Message.MAGIC_BYTES = Buffer.from('Bitcoin Signed Message:\n')

Message.prototype.magicHash = function magicHash () {
  var prefix1 = BufferWriter.varintBufNum(Message.MAGIC_BYTES.length)
  var prefix2 = BufferWriter.varintBufNum(this.messageBuffer.length)
  var buf = Buffer.concat([prefix1, Message.MAGIC_BYTES, prefix2, this.messageBuffer])
  var hash = sha256sha256(buf)
  return hash
}

Message.prototype._sign = function _sign (privateKey) {
  $.checkArgument(privateKey instanceof PrivateKey,
    'First argument should be an instance of PrivateKey')
  var hash = this.magicHash()
  return ECDSA.signWithCalcI(hash, privateKey)
}

/**
 * Will sign a message with a given bitcoin private key.
 *
 * @param {PrivateKey} privateKey - An instance of PrivateKey
 * @returns {String} A base64 encoded compact signature
 */
Message.prototype.sign = function sign (privateKey) {
  var signature = this._sign(privateKey)
  return signature.toCompact().toString('base64')
}

Message.prototype._verify = function _verify (publicKey, signature) {
  $.checkArgument(publicKey instanceof PublicKey, 'First argument should be an instance of PublicKey')
  $.checkArgument(signature instanceof Signature, 'Second argument should be an instance of Signature')
  var hash = this.magicHash()
  var verified = ECDSA.verify(hash, signature, publicKey)
  if (!verified) {
    this.error = 'The signature was invalid'
  }
  return verified
}

/**
 * Will return a boolean of the signature is valid for a given bitcoin address.
 * If it isn't the specific reason is accessible via the "error" member.
 *
 * @param {Address|String} bitcoinAddress - A bitcoin address
 * @param {String} signatureString - A base64 encoded compact signature
 * @returns {Boolean}
 */
Message.prototype.verify = function verify (bitcoinAddress, signatureString) {
  $.checkArgument(bitcoinAddress)
  $.checkArgument(signatureString && _.isString(signatureString))

  if (_.isString(bitcoinAddress)) {
    bitcoinAddress = Address.fromString(bitcoinAddress)
  }
  var signature = Signature.fromCompact(Buffer.from(signatureString, 'base64'))

  // recover the public key
  var ecdsa = new ECDSA()
  ecdsa.hashbuf = this.magicHash()
  ecdsa.sig = signature
  var publicKey = ecdsa.toPublicKey()

  var signatureAddress = Address.fromPublicKey(publicKey, bitcoinAddress.network)

  // check that the recovered address and specified address match
  if (bitcoinAddress.toString() !== signatureAddress.toString()) {
    this.error = 'The signature did not match the message digest'
    return false
  }

  return this._verify(publicKey, signature)
}

/**
 * Instantiate a message from a message string
 *
 * @param {String} str - A string of the message
 * @returns {Message} A new instance of a Message
 */
Message.fromString = function (str) {
  return new Message(str)
}

/**
 * Instantiate a message from JSON
 *
 * @param {String} json - An JSON string or Object with keys: message
 * @returns {Message} A new instance of a Message
 */
Message.fromJSON = function fromJSON (json) {
  if (JSUtil.isValidJSON(json)) {
    json = JSON.parse(json)
  }
  return Message.fromObject(json)
}

/**
 * @returns {Object} A plain object with the message information
 */
Message.prototype.toObject = function toObject () {
  return {
    messageHex: this.messageBuffer.toString('hex')
  }
}

Message.fromObject = function (obj) {
  let messageBuffer = Buffer.from(obj.messageHex, 'hex')
  return new Message(messageBuffer)
}

/**
 * @returns {String} A JSON representation of the message information
 */
Message.prototype.toJSON = function toJSON () {
  return JSON.stringify(this.toObject())
}

/**
 * Will return a the string representation of the message
 *
 * @returns {String} Message
 */
Message.prototype.toString = function () {
  return this.messageBuffer.toString()
}

/**
 * Will return a string formatted for the console
 *
 * @returns {String} Message
 */
Message.prototype.inspect = function () {
  return '<Message: ' + this.toString() + '>'
}

module.exports = Message
