/**
 * BIP32: HD Wallets
 * =================
 *
 * BIP32 is hierarchical deterministic wallets. The standard way to use this is:
 * let bip32 = BIP32().fromRandom()
 * let bip32 = BIP32().fromSeed(buf)
 * let bip32 = BIP32().fromString(string)
 * let xprv = bip32.toString()
 * let xpub = bip32.toPublic().toString()
 *
 * This code was originally copied from here:
 *
 * https://github.com/sarchar/brainwallet.github.com
 *
 * It has faced mostly cosmetic alterations since it was copied.
 */
'use strict'
let dependencies = {
  Base58Check: require('./base58check'),
  BN: require('./bn'),
  BW: require('./bw'),
  Constants: require('./constants').Default.BIP32,
  Hash: require('./hash'),
  Pubkey: require('./pubkey'),
  Privkey: require('./privkey'),
  Point: require('./point'),
  Random: require('./random'),
  Struct: require('./struct')
}

let inject = function (deps) {
  let Base58Check = deps.Base58Check
  let BN = deps.BN
  let BW = deps.BW
  let Constants = deps.Constants
  let Hash = deps.Hash
  let Pubkey = deps.Pubkey
  let Privkey = deps.Privkey
  let Point = deps.Point
  let Random = deps.Random
  let Struct = deps.Struct

  function BIP32 (version, depth, parentfingerprint, childindex, chaincode, privkey, pubkey) {
    if (!(this instanceof BIP32)) {
      return new BIP32(version, depth, parentfingerprint, childindex, chaincode, privkey, pubkey)
    }
    this.fromObject({version, depth, parentfingerprint, childindex, chaincode, privkey, pubkey})
  }

  BIP32.prototype = Object.create(Struct.prototype)
  BIP32.prototype.constructor = BIP32

  BIP32.prototype.fromRandom = function () {
    this.version = Constants.privkey
    this.depth = 0x00
    this.parentfingerprint = new Buffer([0, 0, 0, 0])
    this.childindex = 0
    this.chaincode = Random.getRandomBuffer(32)
    this.privkey = Privkey().fromRandom()
    this.pubkey = Pubkey().fromPrivkey(this.privkey)
    return this
  }

  BIP32.prototype.fromString = function (str) {
    return this.fromBuffer(Base58Check.decode(str))
  }

  BIP32.prototype.fromSeed = function (bytes) {
    if (!Buffer.isBuffer(bytes)) {
      throw new Error('bytes must be a buffer')
    }
    if (bytes.length < 128 / 8) {
      throw new Error('Need more than 128 bytes of entropy')
    }
    if (bytes.length > 512 / 8) {
      throw new Error('More than 512 bytes of entropy is nonstandard')
    }
    let hash = Hash.sha512hmac(bytes, new Buffer('Bitcoin seed'))

    this.depth = 0x00
    this.parentfingerprint = new Buffer([0, 0, 0, 0])
    this.childindex = 0
    this.chaincode = hash.slice(32, 64)
    this.version = Constants.privkey
    this.privkey = Privkey().fromBN(BN().fromBuffer(hash.slice(0, 32)))
    this.pubkey = Pubkey().fromPrivkey(this.privkey)

    return this
  }

  BIP32.prototype.fromBuffer = function (buf) {
    // Both pub and private extended keys are 78 buf
    if (buf.length !== 78) {
      throw new Error('not enough data')
    }

    this.version = buf.slice(0, 4).readUInt32BE(0)
    this.depth = buf.slice(4, 5).readUInt8(0)
    this.parentfingerprint = buf.slice(5, 9)
    this.childindex = buf.slice(9, 13).readUInt32BE(0)
    this.chaincode = buf.slice(13, 45)

    let keyBytes = buf.slice(45, 78)

    let isPrivate = this.version === Constants.privkey
    let isPublic = this.version === Constants.pubkey

    if (isPrivate && keyBytes[0] === 0) {
      this.privkey = Privkey().fromBN(BN().fromBuffer(keyBytes.slice(1, 33)))
      this.pubkey = Pubkey().fromPrivkey(this.privkey)
    } else if (isPublic && (keyBytes[0] === 0x02 || keyBytes[0] === 0x03)) {
      this.pubkey = Pubkey().fromDER(keyBytes)
    } else {
      throw new Error('Invalid key')
    }

    return this
  }

  BIP32.prototype.derive = function (path) {
    let e = path.split('/')

    if (path === 'm') {
      return this
    }

    let bip32 = this
    for (let i in e) {
      let c = e[i]

      if (i === '0') {
        if (c !== 'm') throw new Error('invalid path')
        continue
      }

      if (parseInt(c.replace("'", ''), 10).toString() !== c.replace("'", '')) {
        throw new Error('invalid path')
      }

      let usePrivate = (c.length > 1) && (c[c.length - 1] === "'")
      let childindex = parseInt(usePrivate ? c.slice(0, c.length - 1) : c, 10) & 0x7fffffff

      if (usePrivate) {
        childindex += 0x80000000
      }

      bip32 = bip32.deriveChild(childindex)
    }

    return bip32
  }

  BIP32.prototype.deriveChild = function (i) {
    if (typeof i !== 'number') {
      throw new Error('i must be a number')
    }

    let ib = []
    ib.push((i >> 24) & 0xff)
    ib.push((i >> 16) & 0xff)
    ib.push((i >> 8) & 0xff)
    ib.push(i & 0xff)
    ib = new Buffer(ib)

    let usePrivate = (i & 0x80000000) !== 0

    let isPrivate = this.version === Constants.privkey

    if (usePrivate && (!this.privkey || !isPrivate)) {
      throw new Error('Cannot do private key derivation without private key')
    }

    let ret = null
    if (this.privkey) {
      let data = null

      if (usePrivate) {
        data = Buffer.concat([new Buffer([0]), this.privkey.bn.toBuffer({size: 32}), ib])
      } else {
        data = Buffer.concat([this.pubkey.toBuffer({size: 32}), ib])
      }

      let hash = Hash.sha512hmac(data, this.chaincode)
      let il = BN().fromBuffer(hash.slice(0, 32), {size: 32})
      let ir = hash.slice(32, 64)

      // ki = IL + kpar (mod n).
      let k = il.add(this.privkey.bn).mod(Point.getN())

      ret = BIP32()
      ret.chaincode = ir

      ret.privkey = Privkey().fromBN(k)
      ret.pubkey = Pubkey().fromPrivkey(ret.privkey)
    } else {
      let data = Buffer.concat([this.pubkey.toBuffer(), ib])
      let hash = Hash.sha512hmac(data, this.chaincode)
      let il = BN().fromBuffer(hash.slice(0, 32))
      let ir = hash.slice(32, 64)

      // Ki = (IL + kpar)*G = IL*G + Kpar
      let ilG = Point.getG().mul(il)
      let Kpar = this.pubkey.point
      let Ki = ilG.add(Kpar)
      let newpub = Pubkey()
      newpub.point = Ki

      ret = BIP32()
      ret.chaincode = ir

      ret.pubkey = newpub
    }

    ret.childindex = i
    let pubkeyhash = Hash.sha256ripemd160(this.pubkey.toBuffer())
    ret.parentfingerprint = pubkeyhash.slice(0, 4)
    ret.version = this.version
    ret.depth = this.depth + 1

    return ret
  }

  BIP32.prototype.toPublic = function () {
    let bip32 = BIP32().fromObject(this)
    bip32.version = Constants.pubkey
    bip32.privkey = undefined
    return bip32
  }

  BIP32.prototype.toBuffer = function () {
    let isPrivate = this.version === Constants.privkey
    let isPublic = this.version === Constants.pubkey
    if (isPrivate) {
      return BW()
        .writeUInt32BE(this.version)
        .writeUInt8(this.depth)
        .write(this.parentfingerprint)
        .writeUInt32BE(this.childindex)
        .write(this.chaincode)
        .writeUInt8(0)
        .write(this.privkey.bn.toBuffer({size: 32}))
        .toBuffer()
    } else if (isPublic) {
      return BW()
        .writeUInt32BE(this.version)
        .writeUInt8(this.depth)
        .write(this.parentfingerprint)
        .writeUInt32BE(this.childindex)
        .write(this.chaincode)
        .write(this.pubkey.toBuffer())
        .toBuffer()
    } else {
      throw new Error('invalid version byte')
    }
  }

  BIP32.prototype.toString = function () {
    return Base58Check.encode(this.toBuffer())
  }

  return BIP32
}

inject = require('./injector')(inject, dependencies)
let BIP32 = inject()
BIP32.Mainnet = inject({
  Privkey: require('./privkey').Mainnet,
  Constants: require('./constants').Mainnet.BIP32
})
BIP32.Testnet = inject({
  Privkey: require('./privkey').Testnet,
  Constants: require('./constants').Testnet.BIP32
})
module.exports = BIP32
