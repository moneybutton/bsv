/**
 * Private Key
 * ===========
 *
 * A private key is used for signIng transactions (or messages). The primary
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

  class PrivKey extends Struct {
    constructor (bn, compressed) {
      super({bn, compressed})
    }

    fromJSON (json) {
      this.fromHex(json)
      return this
    }

    toJSON () {
      return this.toHex()
    }

    fromRandom () {
      let privBuf, bn, condition

      do {
        privBuf = Random.getRandomBuffer(32)
        bn = new Bn().fromBuffer(privBuf)
        condition = bn.lt(Point.getN())
      } while (!condition)

      this.fromObject({
        bn: bn,
        compressed: true
      })
      return this
    }

    static fromRandom () {
      return new this().fromRandom()
    }

    toBuffer () {
      let compressed = this.compressed

      if (compressed === undefined) {
        compressed = true
      }

      let privBuf = this.bn.toBuffer({size: 32})
      let buf
      if (compressed) {
        buf = Buffer.concat([new Buffer([Constants.versionByteNum]), privBuf, new Buffer([0x01])])
      } else {
        buf = Buffer.concat([new Buffer([Constants.versionByteNum]), privBuf])
      }

      return buf
    }

    fromBuffer (buf) {
      if (buf.length === 1 + 32 + 1 && buf[1 + 32 + 1 - 1] === 1) {
        this.compressed = true
      } else if (buf.length === 1 + 32) {
        this.compressed = false
      } else {
        throw new Error('LEngth of privKey buffer must be 33 (uncompressed pubKey) or 34 (compressed pubKey)')
      }

      if (buf[0] !== Constants.versionByteNum) {
        throw new Error('Invalid versionByteNum byte')
      }

      return this.fromBn(new Bn().fromBuffer(buf.slice(1, 1 + 32)))
    }

    toBn () {
      return this.bn
    }

    fromBn (bn) {
      this.bn = bn
      return this
    }

    static fromBn (bn) {
      return new this().fromBn(bn)
    }

    validate () {
      if (!this.bn.lt(Point.getN())) {
        throw new Error('Number must be less than N')
      }
      if (typeof this.compressed !== 'boolean') {
        throw new Error('Must specify whether the corresponding public key is compressed or not (true or false)')
      }
      return this
    }

    /**
     * Output the private key a Wallet Import Format (Wif) string.
     */
    toWif () {
      return Base58Check.encode(this.toBuffer())
    }

    /**
     * Input the private key from a Wallet Import Format (Wif) string.
     */
    fromWif (str) {
      return this.fromBuffer(Base58Check.decode(str))
    }

    static fromWif (str) {
      return new this().fromWif(str)
    }

    toString () {
      return this.toWif()
    }

    fromString (str) {
      return this.fromWif(str)
    }
  }

  return PrivKey
}

inject = require('injecter')(inject, dependencies)
let PrivKey = inject()
PrivKey.Mainnet = inject({
  Constants: require('./constants').Mainnet.PrivKey
})
PrivKey.Testnet = inject({
  Constants: require('./constants').Testnet.PrivKey
})
module.exports = PrivKey
