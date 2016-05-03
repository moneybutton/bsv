/**
 * Bitcoin Signed Message
 * ======================
 *
 * "Bitcoin Signed Message" just refers to a standard way of signing and
 * verifying an arbitrary message. The standard way to do this involves using a
 * "Bitcoin Signed Message:\n" prefix, which this code does. You are probably
 * interested in the static BSM.sign( ... ) and BSM.verify( ... ) functions,
 * which deal with a base64 string representing the compressed format of a
 * signature.
 */
'use strict'
let dependencies = {
  Address: require('./address'),
  BW: require('./bw'),
  cmp: require('./cmp'),
  ECDSA: require('./ecdsa'),
  Hash: require('./hash'),
  Keypair: require('./keypair'),
  Sig: require('./sig'),
  Struct: require('./struct'),
  Workers: require('./workers'),
  asink: require('asink')
}

let inject = function (deps) {
  let Address = deps.Address
  let BW = deps.BW
  let ECDSA = deps.ECDSA
  let Hash = deps.Hash
  let Keypair = deps.Keypair
  let Sig = deps.Sig
  let Struct = deps.Struct
  let Workers = deps.Workers
  let asink = deps.asink
  let cmp = deps.cmp

  function BSM (obj) {
    if (!(this instanceof BSM)) {
      return new BSM(obj)
    }
    if (obj) {
      this.fromObject(obj)
    }
  }

  BSM.prototype = Object.create(Struct.prototype)
  BSM.prototype.constructor = BSM

  BSM.magicBytes = new Buffer('Bitcoin Signed Message:\n')

  BSM.magicHash = function (messagebuf) {
    if (!Buffer.isBuffer(messagebuf)) {
      throw new Error('messagebuf must be a buffer')
    }
    let bw = new BW()
    bw.writeVarintNum(BSM.magicBytes.length)
    bw.write(BSM.magicBytes)
    bw.writeVarintNum(messagebuf.length)
    bw.write(messagebuf)
    let buf = bw.toBuffer()

    let hashbuf = Hash.sha256sha256(buf)

    return hashbuf
  }

  BSM.asyncMagicHash = function (messagebuf) {
    return asink(function * () {
      let args = [messagebuf]
      let workersResult = yield Workers.asyncClassMethod('BSM', 'magicHash', args)
      return workersResult.resbuf
    }, this)
  }

  BSM.sign = function (messagebuf, keypair) {
    let m = BSM({messagebuf: messagebuf, keypair: keypair})
    m.sign()
    let sigbuf = m.sig.toCompact()
    let sigstr = sigbuf.toString('base64')
    return sigstr
  }

  BSM.asyncSign = function (messagebuf, keypair) {
    return asink(function * () {
      let args = [messagebuf, keypair]
      let workersResult = yield Workers.asyncClassMethod('BSM', 'sign', args)
      let sigstr = JSON.parse(workersResult.resbuf.toString())
      return sigstr
    }, this)
  }

  BSM.verify = function (messagebuf, sigstr, address) {
    let sigbuf = new Buffer(sigstr, 'base64')
    let message = new BSM()
    message.messagebuf = messagebuf
    message.sig = Sig().fromCompact(sigbuf)
    message.address = address

    return message.verify().verified
  }

  BSM.asyncVerify = function (messagebuf, sigstr, address) {
    return asink(function * () {
      let args = [messagebuf, sigstr, address]
      let workersResult = Workers.asyncClassMethod('BSM', 'verify', args)
      let res = JSON.parse(workersResult.resbuf.toString())
      return res
    }, this)
  }

  BSM.prototype.sign = function () {
    let hashbuf = BSM.magicHash(this.messagebuf)
    let ecdsa = ECDSA().fromObject({hashbuf: hashbuf, keypair: this.keypair})
    ecdsa.sign()
    ecdsa.calcrecovery()
    this.sig = ecdsa.sig
    return this
  }

  BSM.prototype.verify = function () {
    let hashbuf = BSM.magicHash(this.messagebuf)

    let ecdsa = new ECDSA()
    ecdsa.hashbuf = hashbuf
    ecdsa.sig = this.sig
    ecdsa.keypair = new Keypair()
    ecdsa.keypair.pubkey = ecdsa.sig2pubkey()

    if (!ecdsa.verify()) {
      this.verified = false
      return this
    }

    let address = Address().fromPubkey(ecdsa.keypair.pubkey, undefined, this.sig.compressed)
    // TODO: what if livenet/testnet mismatch?
    if (cmp(address.hashbuf, this.address.hashbuf)) {
      this.verified = true
    } else {
      this.verified = false
    }

    return this
  }

  return BSM
}

inject = require('injecter')(inject, dependencies)
let BSM = inject()
BSM.Mainnet = inject({
  Keypair: require('./keypair').Mainnet
})
BSM.Testnet = inject({
  Keypair: require('./keypair').Testnet
})
module.exports = BSM
