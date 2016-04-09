/**
 * Private Key
 * ===========
 *
 * A private key is used for signing transactions (or messages). The primary
 * way to use this is Privkey().fromRandom(), or Privkey().fromBuffer(buf).
 */
'use strict'
let dependencies = {
  BN: require('./bn'),
  Point: require('./point'),
  Constants: require('./constants').Default.Privkey,
  Base58Check: require('./base58check'),
  Random: require('./random'),
  Struct: require('./struct')
}

let inject = function (deps) {
  let BN = deps.BN
  let Point = deps.Point
  let Constants = deps.Constants
  let Base58Check = deps.Base58Check
  let Random = deps.Random
  let Struct = deps.Struct

  function Privkey (bn, compressed) {
    if (!(this instanceof Privkey)) {
      return new Privkey(bn, compressed)
    }
    this.fromObject({bn, compressed})
  }

  Privkey.prototype = Object.create(Struct.prototype)
  Privkey.prototype.constructor = Privkey

  Privkey.prototype.fromJSON = function (json) {
    this.fromString(json)
    return this
  }

  Privkey.prototype.toJSON = function () {
    return this.toString()
  }

  Privkey.prototype.fromRandom = function () {
    let privbuf, bn, condition

    do {
      privbuf = Random.getRandomBuffer(32)
      bn = BN().fromBuffer(privbuf)
      condition = bn.lt(Point.getN())
    } while (!condition)

    this.fromObject({
      bn: bn,
      compressed: true
    })
    return this
  }

  Privkey.prototype.toBuffer = function () {
    let compressed = this.compressed

    if (compressed === undefined) {
      compressed = true
    }

    let privbuf = this.bn.toBuffer({size: 32})
    let buf
    if (compressed) {
      buf = Buffer.concat([new Buffer([Constants.version]), privbuf, new Buffer([0x01])])
    } else {
      buf = Buffer.concat([new Buffer([Constants.version]), privbuf])
    }

    return buf
  }

  Privkey.prototype.fromBuffer = function (buf) {
    if (buf.length === 1 + 32 + 1 && buf[1 + 32 + 1 - 1] === 1) {
      this.compressed = true
    } else if (buf.length === 1 + 32) {
      this.compressed = false
    } else {
      throw new Error('Length of privkey buffer must be 33 (uncompressed pubkey) or 34 (compressed pubkey)')
    }

    if (buf[0] !== Constants.version) {
      throw new Error('Invalid version byte')
    }

    return this.fromBN(BN().fromBuffer(buf.slice(1, 1 + 32)))
  }

  Privkey.prototype.toBN = function () {
    return this.bn
  }

  Privkey.prototype.fromBN = function (bn) {
    this.bn = bn
    return this
  }

  Privkey.prototype.validate = function () {
    if (!this.bn.lt(Point.getN())) {
      throw new Error('Number must be less than N')
    }
    if (typeof this.compressed !== 'boolean') {
      throw new Error('Must specify whether the corresponding public key is compressed or not (true or false)')
    }
    return this
  }

  /**
   * Output the private key a Wallet Import Format (WIF) string.
   */
  Privkey.prototype.toWIF = function () {
    return Base58Check.encode(this.toBuffer())
  }

  /**
   * Input the private key from a Wallet Import Format (WIF) string.
   */
  Privkey.prototype.fromWIF = function (str) {
    return this.fromBuffer(Base58Check.decode(str))
  }

  Privkey.prototype.toString = function () {
    return this.toWIF()
  }

  Privkey.prototype.fromString = function (str) {
    return this.fromWIF(str)
  }

  return Privkey
}

inject = require('injecter')(inject, dependencies)
let Privkey = inject()
Privkey.Mainnet = inject({
  Constants: require('./constants').Mainnet.Privkey
})
Privkey.Testnet = inject({
  Constants: require('./constants').Testnet.Privkey
})
module.exports = Privkey
