'use strict'

var crypto = require('crypto')
var BufferUtil = require('../util/buffer')
var $ = require('../util/preconditions')

var Hash = module.exports

Hash.sha1 = function (buf) {
  $.checkArgument(BufferUtil.isBuffer(buf))
  return crypto.createHash('sha1').update(buf).digest()
}

Hash.sha1.blocksize = 512

Hash.sha256 = function (buf) {
  $.checkArgument(BufferUtil.isBuffer(buf))
  return crypto.createHash('sha256').update(buf).digest()
}

Hash.sha256.blocksize = 512

Hash.sha256sha256 = function (buf) {
  $.checkArgument(BufferUtil.isBuffer(buf))
  return Hash.sha256(Hash.sha256(buf))
}

Hash.ripemd160 = function (buf) {
  $.checkArgument(BufferUtil.isBuffer(buf))
  return crypto.createHash('ripemd160').update(buf).digest()
}

Hash.sha256ripemd160 = function (buf) {
  $.checkArgument(BufferUtil.isBuffer(buf))
  return Hash.ripemd160(Hash.sha256(buf))
}

Hash.sha512 = function (buf) {
  $.checkArgument(BufferUtil.isBuffer(buf))
  return crypto.createHash('sha512').update(buf).digest()
}

Hash.sha512.blocksize = 1024

Hash.hmac = function (hashf, data, key) {
  // http://en.wikipedia.org/wiki/Hash-based_message_authentication_code
  // http://tools.ietf.org/html/rfc4868#section-2
  $.checkArgument(BufferUtil.isBuffer(data))
  $.checkArgument(BufferUtil.isBuffer(key))
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

Hash.sha256hmac = function (data, key) {
  return Hash.hmac(Hash.sha256, data, key)
}

Hash.sha512hmac = function (data, key) {
  return Hash.hmac(Hash.sha512, data, key)
}
