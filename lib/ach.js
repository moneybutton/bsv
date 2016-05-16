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
  Random: require('./random'),
  Workers: require('./workers'),
  asink: require('asink'),
  cmp: require('./cmp')
}

let inject = function (deps) {
  let Aescbc = deps.Aescbc
  let Hash = deps.Hash
  let Random = deps.Random
  let Workers = deps.Workers
  let asink = deps.asink
  let cmp = deps.cmp

  let Ach = {}

  Ach.encrypt = function (messageBuf, cipherKeyBuf, ivBuf) {
    let encBuf = Aescbc.encrypt(messageBuf, cipherKeyBuf, ivBuf)
    let hmacbuf = Hash.sha256Hmac(encBuf, cipherKeyBuf)
    return Buffer.concat([hmacbuf, encBuf])
  }

  Ach.asyncEncrypt = function (messageBuf, cipherKeyBuf, ivBuf) {
    return asink(function * () {
      if (!ivBuf) {
        ivBuf = Random.getRandomBuffer(128 / 8)
      }
      let args = [messageBuf, cipherKeyBuf, ivBuf]
      let workersResult = yield Workers.asyncClassMethod('Ach', 'encrypt', args)
      return workersResult.resbuf
    }, this)
  }

  Ach.decrypt = function (encBuf, cipherKeyBuf) {
    if (encBuf.length < (256 + 128 + 128) / 8) {
      throw new Error('The encrypted data must be at least 256+128+128 bits, which is the length of the Hmac plus the iv plus the smallest encrypted data size')
    }
    let hmacbuf = encBuf.slice(0, 256 / 8)
    encBuf = encBuf.slice(256 / 8, encBuf.length)
    let hmacbuf2 = Hash.sha256Hmac(encBuf, cipherKeyBuf)
    if (!cmp(hmacbuf, hmacbuf2)) {
      throw new Error('Message authentication failed - Hmacs are not equivalent')
    }
    return Aescbc.decrypt(encBuf, cipherKeyBuf)
  }

  Ach.asyncDecrypt = function (encBuf, cipherKeyBuf) {
    return asink(function * () {
      let args = [encBuf, cipherKeyBuf]
      let workersResult = yield Workers.asyncClassMethod('Ach', 'decrypt', args)
      return workersResult.resbuf
    }, this)
  }

  return Ach
}

inject = require('injecter')(inject, dependencies)
let Ach = inject()
module.exports = Ach
