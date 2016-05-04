/**
 * Private Key
 * ===========
 *
 * A private key is used for signing transactions (or messages). The primary
 * way to use this is new PrivKey().fromRandom(), or new PrivKey().fromBuffer(buf).
 */
'use strict'
let dependencies = {
  Bn: require('./bn'),
  Point: require('./point'),
  Constants: require('./constants').Default.PrivKey,
  Base58Check: require('./base-58-check'),
  Random: require('./random'),
  Struct: require('./struct')
}

let inject = function (deps) {
  let Bn = deps.Bn
  let Point = deps.Point
  let Constants = deps.Constants
  let Base58Check = deps.Base58Check
  let Random = deps.Random
  let Struct = deps.Struct

  function PrivKey (bn, compressed) {
    if (!(this instanceof PrivKey)) {
      return new PrivKey(bn, compressed)
    }
    this.fromObject({bn, compressed})
  }

  PrivKey.prototype = Object.create(Struct.prototype)
  PrivKey.prototype.constructor = PrivKey

  PrivKey.prototype.fromJson = function (json) {
    this.fromString(json)
    return this
  }

  PrivKey.prototype.toJson = function () {
    return this.toString()
  }

  PrivKey.prototype.fromRandom = function () {
    let privbuf, bn, condition

    do {
      privbuf = Random.getRandomBuffer(32)
      bn = new Bn().fromBuffer(privbuf)
      condition = bn.lt(Point.getN())
    } while (!condition)

    this.fromObject({
      bn: bn,
      compressed: true
    })
    return this
  }

  PrivKey.prototype.toBuffer = function () {
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

  PrivKey.prototype.fromBuffer = function (buf) {
    if (buf.length === 1 + 32 + 1 && buf[1 + 32 + 1 - 1] === 1) {
      this.compressed = true
    } else if (buf.length === 1 + 32) {
      this.compressed = false
    } else {
      throw new Error('LEngth of privKey buffer must be 33 (uncompressed pubKey) or 34 (compressed pubKey)')
    }

    if (buf[0] !== Constants.version) {
      throw new Error('Invalid version byte')
    }

    return this.fromBn(new Bn().fromBuffer(buf.slice(1, 1 + 32)))
  }

  PrivKey.prototype.toBn = function () {
    return this.bn
  }

  PrivKey.prototype.fromBn = function (bn) {
    this.bn = bn
    return this
  }

  PrivKey.prototype.validate = function () {
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
  PrivKey.prototype.toWIF = function () {
    return Base58Check.encode(this.toBuffer())
  }

  /**
   * Input the private key from a Wallet Import Format (WIF) string.
   */
  PrivKey.prototype.fromWIF = function (str) {
    return this.fromBuffer(Base58Check.decode(str))
  }

  PrivKey.prototype.toString = function () {
    return this.toWIF()
  }

  PrivKey.prototype.fromString = function (str) {
    return this.fromWIF(str)
  }

  return PrivKey
}

inject = require('injecter')(inject, dependencies)
let PrivKey = inject()
PrivKey.MainNet = inject({
  Constants: require('./constants').MainNet.PrivKey
})
PrivKey.TestNet = inject({
  Constants: require('./constants').TestNet.PrivKey
})
module.exports = PrivKey
