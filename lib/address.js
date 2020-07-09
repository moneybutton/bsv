/**
 * Bitcoin Address
 * ===============
 *
 * A bitcoin address. Normal use cases:
 * const address = new Address().fromPubKey(pubKey)
 * const address = new Address().fromString(string)
 * const string = address.toString()
 * const script = address.toTxOutScript()
 * const isValid = Address.isValid(string)
 *
 * Can also do testnet:
 * const address = Address.Testnet()
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

class Address extends Struct {
  constructor (versionByteNum, hashBuf, constants = null) {
    super({ versionByteNum, hashBuf })
    constants = constants || Constants.Default.Address
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
    this.versionByteNum = this.Constants.pubKeyHash
    return this
  }

  static fromPubKeyHashBuf (hashBuf) {
    return new this().fromPubKeyHashBuf(hashBuf)
  }

  fromPubKey (pubKey) {
    const hashBuf = Hash.sha256Ripemd160(pubKey.toBuffer())
    return this.fromPubKeyHashBuf(hashBuf)
  }

  static fromPubKey (pubKey) {
    return new this().fromPubKey(pubKey)
  }

  async asyncFromPubKey (pubKey) {
    const args = [pubKey]
    const workersResult = await Workers.asyncObjectMethod(
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
    const pubKey = new PubKey().fromPrivKey(privKey)
    const hashBuf = Hash.sha256Ripemd160(pubKey.toBuffer())
    return this.fromPubKeyHashBuf(hashBuf)
  }

  static fromPrivKey (privKey) {
    return new this().fromPrivKey(privKey)
  }

  async asyncFromPrivKey (privKey) {
    const args = [privKey]
    const workersResult = await Workers.asyncObjectMethod(
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
    const randomPrivKey = new PrivKey().fromRandom()
    return this.fromPrivKey(randomPrivKey)
  }

  static fromRandom () {
    return new this().fromRandom()
  }

  async asyncFromRandom () {
    const args = []
    const workersResult = await Workers.asyncObjectMethod(
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
    const buf = Base58Check.decode(str)
    return this.fromBuffer(buf)
  }

  async asyncFromString (str) {
    const args = [str]
    const workersResult = await Workers.asyncObjectMethod(
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
    const script = new Script()
    script.writeOpCode(OpCode.OP_DUP)
    script.writeOpCode(OpCode.OP_HASH160)
    script.writeBuffer(this.hashBuf)
    script.writeOpCode(OpCode.OP_EQUALVERIFY)
    script.writeOpCode(OpCode.OP_CHECKSIG)

    return script
  }

  fromTxInScript (script) {
    const pubKeyHashBuf = Hash.sha256Ripemd160(script.chunks[1].buf || Buffer.from('00'.repeat(32), 'hex'))
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
    const versionByteBuf = Buffer.from([this.versionByteNum])
    const buf = Buffer.concat([versionByteBuf, this.hashBuf])
    return buf
  }

  toJSON () {
    const json = {}
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
    const args = []
    const workersResult = await Workers.asyncObjectMethod(
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
      this.versionByteNum !== this.Constants.pubKeyHash
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
