/**
 * AESCBC (experimental)
 * =====================
 *
 * This is a convenience class for using AES with CBC. This is a low-level tool
 * that does not include authentication. You should only use this if you are
 * authenticating your data somehow else.
 */
'use strict'
let dependencies = {
  AES: require('./aes'),
  CBC: require('./cbc'),
  Random: require('./random')
}

let inject = function (deps) {
  let AES = deps.AES
  let CBC = deps.CBC
  let Random = deps.Random
  let AESCBC = {}

  AESCBC.encrypt = function (messagebuf, cipherkeybuf, ivbuf) {
    ivbuf = ivbuf || Random.getRandomBuffer(128 / 8)
    let ctbuf = CBC.encrypt(messagebuf, ivbuf, AES, cipherkeybuf)
    return Buffer.concat([ivbuf, ctbuf])
  }

  AESCBC.decrypt = function (encbuf, cipherkeybuf) {
    let ivbuf = encbuf.slice(0, 128 / 8)
    let ctbuf = encbuf.slice(128 / 8)
    return CBC.decrypt(ctbuf, ivbuf, AES, cipherkeybuf)
  }

  return AESCBC
}

inject = require('injecter')(inject, dependencies)
let AESCBC = inject()
module.exports = AESCBC
