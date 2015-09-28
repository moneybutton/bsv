/**
 * KDF
 * ===
 *
 * KDF stands for "key derivation function". A key derivation function is a
 * function that converts random data into a properly formatted key that can be
 * used by a cryptographic function. The one you probably want to use is
 * PBKDF2, although various other ones are provided as a convenience.
 */
'use strict'
let dependencies = {
  BN: require('./bn'),
  Hash: require('./hash'),
  Keypair: require('./keypair'),
  pbkdf2: require('pbkdf2-compat'),
  Point: require('./point'),
  Privkey: require('./privkey')
}

let inject = function (deps) {
  let BN = deps.BN
  let Hash = deps.Hash
  let Keypair = deps.Keypair
  let pbkdf2 = deps.pbkdf2
  let Point = deps.Point
  let Privkey = deps.Privkey

  let KDF = {}

  // PBKDF2
  // http://tools.ietf.org/html/rfc2898#section-5.2
  // http://en.wikipedia.org/wiki/PBKDF2
  KDF.PBKDF2 = function (passbuf, saltbuf, niterations, keylenbits, hashfstr) {
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

  KDF.buf2keypair = function (buf) {
    return KDF.sha256hmac2keypair(buf)
  }

  KDF.sha256hmac2keypair = function (buf) {
    let privkey = KDF.sha256hmac2privkey(buf)
    let keypair = Keypair().fromPrivkey(privkey)
    return keypair
  }

  KDF.sha256hmac2privkey = function (buf) {
    let bn, hash
    let concat = new Buffer([])
    do {
      hash = Hash.sha256hmac(buf, concat)
      bn = BN().fromBuffer(hash)
      concat = Buffer.concat([concat, new Buffer(0)])
    } while (!bn.lt(Point.getN()))
    return new Privkey().fromBN(bn)
  }

  return KDF
}

inject = require('./injector')(inject, dependencies)
let KDF = inject()
KDF.Mainnet = inject({
  Keypair: require('./keypair').Mainnet,
  Privkey: require('./privkey').Mainnet
})
KDF.Testnet = inject({
  Keypair: require('./keypair').Testnet,
  Privkey: require('./privkey').Testnet
})
module.exports = KDF
