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

let Bn = require('./bn')
let Hash = require('./hash')
let KeyPair = require('./key-pair')
let pbkdf2 = require('pbkdf2-compat')
let Point = require('./point')
let PrivKey = require('./priv-key')

class Kdf {}

// Pbkdf2
// http://tools.ietf.org/html/rfc2898#section-5.2
// http://en.wikipedia.org/wiki/Pbkdf2
Kdf.pbkdf2 = function (
  passBuf,
  saltBuf,
  nIterations = 1,
  keyLenBits = 512,
  hashFStr = 'sha512'
) {
  return pbkdf2.pbkdf2Sync(
    passBuf,
    saltBuf,
    nIterations,
    keyLenBits / 8,
    hashFStr
  )
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
  let concat = Buffer.from([])
  do {
    hash = Hash.sha256Hmac(buf, concat)
    bn = new Bn().fromBuffer(hash)
    concat = Buffer.concat([concat, Buffer.alloc(0)])
  } while (!bn.lt(Point.getN()))
  return new PrivKey().fromBn(bn)
}

// TODO: Discuss whether this needs to be supported, it is not used anywhere
// Kdf.Mainnet = inject({
//   KeyPair: require('./key-pair').Mainnet,
//   PrivKey: require('./priv-key').Mainnet
// })
// Kdf.Testnet = inject({
//   KeyPair: require('./key-pair').Testnet,
//   PrivKey: require('./priv-key').Testnet
// })

module.exports = Kdf
