/**
 * Bitcoin Address
 * ===============
 *
 * A bitcoin address. Normal use cases:
 * let address = new Address().fromPubKey(pubKey)
 * let address = new Address().fromString(string)
 * let string = address.toString()
 * let script = address.toTxOutScript()
 * let isValid = Address.isValid(string)
 *
 * Can also do testnet:
 * let address = Address.Testnet()
 *
 * Note that an Address and an Addr are two completely different things. An
 * Address is what you send bitcoin to. An Addr is an ip address and port that
 * you connect to over the internet.
 */
'use strict'

import { Base58Check } from './base-58-check'
import { Constants } from './constants'
import { Hash } from './hash'
import { OpCode } from './op-code'
import { PubKey } from './pub-key'
import { PrivKey } from './priv-key'
import { Script } from './script'
import { Struct } from './struct'
import { Workers } from './workers'

const DefaultConstants = Constants.Default.Address

class Address extends Struct {
  constructor (versionByteNum, hashBuf, constants = DefaultConstants) {
    super({ versionByteNum, hashBuf })
    this.Constants = constants
  }

  fromBuffer (buf) {
    if (buf.length !== 1 + 20) {
      throw new Error('address buffers must be exactly 21 bytes')
    }
    if (
      buf[0] !== this.Constants.pubKeyHash
    ) {
      throw new Error('address: invalid versionByteNum byte')
    }
    this.versionByteNum = buf[0]
    this.hashBuf = buf.slice(1)
    return this
  }

  fromPubKeyHashBuf (hashBuf) {
    this.hashBuf = hashBuf
    this.versionByteNum = this.Constants['pubKeyHash']
    return this
  }

  static fromPubKeyHashBuf (hashBuf) {
    return new this().fromPubKeyHashBuf(hashBuf)
  }

  fromPubKey (pubKey) {
    let hashBuf = Hash.sha256Ripemd160(pubKey.toBuffer())
    return this.fromPubKeyHashBuf(hashBuf)
  }

  static fromPubKey (pubKey) {
    return new this().fromPubKey(pubKey)
  }

  async asyncFromPubKey (pubKey) {
    let args = [pubKey]
    let workersResult = await Workers.asyncObjectMethod(
      this,
      'fromPubKey',
      args
    )
    return this.fromFastBuffer(workersResult.resbuf)
  }

  static asyncFromPubKey (pubKey) {
    return new this().asyncFromPubKey(pubKey)
  }

  fromPrivKey (privKey) {
    let pubKey = new PubKey().fromPrivKey(privKey)
    let hashBuf = Hash.sha256Ripemd160(pubKey.toBuffer())
    return this.fromPubKeyHashBuf(hashBuf)
  }

  static fromPrivKey (privKey) {
    return new this().fromPrivKey(privKey)
  }

  async asyncFromPrivKey (privKey) {
    let args = [privKey]
    let workersResult = await Workers.asyncObjectMethod(
      this,
      'fromPrivKey',
      args
    )
    return this.fromFastBuffer(workersResult.resbuf)
  }

  static asyncFromPrivKey (privKey) {
    return new this().fromPrivKey(privKey)
  }

  fromRandom () {
    let randomPrivKey = new PrivKey().fromRandom()
    return this.fromPrivKey(randomPrivKey)
  }

  static fromRandom () {
    return new this().fromRandom()
  }

  async asyncFromRandom () {
    let args = []
    let workersResult = await Workers.asyncObjectMethod(
      this,
      'fromRandom',
      args
    )
    return this.fromFastBuffer(workersResult.resbuf)
  }

  static asyncFromRandom () {
    return new this().fromRandom()
  }

  fromString (str) {
    let buf = Base58Check.decode(str)
    return this.fromBuffer(buf)
  }

  async asyncFromString (str) {
    let args = [str]
    let workersResult = await Workers.asyncObjectMethod(
      this,
      'fromString',
      args
    )
    return this.fromFastBuffer(workersResult.resbuf)
  }

  static asyncFromString (str) {
    return new this().asyncFromString(str)
  }

  static isValid (addrstr) {
    let address
    try {
      address = new Address().fromString(addrstr)
    } catch (e) {
      return false
    }
    return address.isValid()
  }

  isValid () {
    try {
      this.validate()
      return true
    } catch (e) {
      return false
    }
  }

  toTxOutScript () {
    let script

    script = new Script()
    script.writeOpCode(OpCode.OP_DUP)
    script.writeOpCode(OpCode.OP_HASH160)
    script.writeBuffer(this.hashBuf)
    script.writeOpCode(OpCode.OP_EQUALVERIFY)
    script.writeOpCode(OpCode.OP_CHECKSIG)

    return script
  }

  fromTxInScript (script) {
    let pubKeyHashBuf = Hash.sha256Ripemd160(script.chunks[1].buf)
    return this.fromPubKeyHashBuf(pubKeyHashBuf)
  }

  static fromTxInScript (script) {
    return new this().fromTxInScript(script)
  }

  fromTxOutScript (script) {
    return this.fromPubKeyHashBuf(script.chunks[2].buf)
  }

  static fromTxOutScript (script) {
    return new this().fromTxOutScript(script)
  }

  toBuffer () {
    let versionByteBuf = Buffer.from([this.versionByteNum])
    let buf = Buffer.concat([versionByteBuf, this.hashBuf])
    return buf
  }

  toJSON () {
    let json = {}
    if (this.hashBuf) {
      json.hashBuf = this.hashBuf.toString('hex')
    }
    if (typeof this.versionByteNum !== 'undefined') {
      json.versionByteNum = this.versionByteNum
    }
    return json
  }

  fromJSON (json) {
    if (json.hashBuf) {
      this.hashBuf = Buffer.from(json.hashBuf, 'hex')
    }
    if (typeof json.versionByteNum !== 'undefined') {
      this.versionByteNum = json.versionByteNum
    }
    return this
  }

  toString () {
    return Base58Check.encode(this.toBuffer())
  }

  async asyncToString () {
    let args = []
    let workersResult = await Workers.asyncObjectMethod(
      this,
      'toString',
      args
    )
    return JSON.parse(workersResult.resbuf.toString())
  }

  validate () {
    if (!Buffer.isBuffer(this.hashBuf) || this.hashBuf.length !== 20) {
      throw new Error('hashBuf must be a buffer of 20 bytes')
    }
    if (
      this.versionByteNum !== this.Constants['pubKeyHash']
    ) {
      throw new Error('invalid versionByteNum')
    }
    return this
  }
}

Address.Mainnet = class extends Address {
  constructor (versionByteNum, hashBuf) {
    super(versionByteNum, hashBuf, Constants.Mainnet.Address)
  }
}

Address.Testnet = class extends Address {
  constructor (versionByteNum, hashBuf) {
    super(versionByteNum, hashBuf, Constants.Testnet.Address)
  }
}

export { Address }
