/**
 * Bip32: HD Wallets
 * =================
 *
 * Bip32 is hierarchical deterministic wallets. The standard way to use this is:
 * let bip32 = new Bip32().fromRandom()
 * let bip32 = new Bip32().fromSeed(buf)
 * let bip32 = new Bip32().fromString(string)
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
  BN: require('./bn'),
  BW: require('./bw'),
  Base58Check: require('./base-58-check'),
  Constants: require('./constants').Default.Bip32,
  Hash: require('./hash'),
  Point: require('./point'),
  PrivKey: require('./priv-key'),
  PubKey: require('./pub-key'),
  Random: require('./random'),
  Struct: require('./struct'),
  Workers: require('./workers'),
  asink: require('asink')
}

let inject = function (deps) {
  let Base58Check = deps.Base58Check
  let BN = deps.BN
  let BW = deps.BW
  let Constants = deps.Constants
  let Hash = deps.Hash
  let PubKey = deps.PubKey
  let PrivKey = deps.PrivKey
  let Point = deps.Point
  let Random = deps.Random
  let Struct = deps.Struct
  let Workers = deps.Workers
  let asink = deps.asink

  function Bip32 (version, depth, parentfingerprint, childindex, chaincode, privKey, pubKey) {
    if (!(this instanceof Bip32)) {
      return new Bip32(version, depth, parentfingerprint, childindex, chaincode, privKey, pubKey)
    }
    this.fromObject({version, depth, parentfingerprint, childindex, chaincode, privKey, pubKey})
  }

  Bip32.prototype = Object.create(Struct.prototype)
  Bip32.prototype.constructor = Bip32

  Bip32.prototype.fromRandom = function () {
    this.version = Constants.privKey
    this.depth = 0x00
    this.parentfingerprint = new Buffer([0, 0, 0, 0])
    this.childindex = 0
    this.chaincode = Random.getRandomBuffer(32)
    this.privKey = new PrivKey().fromRandom()
    this.pubKey = new PubKey().fromPrivKey(this.privKey)
    return this
  }

  Bip32.prototype.fromString = function (str) {
    return this.fromBuffer(Base58Check.decode(str))
  }

  /**
   * Use workers to convert a bip32 string into a bip32 object without
   * blocking.
   */
  Bip32.prototype.asyncFromString = function (str) {
    return asink(function * () {
      let args = [str]
      let workersResult = yield Workers.asyncObjectMethod(this, 'fromString', args)
      return this.fromFastBuffer(workersResult.resbuf)
    }, this)
  }

  Bip32.prototype.fromSeed = function (bytes) {
    if (!Buffer.isBuffer(bytes)) {
      throw new Error('bytes must be a buffer')
    }
    if (bytes.length < 128 / 8) {
      throw new Error('Need more than 128 bytes of entropy')
    }
    if (bytes.length > 512 / 8) {
      throw new Error('More than 512 bytes of entropy is nonstandard')
    }
    let hash = Hash.sha512Hmac(bytes, new Buffer('Bitcoin seed'))

    this.depth = 0x00
    this.parentfingerprint = new Buffer([0, 0, 0, 0])
    this.childindex = 0
    this.chaincode = hash.slice(32, 64)
    this.version = Constants.privKey
    this.privKey = new PrivKey().fromBn(BN().fromBuffer(hash.slice(0, 32)))
    this.pubKey = new PubKey().fromPrivKey(this.privKey)

    return this
  }

  Bip32.prototype.asyncFromSeed = function (bytes) {
    return asink(function * () {
      let workersResult = yield Workers.asyncObjectMethod(this, 'fromSeed', [bytes])
      return this.fromFastBuffer(workersResult.resbuf)
    }, this)
  }

  Bip32.prototype.fromBuffer = function (buf) {
    // Both pub and private extended keys are 78 buf
    if (buf.length !== 78) {
      throw new Error('incorrect bip32 data length')
    }

    this.version = buf.slice(0, 4).readUInt32BE(0)
    this.depth = buf.slice(4, 5).readUInt8(0)
    this.parentfingerprint = buf.slice(5, 9)
    this.childindex = buf.slice(9, 13).readUInt32BE(0)
    this.chaincode = buf.slice(13, 45)

    let keyBytes = buf.slice(45, 78)

    let isPrivate = this.version === Constants.privKey
    let isPublic = this.version === Constants.pubKey

    if (isPrivate && keyBytes[0] === 0) {
      this.privKey = new PrivKey().fromBn(BN().fromBuffer(keyBytes.slice(1, 33)))
      this.pubKey = new PubKey().fromPrivKey(this.privKey)
    } else if (isPublic && (keyBytes[0] === 0x02 || keyBytes[0] === 0x03)) {
      this.pubKey = new PubKey().fromDer(keyBytes)
    } else {
      throw new Error('Invalid key')
    }

    return this
  }

  /**
   * This is a faster version of .fromBuffer that reads in the output from
   * .toFastBuffer rather than from .toBuffer. .toFastBuffer outputs almost the
   * same thing as .toBuffer, except the public key is uncompressed. That makes
   * it larger, but also means that point multiplication doesn't have to be
   * used to derive the y value. So reading it in is faster. The only thing we
   * have to do is explicitely set the "compressed" value of public key to true
   * after reading it in. That is because although .toFastBuffer and
   * .fromFastBuffer transmit the public key in uncompressed form, we want it
   * to be set to compressed when stored in memory.
   */
  Bip32.prototype.fromFastBuffer = function (buf) {
    if (buf.length === 0) {
      return this
    }
    if (buf.length !== 78 && buf.length !== 78 + 33) {
      throw new Error('incorrect bip32 fastBuffer data length: ' + buf.length)
    }

    this.version = buf.slice(0, 4).readUInt32BE(0)
    this.depth = buf.slice(4, 5).readUInt8(0)
    this.parentfingerprint = buf.slice(5, 9)
    this.childindex = buf.slice(9, 13).readUInt32BE(0)
    this.chaincode = buf.slice(13, 45)

    let keyBytes = buf.slice(45, buf.length)

    let isPrivate = this.version === Constants.privKey
    let isPublic = this.version === Constants.pubKey

    if (isPrivate && keyBytes[0] === 0 && buf.length === 78) {
      this.privKey = new PrivKey().fromBn(BN().fromBuffer(keyBytes.slice(1, 33)))
      this.pubKey = new PubKey().fromPrivKey(this.privKey)
    } else if (isPublic && buf.length === 78 + 33) {
      this.pubKey = new PubKey().fromFastBuffer(keyBytes)
      this.pubKey.compressed = true
    } else {
      throw new Error('Invalid key')
    }

    return this
  }

  Bip32.prototype.derive = function (path) {
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

  Bip32.prototype.asyncDerive = function (path) {
    return asink(function * () {
      let workersResult = yield Workers.asyncObjectMethod(this, 'derive', [path])
      return new Bip32().fromFastBuffer(workersResult.resbuf)
    }, this)
  }

  Bip32.prototype.deriveChild = function (i) {
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

    let isPrivate = this.version === Constants.privKey

    if (usePrivate && (!this.privKey || !isPrivate)) {
      throw new Error('Cannot do private key derivation without private key')
    }

    let ret = null
    if (this.privKey) {
      let data = null

      if (usePrivate) {
        data = Buffer.concat([new Buffer([0]), this.privKey.bn.toBuffer({size: 32}), ib])
      } else {
        data = Buffer.concat([this.pubKey.toBuffer({size: 32}), ib])
      }

      let hash = Hash.sha512Hmac(data, this.chaincode)
      let il = BN().fromBuffer(hash.slice(0, 32), {size: 32})
      let ir = hash.slice(32, 64)

      // ki = IL + kpar (mod n).
      let k = il.add(this.privKey.bn).mod(Point.getN())

      ret = new Bip32()
      ret.chaincode = ir

      ret.privKey = new PrivKey().fromBn(k)
      ret.pubKey = new PubKey().fromPrivKey(ret.privKey)
    } else {
      let data = Buffer.concat([this.pubKey.toBuffer(), ib])
      let hash = Hash.sha512Hmac(data, this.chaincode)
      let il = BN().fromBuffer(hash.slice(0, 32))
      let ir = hash.slice(32, 64)

      // Ki = (IL + kpar)*G = IL*G + Kpar
      let ilG = Point.getG().mul(il)
      let Kpar = this.pubKey.point
      let Ki = ilG.add(Kpar)
      let newpub = new PubKey()
      newpub.point = Ki

      ret = new Bip32()
      ret.chaincode = ir

      ret.pubKey = newpub
    }

    ret.childindex = i
    let pubKeyhash = Hash.sha256ripemd160(this.pubKey.toBuffer())
    ret.parentfingerprint = pubKeyhash.slice(0, 4)
    ret.version = this.version
    ret.depth = this.depth + 1

    return ret
  }

  Bip32.prototype.toPublic = function () {
    let bip32 = new Bip32().fromObject(this)
    bip32.version = Constants.pubKey
    bip32.privKey = undefined
    return bip32
  }

  Bip32.prototype.toBuffer = function () {
    let isPrivate = this.version === Constants.privKey
    let isPublic = this.version === Constants.pubKey
    if (isPrivate) {
      return BW()
        .writeUInt32BE(this.version)
        .writeUInt8(this.depth)
        .write(this.parentfingerprint)
        .writeUInt32BE(this.childindex)
        .write(this.chaincode)
        .writeUInt8(0)
        .write(this.privKey.bn.toBuffer({size: 32}))
        .toBuffer()
    } else if (isPublic) {
      if (this.pubKey.compressed === false) {
        throw new Error('cannot convert bip32 to buffer if pubKey is not compressed')
      }
      return BW()
        .writeUInt32BE(this.version)
        .writeUInt8(this.depth)
        .write(this.parentfingerprint)
        .writeUInt32BE(this.childindex)
        .write(this.chaincode)
        .write(this.pubKey.toBuffer())
        .toBuffer()
    } else {
      throw new Error('bip32: invalid version byte')
    }
  }

  /**
   * This is the "fast" analog of toBuffer. It is almost the same as toBuffer,
   * and in fact is actually not any faster. The only difference is that it
   * adds an uncompressed rather than compressed public key to the output. This
   * is so that .fromFastBufer can read in the public key without having to do
   * fancy, slow point multiplication to derive the y value of the public key.
   * Thus, although .toFastBuffer is not any faster, .fromFastBuffer is faster.
   */
  Bip32.prototype.toFastBuffer = function () {
    if (!this.version) {
      return new Buffer(0)
    }
    let isPrivate = this.version === Constants.privKey
    let isPublic = this.version === Constants.pubKey
    if (isPrivate) {
      return BW()
        .writeUInt32BE(this.version)
        .writeUInt8(this.depth)
        .write(this.parentfingerprint)
        .writeUInt32BE(this.childindex)
        .write(this.chaincode)
        .writeUInt8(0)
        .write(this.privKey.bn.toBuffer({size: 32}))
        .toBuffer()
    } else if (isPublic) {
      return BW()
        .writeUInt32BE(this.version)
        .writeUInt8(this.depth)
        .write(this.parentfingerprint)
        .writeUInt32BE(this.childindex)
        .write(this.chaincode)
        .write(this.pubKey.toFastBuffer())
        .toBuffer()
    } else {
      throw new Error('bip32: invalid version byte')
    }
  }

  Bip32.prototype.toString = function () {
    return Base58Check.encode(this.toBuffer())
  }

  /**
   * Use workers to convert a bip32 object into a bip32 string without
   * blocking.
   */
  Bip32.prototype.asyncToString = function () {
    return asink(function * () {
      let workersResult = yield Workers.asyncObjectMethod(this, 'toString', arguments)
      return JSON.parse(workersResult.resbuf.toString())
    }, this)
  }

  Bip32.prototype.isPrivate = function () {
    return this.version === Constants.privKey
  }

  return Bip32
}

inject = require('injecter')(inject, dependencies)
let Bip32 = inject()
Bip32.MainNet = inject({
  PrivKey: require('./priv-key').MainNet,
  Constants: require('./constants').MainNet.Bip32
})
Bip32.TestNet = inject({
  PrivKey: require('./priv-key').TestNet,
  Constants: require('./constants').TestNet.Bip32
})
module.exports = Bip32
