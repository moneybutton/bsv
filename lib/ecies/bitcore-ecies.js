'use strict'

var bsv = require('../../')

var PublicKey = bsv.PublicKey
var Hash = bsv.crypto.Hash
var $ = bsv.util.preconditions
var aesjs = require('aes-js')
var CBC = aesjs.ModeOfOperation.cbc
var Random = bsv.crypto.Random

var AESCBC = function AESCBC () {}

AESCBC.encrypt = function (messagebuf, cipherkeybuf, ivbuf) {
  $.checkArgument(messagebuf)
  $.checkArgument(cipherkeybuf)
  $.checkArgument(ivbuf)
  ivbuf = ivbuf || Random.getRandomBuffer(128 / 8)
  messagebuf = aesjs.padding.pkcs7.pad(messagebuf)
  var aesCbc = new CBC(cipherkeybuf, ivbuf)
  var ctbuf = aesCbc.encrypt(messagebuf)
  var encbuf = Buffer.concat([ivbuf, ctbuf])
  return encbuf
}

AESCBC.decrypt = function (encbuf, cipherkeybuf) {
  $.checkArgument(encbuf)
  $.checkArgument(cipherkeybuf)
  var ivbuf = encbuf.slice(0, 128 / 8)
  var ctbuf = encbuf.slice(128 / 8)
  var aesCbc = new CBC(cipherkeybuf, ivbuf)
  var messagebuf = aesCbc.decrypt(ctbuf)
  messagebuf = aesjs.padding.pkcs7.strip(messagebuf)
  return Buffer.from(messagebuf)
}

// http://en.wikipedia.org/wiki/Integrated_Encryption_Scheme
var ECIES = function ECIES (opts) {
  if (!(this instanceof ECIES)) {
    return new ECIES()
  }
  this.opts = opts || {}
}

ECIES.prototype.privateKey = function (privateKey) {
  $.checkArgument(privateKey, 'no private key provided')

  this._privateKey = privateKey || null

  return this
}

ECIES.prototype.publicKey = function (publicKey) {
  $.checkArgument(publicKey, 'no public key provided')

  this._publicKey = publicKey || null

  return this
}

var cachedProperty = function (name, getter) {
  var cachedName = '_' + name
  Object.defineProperty(ECIES.prototype, name, {
    configurable: false,
    enumerable: true,
    get: function () {
      var value = this[cachedName]
      if (!value) {
        value = this[cachedName] = getter.apply(this)
      }
      return value
    }
  })
}

cachedProperty('Rbuf', function () {
  return this._privateKey.publicKey.toDER(true)
})

cachedProperty('kEkM', function () {
  var r = this._privateKey.bn
  var KB = this._publicKey.point
  var P = KB.mul(r)
  var S = P.getX()
  var Sbuf = S.toBuffer({ size: 32 })
  return Hash.sha512(Sbuf)
})

cachedProperty('kE', function () {
  return this.kEkM.slice(0, 32)
})

cachedProperty('kM', function () {
  return this.kEkM.slice(32, 64)
})

// Encrypts the message (String or Buffer).
// Optional `ivbuf` contains 16-byte Buffer to be used in AES-CBC.
// By default, `ivbuf` is computed deterministically from message and private key using HMAC-SHA256.
// Deterministic IV enables end-to-end test vectors for alternative implementations.
// Note that identical messages have identical ciphertexts. If your protocol does not include some
// kind of a sequence identifier inside the message *and* it is important to not allow attacker to learn
// that message is repeated, then you should use custom IV.
// For random IV, pass `Random.getRandomBuffer(16)` for the second argument.
ECIES.prototype.encrypt = function (message, ivbuf) {
  if (!Buffer.isBuffer(message)) message = Buffer.from(message)
  if (ivbuf === undefined) {
    ivbuf = Hash.sha256hmac(message, this._privateKey.toBuffer()).slice(0, 16)
  }
  var c = AESCBC.encrypt(message, this.kE, ivbuf)
  var d = Hash.sha256hmac(c, this.kM)
  if (this.opts.shortTag) d = d.slice(0, 4)
  var encbuf
  if (this.opts.noKey) {
    encbuf = Buffer.concat([c, d])
  } else {
    encbuf = Buffer.concat([this.Rbuf, c, d])
  }
  return encbuf
}

ECIES.prototype.decrypt = function (encbuf) {
  $.checkArgument(encbuf)
  var offset = 0
  var tagLength = 32
  if (this.opts.shortTag) {
    tagLength = 4
  }
  if (!this.opts.noKey) {
    var pub
    switch (encbuf[0]) {
      case 4:
        pub = encbuf.slice(0, 65)
        break
      case 3:
      case 2:
        pub = encbuf.slice(0, 33)
        break
      default:
        throw new Error('Invalid type: ' + encbuf[0])
    }
    this._publicKey = PublicKey.fromDER(pub)
    offset += pub.length
  }

  var c = encbuf.slice(offset, encbuf.length - tagLength)
  var d = encbuf.slice(encbuf.length - tagLength, encbuf.length)

  var d2 = Hash.sha256hmac(c, this.kM)
  if (this.opts.shortTag) d2 = d2.slice(0, 4)

  var equal = true
  for (var i = 0; i < d.length; i++) {
    equal &= (d[i] === d2[i])
  }
  if (!equal) {
    throw new Error('Invalid checksum')
  }

  return AESCBC.decrypt(c, this.kE)
}

module.exports = ECIES
