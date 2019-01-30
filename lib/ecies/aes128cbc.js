'use strict'

var bitcore = require('../../')
var $ = bitcore.util.preconditions
var aesjs = require('aes-js')
var CBC = aesjs.ModeOfOperation.cbc

var AES128CBC = function AES128CBC () {}

AES128CBC.encrypt = function (messagebuf, keybuf, ivbuf) {
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

AES128CBC.decrypt = function (encbuf, keybuf, ivbuf) {
  $.checkArgument(encbuf)
  $.checkArgument(keybuf)
  $.checkArgument(ivbuf)
  $.checkArgument(keybuf.length === 16, 'keybuf length must be 16')
  $.checkArgument(ivbuf.length === 16, 'ivbuf length must be 16')
  var aesCbc = new CBC(keybuf, ivbuf)
  var decryptedBytes = aesCbc.decrypt(encbuf)
  return Buffer.from(aesjs.padding.pkcs7.strip(decryptedBytes))
}

module.exports = AES128CBC
