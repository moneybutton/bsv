/** Ecies (experimental)
 * =====================
 * http://en.wikipedia.org/wiki/Integrated_Encryption_Scheme
 */
'use strict'
let dependencies = {
  Aescbc: require('./aescbc'),
  cmp: require('./cmp'),
  Hash: require('./hash'),
  KeyPair: require('./key-pair'),
  Point: require('./point'),
  PubKey: require('./pub-key')
}

let inject = function (deps) {
  let Aescbc = deps.Aescbc
  let cmp = deps.cmp
  let Hash = deps.Hash
  let KeyPair = deps.KeyPair
  let Point = deps.Point
  let PubKey = deps.PubKey

  function Ecies () {
    if (!(this instanceof Ecies)) {
      return new Ecies()
    }
  }

  Ecies.encrypt = function (messageBuf, topubKey, fromkeyPair, ivbuf) {
    if (!fromkeyPair) {
      fromkeyPair = KeyPair().fromRandom()
    }
    let r = fromkeyPair.privKey.bn
    let RPubKey = fromkeyPair.pubKey
    let RBuf = RPubKey.toDer(true)
    let KB = topubKey.point
    let P = KB.mul(r)
    let S = P.getX()
    let Sbuf = S.toBuffer({size: 32})
    let kEkM = Hash.sha512(Sbuf)
    let kE = kEkM.slice(0, 32)
    let kM = kEkM.slice(32, 64)
    let c = Aescbc.encrypt(messageBuf, kE, ivbuf)
    let d = Hash.sha256Hmac(c, kM)
    let encBuf = Buffer.concat([RBuf, c, d])
    return encBuf
  }

  Ecies.decrypt = function (encBuf, toprivKey) {
    let kB = toprivKey.bn
    let frompubKey = PubKey().fromDer(encBuf.slice(0, 33))
    let R = frompubKey.point
    let P = R.mul(kB)
    if (P.eq(new Point())) {
      throw new Error('P equals 0')
    }
    let S = P.getX()
    let Sbuf = S.toBuffer({size: 32})
    let kEkM = Hash.sha512(Sbuf)
    let kE = kEkM.slice(0, 32)
    let kM = kEkM.slice(32, 64)
    let c = encBuf.slice(33, encBuf.length - 32)
    let d = encBuf.slice(encBuf.length - 32, encBuf.length)
    let d2 = Hash.sha256Hmac(c, kM)
    if (!cmp(d, d2)) {
      throw new Error('Invalid checksum')
    }
    let messageBuf = Aescbc.decrypt(c, kE)
    return messageBuf
  }

  return Ecies
}

inject = require('injecter')(inject, dependencies)
let Ecies = inject()
Ecies.MainNet = inject({
  KeyPair: require('./key-pair').MainNet
})
Ecies.TestNet = inject({
  KeyPair: require('./key-pair').TestNet
})
module.exports = Ecies
