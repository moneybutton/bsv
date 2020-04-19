'use strict'

var bsv = require('../../')

var PublicKey = bsv.PublicKey
var PrivateKey = bsv.PrivateKey
var Hash = bsv.crypto.Hash
var $ = bsv.util.preconditions
var bitcoreECIES = require('./bitcore-ecies')
var errors = require('./errors')
var aesjs = require('aes-js')
var CBC = aesjs.ModeOfOperation.cbc

var AESCBC = function AESCBC () {}

AESCBC.encrypt = function (messagebuf, keybuf, ivbuf) {
  $.checkArgument(messagebuf)
  $.checkArgument(keybuf)
  $.checkArgument(ivbuf)
  $.checkArgument(keybuf.length === 16, 'keybuf length must be 16')
  $.checkArgument(ivbuf.length === 16, 'ivbuf length must be 16')
  messagebuf = aesjs.padding.pkcs7.pad(messagebuf)
  var aesCbc = new CBC(keybuf, ivbuf)
  var encryptedBytes = aesCbc.encrypt(messagebuf)
  return Buffer.from(encryptedBytes)
}

AESCBC.decrypt = function (encbuf, keybuf, ivbuf) {
  $.checkArgument(encbuf)
  $.checkArgument(keybuf)
  $.checkArgument(ivbuf)
  $.checkArgument(keybuf.length === 16, 'keybuf length must be 16')
  $.checkArgument(ivbuf.length === 16, 'ivbuf length must be 16')
  var aesCbc = new CBC(keybuf, ivbuf)
  var decryptedBytes = aesCbc.decrypt(encbuf)
  return Buffer.from(aesjs.padding.pkcs7.strip(decryptedBytes))
}

// Electrum BIE1 ECIES
// Difference from Original Bitcore ECIES:
//  BIE1:
//      1.Secret S is compressed P(33 bytes), while Bitcore's Secret is Px(32 bytes). See ivkEkM.
//      2.use AES-128-CBC instead of AES-256-CBC.
//      3.IV is retrived from first 16 bytes of Hashed Secret Buffer. See iv
//      4.key Encryption(kE) is retrived from 17-32 bytes of Hashed Secret Buffer, instead of 1-32 bytes. See kE
//      5.a magic word 'BIE1' is used to identify message type.
//      6.ephemeral key is introduced, so you can encrypt messages only with public key.
//      7.HMAC is whole message.
//  Notice:
//      Electrum does not support shortTag nor noKey
//      Do NOT use those 2 options if you are to send a message to Electrum
//      Encrypted message is NOT recoverable if you use ephemeral key
//  Security:
//

// Default algorithm is set to BIE1, however original Bitcore ECIES is still preserved.
var ECIES = function ECIES (opts, algorithm = 'BIE1') {
  if (algorithm !== 'BIE1') throw new errors.UnsupportAlgorithm(algorithm)
  if (!(this instanceof ECIES)) {
    return new ECIES(opts, algorithm)
  }
  // use ephemeral key if privateKey is not set.
  this._privateKey = new bsv.PrivateKey()
  this.opts = opts || {}
  this.opts.ephemeralKey = true
}

ECIES.prototype.privateKey = function (privateKey) {
  $.checkArgument(PrivateKey.isValid(privateKey), 'no private key provided')

  this._privateKey = PrivateKey(privateKey.toHex()) || null
  this.opts.ephemeralKey = false

  return this
}

ECIES.prototype.publicKey = function (publicKey) {
  $.checkArgument(PublicKey.isValid(publicKey), 'no public key provided')

  this._publicKey = PublicKey(publicKey.toString()) || null
  if (this._publicKey != null) this.opts.fixedPublicKey = true

  return this
}

var defineProperty = function (name, getter) {
  var cachedName = '_' + name
  Object.defineProperty(ECIES.prototype, name, {
    configurable: false,
    enumerable: true,
    get: function () {
      var value = this[cachedName]
      value = this[cachedName] = getter.apply(this)
      return value
    }
  })
}

defineProperty('Rbuf', function () {
  return this._privateKey.publicKey.toDER(true)
})

defineProperty('ivkEkM', function () {
  var r = this._privateKey.bn
  var KB = this._publicKey.point
  var P = KB.mul(r)
  var S = PublicKey(P)
  var Sbuf = S.toBuffer()
  return Hash.sha512(Sbuf)
})

defineProperty('iv', function () {
  return this.ivkEkM.slice(0, 16)
})

defineProperty('kE', function () {
  return this.ivkEkM.slice(16, 32)
})

defineProperty('kM', function () {
  return this.ivkEkM.slice(32, 64)
})

// Encrypts the message (String or Buffer).
ECIES.prototype.encrypt = function (message) {
  if (!Buffer.isBuffer(message)) message = Buffer.from(message)
  var ciphertext = AESCBC.encrypt(message, this.kE, this.iv)
  var encbuf
  var BIE1 = Buffer.from('BIE1')
  if (this.opts.noKey && !this.opts.ephemeralKey) {
    encbuf = Buffer.concat([BIE1, ciphertext])
  } else {
    encbuf = Buffer.concat([BIE1, this.Rbuf, ciphertext])
  }
  var hmac = Hash.sha256hmac(encbuf, this.kM)
  if (this.opts.shortTag) hmac = hmac.slice(0, 4)
  return Buffer.concat([encbuf, hmac])
}

ECIES.prototype.decrypt = function (encbuf) {
  $.checkArgument(Buffer.isBuffer(encbuf), 'ciphetext must be a buffer')
  var tagLength = 32
  var offset = 4
  if (this.opts.shortTag) {
    tagLength = 4
  }
  var magic = encbuf.slice(0, 4)
  if (!magic.equals(Buffer.from('BIE1'))) {
    throw new errors.DecryptionError('Invalid Magic')
  }
  if (!this.opts.noKey) {
    var pub
    // BIE1 use compressed public key, length is always 33.
    pub = encbuf.slice(4, 37)
    if (this.opts.fixedPublicKey) console.log('Notice: Overriding PublicKey in message. Consider use "noKey" option if you are not sending message to electrum and do not want to use ephemeral key')
    else this._publicKey = PublicKey.fromDER(pub)
    offset = 37
  }

  var ciphertext = encbuf.slice(offset, encbuf.length - tagLength)
  var hmac = encbuf.slice(encbuf.length - tagLength, encbuf.length)

  var hmac2 = Hash.sha256hmac(encbuf.slice(0, encbuf.length - tagLength), this.kM)
  if (this.opts.shortTag) hmac2 = hmac2.slice(0, 4)

  if (!hmac.equals(hmac2)) {
    throw new errors.DecryptionError('Invalid checksum')
  }

  return AESCBC.decrypt(ciphertext, this.kE, this.iv)
}

ECIES.bitcoreECIES = bitcoreECIES

module.exports = ECIES
