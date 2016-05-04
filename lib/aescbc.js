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

  Aescbc.encrypt = function (messageBuf, cipherKeybuf, ivbuf) {
    ivbuf = ivbuf || Random.getRandomBuffer(128 / 8)
    let ctbuf = Cbc.encrypt(messageBuf, ivbuf, Aes, cipherKeybuf)
    return Buffer.concat([ivbuf, ctbuf])
  }

  Aescbc.decrypt = function (encBuf, cipherKeybuf) {
    let ivbuf = encBuf.slice(0, 128 / 8)
    let ctbuf = encBuf.slice(128 / 8)
    return Cbc.decrypt(ctbuf, ivbuf, Aes, cipherKeybuf)
  }

  return Aescbc
}

inject = require('injecter')(inject, dependencies)
let Aescbc = inject()
module.exports = Aescbc
