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
  PubKey: require('./pub-key'),
  Random: require('./random'),
  Workers: require('./workers'),
  asink: require('asink')
}

let inject = function (deps) {
  let Aescbc = deps.Aescbc
  let cmp = deps.cmp
  let Hash = deps.Hash
  let KeyPair = deps.KeyPair
  let Point = deps.Point
  let PubKey = deps.PubKey
  let Random = deps.Random
  let Workers = deps.Workers
  let asink = deps.asink

  let Ecies = {}

  Ecies.encrypt = function (messageBuf, toPubKey, fromKeyPair, ivBuf) {
    if (!fromKeyPair) {
      fromKeyPair = KeyPair.fromRandom()
    }
    let r = fromKeyPair.privKey.bn
    let RPubKey = fromKeyPair.pubKey
    let RBuf = RPubKey.toDer(true)
    let KB = toPubKey.point
    let P = KB.mul(r)
    let S = P.getX()
    let Sbuf = S.toBuffer({size: 32})
    let kEkM = Hash.sha512(Sbuf)
    let kE = kEkM.slice(0, 32)
    let kM = kEkM.slice(32, 64)
    let c = Aescbc.encrypt(messageBuf, kE, ivBuf)
    let d = Hash.sha256Hmac(c, kM)
    let encBuf = Buffer.concat([RBuf, c, d])
    return encBuf
  }

  Ecies.asyncEncrypt = function (messageBuf, toPubKey, fromKeyPair, ivBuf) {
    return asink(function * () {
      if (!fromKeyPair) {
        fromKeyPair = yield KeyPair.asyncFromRandom()
      }
      if (!ivBuf) {
        ivBuf = Random.getRandomBuffer(128 / 8)
      }
      let args = [messageBuf, toPubKey, fromKeyPair, ivBuf]
      let workersResult = yield Workers.asyncClassMethod('Ecies', 'encrypt', args)
      return workersResult.resbuf
    }, this)
  }

  Ecies.decrypt = function (encBuf, toPrivKey) {
    let kB = toPrivKey.bn
    let fromPubKey = PubKey.fromDer(encBuf.slice(0, 33))
    let R = fromPubKey.point
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

  Ecies.asyncDecrypt = function (encBuf, toPrivKey) {
    return asink(function * () {
      let args = [encBuf, toPrivKey]
      let workersResult = yield Workers.asyncClassMethod('Ecies', 'decrypt', args)
      return workersResult.resbuf
    }, this)
  }

  return Ecies
}

inject = require('injecter')(inject, dependencies)
let Ecies = inject()
Ecies.Mainnet = inject({
  KeyPair: require('./key-pair').Mainnet
})
Ecies.Testnet = inject({
  KeyPair: require('./key-pair').Testnet
})
module.exports = Ecies
