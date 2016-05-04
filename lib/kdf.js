/**
 * Kdf
 * ===
 *
 * Kdf stands for "key derivation function". A key derivation function is a
 * function that converts random data into a properly formatted key that can be
 * used by a cryptographic function. The one you probably want to use is
 * PBKdf2, although various other ones are provided as a convenience.
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

  // PBKdf2
  // http://tools.ietf.org/html/rfc2898#section-5.2
  // http://en.wikipedia.org/wiki/PBKdf2
  Kdf.PBKdf2 = function (passbuf, saltbuf, niterations, keylenbits, hashfstr) {
    if (!niterations) {
      niterations = 1
    }
    if (!keylenbits) {
      keylenbits = 512
    }
    if (!hashfstr) {
      hashfstr = 'sha512'
    }
    return pbkdf2.pbkdf2Sync(passbuf, saltbuf, niterations, keylenbits / 8, hashfstr)
  }

  Kdf.buf2keyPair = function (buf) {
    return Kdf.sha256Hmac2keyPair(buf)
  }

  Kdf.sha256Hmac2keyPair = function (buf) {
    let privKey = Kdf.sha256Hmac2privKey(buf)
    let keyPair = KeyPair().fromPrivKey(privKey)
    return keyPair
  }

  Kdf.sha256Hmac2privKey = function (buf) {
    let bn, hash
    let concat = new Buffer([])
    do {
      hash = Hash.sha256Hmac(buf, concat)
      bn = Bn().fromBuffer(hash)
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
