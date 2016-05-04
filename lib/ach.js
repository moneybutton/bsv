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
let dependencies = {
  Aescbc: require('./aescbc'),
  Hash: require('./hash'),
  cmp: require('./cmp')
}

let inject = function (deps) {
  let Aescbc = deps.Aescbc
  let Hash = deps.Hash
  let cmp = deps.cmp

  let Ach = {}

  Ach.encrypt = function (messageBuf, cipherKeybuf, ivbuf) {
    let encBuf = Aescbc.encrypt(messageBuf, cipherKeybuf, ivbuf)
    let hmacbuf = Hash.sha256Hmac(encBuf, cipherKeybuf)
    return Buffer.concat([hmacbuf, encBuf])
  }

  Ach.decrypt = function (encBuf, cipherKeybuf) {
    if (encBuf.length < (256 + 128 + 128) / 8) {
      throw new Error('The encrypted data must be at least 256+128+128 bits, which is the length of the Hmac plus the iv plus the smallest encrypted data size')
    }
    let hmacbuf = encBuf.slice(0, 256 / 8)
    encBuf = encBuf.slice(256 / 8, encBuf.length)
    let hmacbuf2 = Hash.sha256Hmac(encBuf, cipherKeybuf)
    if (!cmp(hmacbuf, hmacbuf2)) {
      throw new Error('Message authentication failed - Hmacs are not equivalent')
    }
    return Aescbc.decrypt(encBuf, cipherKeybuf)
  }

  return Ach
}

inject = require('injecter')(inject, dependencies)
let Ach = inject()
module.exports = Ach
