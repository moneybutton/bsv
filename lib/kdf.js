/**
 * Kdf
 * ===
 *
 * Kdf stands for "key derivation function". A key derivation function is a
 * function that converts random data into a properly formatted key that can be
 * used by a cryptographic function. The one you probably want to use is
 * Pbkdf2, although various other ones are provided as a convenience.
 */
'use strict'
let dependencies = {
  Bn: require('./bn'),
  Hash: require('./hash'),
  KeyPair: require('./key-pair'),
  pbkdf2: require('pbkdf2-compat'),
  Point: require('./point'),
  PrivKey: require('./priv-key')
}

let inject = function (deps) {
  let Bn = deps.Bn
  let Hash = deps.Hash
  let KeyPair = deps.KeyPair
  let pbkdf2 = deps.pbkdf2
  let Point = deps.Point
  let PrivKey = deps.PrivKey

  let Kdf = {}

  // Pbkdf2
  // http://tools.ietf.org/html/rfc2898#section-5.2
  // http://en.wikipedia.org/wiki/Pbkdf2
  Kdf.Pbkdf2 = function (passBuf, saltBuf, nIterations, keyLenBits, hashFStr) {
    if (!nIterations) {
      nIterations = 1
    }
    if (!keyLenBits) {
      keyLenBits = 512
    }
    if (!hashFStr) {
      hashFStr = 'sha512'
    }
    return pbkdf2.pbkdf2Sync(passBuf, saltBuf, nIterations, keyLenBits / 8, hashFStr)
  }

  Kdf.buf2KeyPair = function (buf) {
    return Kdf.sha256Hmac2KeyPair(buf)
  }

  Kdf.sha256Hmac2KeyPair = function (buf) {
    let privKey = Kdf.sha256Hmac2PrivKey(buf)
    let keyPair = new KeyPair().fromPrivKey(privKey)
    return keyPair
  }

  Kdf.sha256Hmac2PrivKey = function (buf) {
    let bn, hash
    let concat = new Buffer([])
    do {
      hash = Hash.sha256Hmac(buf, concat)
      bn = new Bn().fromBuffer(hash)
      concat = Buffer.concat([concat, new Buffer(0)])
    } while (!bn.lt(Point.getN()))
    return new PrivKey().fromBn(bn)
  }

  return Kdf
}

inject = require('injecter')(inject, dependencies)
let Kdf = inject()
Kdf.MainNet = inject({
  KeyPair: require('./key-pair').MainNet,
  PrivKey: require('./priv-key').MainNet
})
Kdf.TestNet = inject({
  KeyPair: require('./key-pair').TestNet,
  PrivKey: require('./priv-key').TestNet
})
module.exports = Kdf
