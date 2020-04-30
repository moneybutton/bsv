/**
 * Bitcoin Address
 * ===============
 *
 * A bitcoin address. Normal use cases:
 * let address = new Address().fromPubKey(pubKey)
 * let address = new Address().fromRedeemScript(script)
 * let address = new Address().fromString(string)
 * let string = address.toString()
 * let script = address.toScript()
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

let Base58Check = require('./base-58-check')
let defaultConstants = require('./constants').Default.Address
let Hash = require('./hash')
let OpCode = require('./op-code')
let PubKey = require('./pub-key')
let PrivKey = require('./priv-key')
let Script = require('./script')
let Struct = require('./struct')
let Workers = require('./workers')

class Address extends Struct {
  constructor (versionByteNum, hashBuf, constants = defaultConstants) {
    super({ versionByteNum, hashBuf })
    this.Constants = constants
  }

  fromBuffer (buf) {
    if (buf.length !== 1 + 20) {
      throw new Error('address buffers must be exactly 21 bytes')
    }
    if (
      buf[0] !== this.Constants.pubKeyHash &&
      buf[0] !== this.Constants.scriptHash &&
      buf[0] !== this.Constants.pubKeyHashCopay &&
      buf[0] !== this.Constants.scriptHashCopay
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

  fromRedeemScriptHashBuf (hashBuf) {
    this.hashBuf = hashBuf
    let typeStr = 'scriptHash'
    this.versionByteNum = this.Constants[typeStr]
    return this
  }

  static fromRedeemScriptHashBuf (hashBuf) {
    return new this().fromRedeemScriptHashBuf(hashBuf)
  }

  fromRedeemScript (script) {
    let hashBuf = Hash.sha256Ripemd160(script.toBuffer())
    return this.fromRedeemScriptHashBuf(hashBuf)
  }

  static fromRedeemScript (script) {
    return new this().fromRedeemScript(script)
  }

  async asyncFromRedeemScript (script) {
    let args = [script]
    let workersResult = await Workers.asyncObjectMethod(
      this,
      'fromRedeemScript',
      args
    )
    return this.fromFastBuffer(workersResult.resbuf)
  }

  static asyncFromRedeemScript (script) {
    return new this().asyncFromRedeemScript(script)
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

  isCopay () {
    if (
      this.versionByteNum === this.Constants['pubKeyHashCopay'] ||
      this.versionByteNum === this.Constants['scriptHashCopay']
    ) {
      return true
    }
    return false
  }

  toCopay () {
    let addr = this.clone()
    if (addr.versionByteNum === this.Constants['pubKeyHash']) {
      addr.versionByteNum = this.Constants['pubKeyHashCopay']
    } else if (addr.versionByteNum === this.Constants['scriptHash']) {
      addr.versionByteNum = this.Constants['scriptHashCopay']
    }
    return addr
  }

  type () {
    if (
      this.versionByteNum === this.Constants['pubKeyHash'] ||
      this.versionByteNum === this.Constants['pubKeyHashCopay']
    ) {
      return 'pubKeyHash'
    } else if (
      this.versionByteNum === this.Constants['scriptHash'] ||
      this.versionByteNum === this.Constants['scriptHashCopay']
    ) {
      return 'scriptHash'
    } else {
      return 'unknown'
    }
  }

  toScript () {
    let type = this.type()
    let script
    if (type === 'pubKeyHash') {
      script = new Script()
      script.writeOpCode(OpCode.OP_DUP)
      script.writeOpCode(OpCode.OP_HASH160)
      script.writeBuffer(this.hashBuf)
      script.writeOpCode(OpCode.OP_EQUALVERIFY)
      script.writeOpCode(OpCode.OP_CHECKSIG)
    } else if (type === 'scriptHash') {
      script = new Script()
      script.writeOpCode(OpCode.OP_HASH160)
      script.writeBuffer(this.hashBuf)
      script.writeOpCode(OpCode.OP_EQUAL)
    } else {
      throw new Error('script must be either pubKeyHash or scriptHash')
    }
    return script
  }

  fromScript (script) {
    if (script.isPubKeyHashOut()) {
      return this.fromPubKeyHashBuf(script.chunks[2].buf)
    } else if (script.isScriptHashOut()) {
      return this.fromRedeemScriptHashBuf(script.chunks[1].buf)
    }
    throw new Error('script does not have a known address type')
  }

  static fromScript (script) {
    return new this().fromScript(script)
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
      this.versionByteNum !== this.Constants['pubKeyHash'] &&
      this.versionByteNum !== this.Constants['scriptHash'] &&
      this.versionByteNum !== this.Constants['pubKeyHashCopay'] &&
      this.versionByteNum !== this.Constants['scriptHashCopay']
    ) {
      throw new Error('invalid versionByteNum')
    }
    return this
  }
}

module.exports = Address

Address.Testnet = require('./testnet-address')
Address.Mainnet = require('./mainnet-address')
