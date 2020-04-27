/**
 * Bitcoin Signed Message
 * ======================
 *
 * "Bitcoin Signed Message" just refers to a standard way of signing and
 * verifying an arbitrary message. The standard way to do this involves using a
 * "Bitcoin Signed Message:\n" prefix, which this code does. You are probably
 * interested in the static Bsm.sign( ... ) and Bsm.verify( ... ) functions,
 * which deal with a base64 string representing the compressed format of a
 * signature.
 */
'use strict'

let Address = require('./address')
let Bw = require('./bw')
let cmp = require('./cmp')
let Ecdsa = require('./ecdsa')
let Hash = require('./hash')
let KeyPair = require('./key-pair')
let Sig = require('./sig')
let Struct = require('./struct')
let Workers = require('./workers')

class Bsm extends Struct {
  constructor (messageBuf, keyPair, sig, address, verified) {
    super({ messageBuf, keyPair, sig, address, verified })
  }

  static magicHash (messageBuf) {
    if (!Buffer.isBuffer(messageBuf)) {
      throw new Error('messageBuf must be a buffer')
    }
    let bw = new Bw()
    bw.writeVarIntNum(Bsm.magicBytes.length)
    bw.write(Bsm.magicBytes)
    bw.writeVarIntNum(messageBuf.length)
    bw.write(messageBuf)
    let buf = bw.toBuffer()

    let hashBuf = Hash.sha256Sha256(buf)

    return hashBuf
  }

  static async asyncMagicHash (messageBuf) {
    let args = [messageBuf]
    let workersResult = await Workers.asyncClassMethod(Bsm, 'magicHash', args)
    return workersResult.resbuf
  }

  static sign (messageBuf, keyPair) {
    let m = new Bsm(messageBuf, keyPair)
    m.sign()
    let sigbuf = m.sig.toCompact()
    let sigstr = sigbuf.toString('base64')
    return sigstr
  }

  static async asyncSign (messageBuf, keyPair) {
    let args = [messageBuf, keyPair]
    let workersResult = await Workers.asyncClassMethod(Bsm, 'sign', args)
    let sigstr = JSON.parse(workersResult.resbuf.toString())
    return sigstr
  }

  static verify (messageBuf, sigstr, address) {
    let sigbuf = Buffer.from(sigstr, 'base64')
    let message = new Bsm()
    message.messageBuf = messageBuf
    message.sig = new Sig().fromCompact(sigbuf)
    message.address = address

    return message.verify().verified
  }

  static async asyncVerify (messageBuf, sigstr, address) {
    let args = [messageBuf, sigstr, address]
    let workersResult = await Workers.asyncClassMethod(Bsm, 'verify', args)
    let res = JSON.parse(workersResult.resbuf.toString())
    return res
  }

  sign () {
    let hashBuf = Bsm.magicHash(this.messageBuf)
    let ecdsa = new Ecdsa().fromObject({
      hashBuf: hashBuf,
      keyPair: this.keyPair
    })
    ecdsa.sign()
    ecdsa.calcrecovery()
    this.sig = ecdsa.sig
    return this
  }

  verify () {
    let hashBuf = Bsm.magicHash(this.messageBuf)

    let ecdsa = new Ecdsa()
    ecdsa.hashBuf = hashBuf
    ecdsa.sig = this.sig
    ecdsa.keyPair = new KeyPair()
    ecdsa.keyPair.pubKey = ecdsa.sig2PubKey()

    if (!ecdsa.verify()) {
      this.verified = false
      return this
    }

    let address = new Address().fromPubKey(
      ecdsa.keyPair.pubKey,
      undefined,
      this.sig.compressed
    )
    // TODO: what if livenet/testnet mismatch?
    if (cmp(address.hashBuf, this.address.hashBuf)) {
      this.verified = true
    } else {
      this.verified = false
    }

    return this
  }
}

Bsm.magicBytes = Buffer.from('Bitcoin Signed Message:\n')

// TODO: Discuss whether this needs to be supported, it is not used anywhere
// Bsm.Mainnet = inject({
//   KeyPair: require('./key-pair').Mainnet
// })
// Bsm.Testnet = inject({
//   KeyPair: require('./key-pair').Testnet
// })

module.exports = Bsm
