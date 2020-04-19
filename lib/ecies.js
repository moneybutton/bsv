/**
 * Ecies
 * =====
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
  Workers: require('./workers')
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

  class Ecies {}

  Ecies.ivkEkM = function (privKey, pubKey) {
    let r = privKey.bn
    let KB = pubKey.point
    let P = KB.mul(r)
    let S = new PubKey(P)
    let Sbuf = S.toBuffer()
    let hash = Hash.sha512(Sbuf)
    return {
      iv: hash.slice(0, 16),
      kE: hash.slice(16, 32),
      kM: hash.slice(32, 64)
    }
  }

  Ecies.electrumEncrypt = function (messageBuf, toPubKey, fromKeyPair) {
    if (!Buffer.isBuffer(messageBuf)) {
      throw new Error('messageBuf must be a buffer')
    }
    let { iv, kE, kM } = Ecies.ivkEkM(fromKeyPair.privKey, toPubKey)
    let Rbuf = fromKeyPair.pubKey.toDer(true)
    let ciphertext = Aescbc.encrypt(messageBuf, kE, iv, false)
    let encBuf
    let BIE1 = Buffer.from('BIE1')
    encBuf = Buffer.concat([BIE1, Rbuf, ciphertext])
    let hmac = Hash.sha256Hmac(encBuf, kM)
    return Buffer.concat([encBuf, hmac])
  }

  Ecies.electrumDecrypt = function (encBuf, toPrivKey) {
    if (!Buffer.isBuffer(encBuf)) {
      throw new Error('encBuf must be a buffer')
    }
    let tagLength = 32

    let magic = encBuf.slice(0, 4)
    if (!magic.equals(Buffer.from('BIE1'))) {
      throw new Error('Invalid Magic')
    }

    // BIE1 use compressed public key, length is always 33.
    let pub = encBuf.slice(4, 37)
    let fromPubKey = PubKey.fromDer(pub)
    let { iv, kE, kM } = Ecies.ivkEkM(toPrivKey, fromPubKey)

    let ciphertext = encBuf.slice(37, encBuf.length - tagLength)
    let hmac = encBuf.slice(encBuf.length - tagLength, encBuf.length)

    let hmac2 = Hash.sha256Hmac(encBuf.slice(0, encBuf.length - tagLength), kM)

    if (!hmac.equals(hmac2)) {
      throw new Error('Invalid checksum')
    }
    return Aescbc.decrypt(ciphertext, kE, iv)
  }

  Ecies.bitcoreEncrypt = function (messageBuf, toPubKey, fromKeyPair, ivBuf) {
    if (!fromKeyPair) {
      fromKeyPair = KeyPair.fromRandom()
    }
    let r = fromKeyPair.privKey.bn
    let RPubKey = fromKeyPair.pubKey
    let RBuf = RPubKey.toDer(true)
    let KB = toPubKey.point
    let P = KB.mul(r)
    let S = P.getX()
    let Sbuf = S.toBuffer({ size: 32 })
    let kEkM = Hash.sha512(Sbuf)
    let kE = kEkM.slice(0, 32)
    let kM = kEkM.slice(32, 64)
    let c = Aescbc.encrypt(messageBuf, kE, ivBuf)
    let d = Hash.sha256Hmac(c, kM)
    let encBuf = Buffer.concat([RBuf, c, d])
    return encBuf
  }

  Ecies.asyncBitcoreEncrypt = async function (
    messageBuf,
    toPubKey,
    fromKeyPair,
    ivBuf
  ) {
    if (!fromKeyPair) {
      fromKeyPair = await KeyPair.asyncFromRandom()
    }
    if (!ivBuf) {
      ivBuf = Random.getRandomBuffer(128 / 8)
    }
    let args = [messageBuf, toPubKey, fromKeyPair, ivBuf]
    let workersResult = await Workers.asyncClassMethod(Ecies, 'bitcoreEncrypt', args)
    return workersResult.resbuf
  }

  Ecies.bitcoreDecrypt = function (encBuf, toPrivKey) {
    let kB = toPrivKey.bn
    let fromPubKey = PubKey.fromDer(encBuf.slice(0, 33))
    let R = fromPubKey.point
    let P = R.mul(kB)
    if (P.eq(new Point())) {
      throw new Error('P equals 0')
    }
    let S = P.getX()
    let Sbuf = S.toBuffer({ size: 32 })
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

  Ecies.asyncBitcoreDecrypt = async function (encBuf, toPrivKey) {
    let args = [encBuf, toPrivKey]
    let workersResult = await Workers.asyncClassMethod(Ecies, 'bitcoreDecrypt', args)
    return workersResult.resbuf
  }

  return Ecies
}

inject = require('./injecter')(inject, dependencies)
let Ecies = inject()
Ecies.Mainnet = inject({
  KeyPair: require('./key-pair').Mainnet
})
Ecies.Testnet = inject({
  KeyPair: require('./key-pair').Testnet
})
module.exports = Ecies
