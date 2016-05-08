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
let dependencies = {
  Base58Check: require('./base-58-check'),
  Constants: require('./constants').Default.Address,
  Hash: require('./hash'),
  OpCode: require('./op-code'),
  PubKey: require('./pub-key'),
  Script: require('./script'),
  Struct: require('./struct'),
  Workers: require('./workers'),
  asink: require('asink')
}

let inject = function (deps) {
  let Base58Check = deps.Base58Check
  let Constants = deps.Constants
  let Hash = deps.Hash
  let OpCode = deps.OpCode
  let PubKey = deps.PubKey
  let Script = deps.Script
  let Struct = deps.Struct
  let Workers = deps.Workers
  let asink = deps.asink

  class Address extends Struct {
    constructor (versionByteNum, hashBuf) {
      super()
      this.fromObject({versionByteNum, hashBuf})
    }

    fromBuffer (buf) {
      if (buf.length !== 1 + 20) {
        throw new Error('address buffers must be exactly 21 bytes')
      }
      if (buf[0] !== Constants.pubKeyHash && buf[0] !== Constants.scriptHash) {
        throw new Error('address: invalid versionByteNum byte')
      }
      this.versionByteNum = buf[0]
      this.hashBuf = buf.slice(1)
      return this
    }

    fromPubKeyHashBuf (hashBuf) {
      this.hashBuf = hashBuf
      this.versionByteNum = Constants['pubKeyHash']
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

    asyncFromPubKey (pubKey) {
      return asink(function * () {
        let args = [pubKey]
        let workersResult = yield Workers.asyncObjectMethod(this, 'fromPubKey', args)
        return this.fromFastBuffer(workersResult.resbuf)
      }, this)
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

    asyncFromPrivKey (privKey) {
      return asink(function * () {
        let args = [privKey]
        let workersResult = yield Workers.asyncObjectMethod(this, 'fromPrivKey', args)
        return this.fromFastBuffer(workersResult.resbuf)
      }, this)
    }

    static asyncFromPrivKey (privKey) {
      return new this().fromPrivKey(privKey)
    }

    fromRedeemScriptHashBuf (hashBuf) {
      this.hashBuf = hashBuf
      let typeStr = 'scriptHash'
      this.versionByteNum = Constants[typeStr]
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

    asyncFromRedeemScript (script) {
      return asink(function * () {
        let args = [script]
        let workersResult = yield Workers.asyncObjectMethod(this, 'fromRedeemScript', args)
        return this.fromFastBuffer(workersResult.resbuf)
      }, this)
    }

    static asyncFromRedeemScript (script) {
      return new this().asyncFromRedeemScript(script)
    }

    fromString (str) {
      let buf = Base58Check.decode(str)
      return this.fromBuffer(buf)
    }

    asyncFromString (str) {
      return asink(function * () {
        let args = [str]
        let workersResult = yield Workers.asyncObjectMethod(this, 'fromString', args)
        return this.fromFastBuffer(workersResult.resbuf)
      }, this)
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

    type () {
      if (this.versionByteNum === Constants['pubKeyHash']) {
        return 'pubKeyHash'
      } else if (this.versionByteNum === Constants['scriptHash']) {
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

    toBuffer () {
      let versionByteBuf = new Buffer([this.versionByteNum])
      let buf = Buffer.concat([versionByteBuf, this.hashBuf])
      return buf
    }

    toString () {
      return Base58Check.encode(this.toBuffer())
    }

    asyncToString () {
      return asink(function * () {
        let args = []
        let workersResult = yield Workers.asyncObjectMethod(this, 'toString', args)
        return JSON.parse(workersResult.resbuf.toString())
      }, this)
    }

    validate () {
      if (!Buffer.isBuffer(this.hashBuf) || this.hashBuf.length !== 20) {
        throw new Error('hashBuf must be a buffer of 20 bytes')
      }
      if (this.versionByteNum !== Constants['pubKeyHash'] &&
        this.versionByteNum !== Constants['scriptHash']) {
        throw new Error('invalid versionByteNum')
      }
      return this
    }
  }

  return Address
}

inject = require('injecter')(inject, dependencies)
let Address = inject()
Address.Mainnet = inject({
  Constants: require('./constants').Mainnet.Address
})
Address.Testnet = inject({
  Constants: require('./constants').Testnet.Address
})
module.exports = Address
