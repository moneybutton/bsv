/**
 * Aescbc (experimental)
 * =====================
 *
 * This is a convenience class for using Aes with Cbc. This is a low-level tool
 * that does not include authentication. You should only use this if you are
 * authenticating your data somehow else.
 */
'use strict'

let Aes = require('./aes')
let Cbc = require('./cbc')
let Random = require('./random')

class Aescbc { }

Aescbc.encrypt = function (messageBuf, cipherKeyBuf, ivBuf, concatIvBuf = true) {
  ivBuf = ivBuf || Random.getRandomBuffer(128 / 8)
  let ctBuf = Cbc.encrypt(messageBuf, ivBuf, Aes, cipherKeyBuf)
  if (concatIvBuf) {
    return Buffer.concat([ivBuf, ctBuf])
  } else {
    return ctBuf
  }
}

Aescbc.decrypt = function (encBuf, cipherKeyBuf, ivBuf = false) {
  if (!ivBuf) {
    let ivBuf = encBuf.slice(0, 128 / 8)
    let ctBuf = encBuf.slice(128 / 8)
    return Cbc.decrypt(ctBuf, ivBuf, Aes, cipherKeyBuf)
  } else {
    let ctBuf = encBuf
    return Cbc.decrypt(ctBuf, ivBuf, Aes, cipherKeyBuf)
  }
}

module.exports = Aescbc
