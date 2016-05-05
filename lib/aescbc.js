/**
 * Aescbc (experimental)
 * =====================
 *
 * This is a convenience class for using Aes with Cbc. This is a low-level tool
 * that does not include authentication. You should only use this if you are
 * authenticating your data somehow else.
 */
'use strict'
let dependencies = {
  Aes: require('./aes'),
  Cbc: require('./cbc'),
  Random: require('./random')
}

let inject = function (deps) {
  let Aes = deps.Aes
  let Cbc = deps.Cbc
  let Random = deps.Random
  let Aescbc = {}

  Aescbc.encrypt = function (messageBuf, cipherKeyBuf, ivBuf) {
    ivBuf = ivBuf || Random.getRandomBuffer(128 / 8)
    let ctBuf = Cbc.encrypt(messageBuf, ivBuf, Aes, cipherKeyBuf)
    return Buffer.concat([ivBuf, ctBuf])
  }

  Aescbc.decrypt = function (encBuf, cipherKeyBuf) {
    let ivBuf = encBuf.slice(0, 128 / 8)
    let ctBuf = encBuf.slice(128 / 8)
    return Cbc.decrypt(ctBuf, ivBuf, Aes, cipherKeyBuf)
  }

  return Aescbc
}

inject = require('injecter')(inject, dependencies)
let Aescbc = inject()
module.exports = Aescbc
