/**
 * Ach (Aes+Cbc+Hmac) (experimental)
 * =================================
 *
 * An "encrypt-then-MAC" that uses Aes, Cbc and SHA256 Hmac. This is suitable
 * for general encryption of data.
 *
 * The encrypted data takes the form:
 * (256 bit hmac)(128 bit iv)(128+ bits Aes+Cbc encrypted message)
 */
'use strict'

let Aescbc = require('./aescbc')
let Hash = require('./hash')
let Random = require('./random')
let Workers = require('./workers')
let cmp = require('./cmp')

class Ach { }

Ach.encrypt = function (messageBuf, cipherKeyBuf, ivBuf) {
  let encBuf = Aescbc.encrypt(messageBuf, cipherKeyBuf, ivBuf)
  let hmacbuf = Hash.sha256Hmac(encBuf, cipherKeyBuf)
  return Buffer.concat([hmacbuf, encBuf])
}

Ach.asyncEncrypt = async function (messageBuf, cipherKeyBuf, ivBuf) {
  if (!ivBuf) {
    ivBuf = Random.getRandomBuffer(128 / 8)
  }
  let args = [messageBuf, cipherKeyBuf, ivBuf]
  let workersResult = await Workers.asyncClassMethod(Ach, 'encrypt', args)
  return workersResult.resbuf
}

Ach.decrypt = function (encBuf, cipherKeyBuf) {
  if (encBuf.length < (256 + 128 + 128) / 8) {
    throw new Error(
      'The encrypted data must be at least 256+128+128 bits, which is the length of the Hmac plus the iv plus the smallest encrypted data size'
    )
  }
  let hmacbuf = encBuf.slice(0, 256 / 8)
  encBuf = encBuf.slice(256 / 8, encBuf.length)
  let hmacbuf2 = Hash.sha256Hmac(encBuf, cipherKeyBuf)
  if (!cmp(hmacbuf, hmacbuf2)) {
    throw new Error(
      'Message authentication failed - Hmacs are not equivalent'
    )
  }
  return Aescbc.decrypt(encBuf, cipherKeyBuf)
}

Ach.asyncDecrypt = async function (encBuf, cipherKeyBuf) {
  let args = [encBuf, cipherKeyBuf]
  let workersResult = await Workers.asyncClassMethod(Ach, 'decrypt', args)
  return workersResult.resbuf
}

module.exports = Ach
