'use strict'

var hash = require('hash.js')
var $ = require('../util/preconditions')

var Hash = module.exports

/**
 * A SHA or SHA1 hash, which is always 160 bits or 20 bytes long.
 *
 * See:
 * https://en.wikipedia.org/wiki/SHA-1
 *
 * @param {Buffer} buf Data, a.k.a. pre-image, which can be any size.
 * @returns {Buffer} The hash in the form of a buffer.
 */
Hash.sha1 = function (buf) {
  $.checkArgument(Buffer.isBuffer(buf))
  return Buffer.from(hash.sha1().update(buf).digest('hex'), 'hex')
}

Hash.sha1.blocksize = 512

/**
 * A SHA256 hash, which is always 256 bits or 32 bytes long.
 *
 * See:
 * https://www.movable-type.co.uk/scripts/sha256.html
 *
 * @param {Buffer} buf Data, a.k.a. pre-image, which can be any size.
 * @returns {Buffer} The hash in the form of a buffer.
 */
Hash.sha256 = function (buf) {
  $.checkArgument(Buffer.isBuffer(buf))
  return Buffer.from(hash.sha256().update(buf).digest('hex'), 'hex')
}

Hash.sha256.blocksize = 512

/**
 * A double SHA256 hash, which is always 256 bits or 32 bytes bytes long. This
 * hash function is commonly used inside Bitcoin, particularly for the hash of a
 * block and the hash of a transaction.
 *
 * See:
 * https://www.movable-type.co.uk/scripts/sha256.html
 *
 * @param {Buffer} buf Data, a.k.a. pre-image, which can be any size.
 * @returns {Buffer} The hash in the form of a buffer.
 */
Hash.sha256sha256 = function (buf) {
  $.checkArgument(Buffer.isBuffer(buf))
  return Hash.sha256(Hash.sha256(buf))
}

/**
 * A RIPEMD160 hash, which is always 160 bits or 20 bytes long.
 *
 * See:
 * https://en.wikipedia.org/wiki/RIPEMD
 *
 * @param {Buffer} buf Data, a.k.a. pre-image, which can be any size.
 * @returns {Buffer} The hash in the form of a buffer.
 */
Hash.ripemd160 = function (buf) {
  $.checkArgument(Buffer.isBuffer(buf))
  return Buffer.from(hash.ripemd160().update(buf).digest('hex'), 'hex')
}
/**
 * A RIPEMD160 hash of a SHA256 hash, which is always 160 bits or 20 bytes long.
 * This value is commonly used inside Bitcoin, particularly for Bitcoin
 * addresses.
 *
 * See:
 * https://en.wikipedia.org/wiki/RIPEMD
 *
 * @param {Buffer} buf Data, a.k.a. pre-image, which can be any size.
 * @returns {Buffer} The hash in the form of a buffer.
 */
Hash.sha256ripemd160 = function (buf) {
  $.checkArgument(Buffer.isBuffer(buf))
  return Hash.ripemd160(Hash.sha256(buf))
}

/**
 * A SHA512 hash, which is always 512 bits or 64 bytes long.
 *
 * See:
 * https://en.wikipedia.org/wiki/SHA-2
 *
 * @param {Buffer} buf Data, a.k.a. pre-image, which can be any size.
 * @returns {Buffer} The hash in the form of a buffer.
 */
Hash.sha512 = function (buf) {
  $.checkArgument(Buffer.isBuffer(buf))
  return Buffer.from(hash.sha512().update(buf).digest('hex'), 'hex')
}

Hash.sha512.blocksize = 1024

/**
 * A way to do HMAC using any underlying hash function. If you ever find that
 * you want to hash two pieces of data together, you should use HMAC instead of
 * just using a hash function. Rather than doing hash(data1 + data2) you should
 * do HMAC(data1, data2). Actually, rather than use HMAC directly, we recommend
 * you use either sha256hmac or sha515hmac provided below.
 *
 * See:
 * https://en.wikipedia.org/wiki/Length_extension_attack
 * https://blog.skullsecurity.org/2012/everything-you-need-to-know-about-hash-length-extension-attacks
 *
 * @param {function} hashf Which hash function to use.
 * @param {Buffer} data Data, which can be any size.
 * @param {Buffer} key Key, which can be any size.
 * @returns {Buffer} The HMAC in the form of a buffer.
 */
Hash.hmac = function (hashf, data, key) {
  // http://en.wikipedia.org/wiki/Hash-based_message_authentication_code
  // http://tools.ietf.org/html/rfc4868#section-2
  $.checkArgument(Buffer.isBuffer(data))
  $.checkArgument(Buffer.isBuffer(key))
  $.checkArgument(hashf.blocksize)

  var blocksize = hashf.blocksize / 8

  if (key.length > blocksize) {
    key = hashf(key)
  } else if (key < blocksize) {
    var fill = Buffer.alloc(blocksize)
    fill.fill(0)
    key.copy(fill)
    key = fill
  }

  var oKey = Buffer.alloc(blocksize)
  oKey.fill(0x5c)

  var iKey = Buffer.alloc(blocksize)
  iKey.fill(0x36)

  var oKeyPad = Buffer.alloc(blocksize)
  var iKeyPad = Buffer.alloc(blocksize)
  for (var i = 0; i < blocksize; i++) {
    oKeyPad[i] = oKey[i] ^ key[i]
    iKeyPad[i] = iKey[i] ^ key[i]
  }

  return hashf(Buffer.concat([oKeyPad, hashf(Buffer.concat([iKeyPad, data]))]))
}

/**
 * A SHA256 HMAC.
 *
 * @param {Buffer} data Data, which can be any size.
 * @param {Buffer} key Key, which can be any size.
 * @returns {Buffer} The HMAC in the form of a buffer.
 */
Hash.sha256hmac = function (data, key) {
  return Hash.hmac(Hash.sha256, data, key)
}

/**
 * A SHA512 HMAC.
 *
 * @param {Buffer} data Data, which can be any size.
 * @param {Buffer} key Key, which can be any size.
 * @returns {Buffer} The HMAC in the form of a buffer.
 */
Hash.sha512hmac = function (data, key) {
  return Hash.hmac(Hash.sha512, data, key)
}
