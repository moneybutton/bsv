'use strict'

var bsv = require('../../')
var $ = bsv.util.preconditions
var aesjs = require('aes-js')
var CBC = aesjs.ModeOfOperation.cbc
var Random = bsv.crypto.Random

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

AESCBC.encryptCipherkey = function (messagebuf, cipherkeybuf, ivbuf) {
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

AESCBC.decryptCipherkey = function (encbuf, cipherkeybuf) {
  $.checkArgument(encbuf)
  $.checkArgument(cipherkeybuf)
  var ivbuf = encbuf.slice(0, 128 / 8)
  var ctbuf = encbuf.slice(128 / 8)
  var aesCbc = new CBC(cipherkeybuf, ivbuf)
  var messagebuf = aesCbc.decrypt(ctbuf)
  messagebuf = aesjs.padding.pkcs7.strip(messagebuf)
  return Buffer.from(messagebuf)
}

module.exports = AESCBC
