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
 * let address = Address.TestNet()
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

  function Address (version, hashBuf) {
    if (!(this instanceof Address)) {
      return new Address(version, hashBuf)
    }
    this.fromObject({version, hashBuf})
  }

  Address.prototype = Object.create(Struct.prototype)
  Address.prototype.constructor = Address

  Address.prototype.fromBuffer = function (buf) {
    if (buf.length !== 1 + 20) {
      throw new Error('address buffers must be exactly 21 bytes')
    }
    if (buf[0] !== Constants.pubKeyHash && buf[0] !== Constants.scripthash) {
      throw new Error('address: invalid version byte')
    }
    this.version = buf[0]
    this.hashBuf = buf.slice(1)
    return this
  }

  Address.prototype.fromPubKeyHashBuf = function (hashBuf) {
    this.hashBuf = hashBuf
    this.version = Constants['pubKeyHash']
    return this
  }

  Address.prototype.fromPubKey = function (pubKey) {
    let hashBuf = Hash.sha256ripemd160(pubKey.toBuffer())
    return this.fromPubKeyHashBuf(hashBuf)
  }

  Address.prototype.asyncFromPubKey = function (pubKey) {
    return asink(function * () {
      let args = [pubKey]
      let workersResult = yield Workers.asyncObjectMethod(this, 'fromPubKey', args)
      return this.fromFastBuffer(workersResult.resbuf)
    }, this)
  }

  Address.prototype.fromPrivKey = function (privKey) {
    let pubKey = new PubKey().fromPrivKey(privKey)
    let hashBuf = Hash.sha256ripemd160(pubKey.toBuffer())
    return this.fromPubKeyHashBuf(hashBuf)
  }

  Address.prototype.asyncFromPrivKey = function (privKey) {
    return asink(function * () {
      let args = [privKey]
      let workersResult = yield Workers.asyncObjectMethod(this, 'fromPrivKey', args)
      return this.fromFastBuffer(workersResult.resbuf)
    }, this)
  }

  Address.prototype.fromRedeemScriptHashBuf = function (hashBuf) {
    this.hashBuf = hashBuf
    let typestr = 'scripthash'
    this.version = Constants[typestr]
    return this
  }

  Address.prototype.fromRedeemScript = function (script) {
    let hashBuf = Hash.sha256ripemd160(script.toBuffer())
    return this.fromRedeemScriptHashBuf(hashBuf)
  }

  Address.prototype.asyncFromRedeemScript = function (script) {
    return asink(function * () {
      let args = [script]
      let workersResult = yield Workers.asyncObjectMethod(this, 'fromRedeemScript', args)
      return this.fromFastBuffer(workersResult.resbuf)
    }, this)
  }

  Address.prototype.fromString = function (str) {
    let buf = Base58Check.decode(str)
    return this.fromBuffer(buf)
  }

  Address.prototype.asyncFromString = function (str) {
    return asink(function * () {
      let args = [str]
      let workersResult = yield Workers.asyncObjectMethod(this, 'fromString', args)
      return this.fromFastBuffer(workersResult.resbuf)
    }, this)
  }

  Address.isValid = function (addrstr) {
    let address
    try {
      address = new Address().fromString(addrstr)
    } catch (e) {
      return false
    }
    return address.isValid()
  }

  Address.prototype.isValid = function () {
    try {
      this.validate()
      return true
    } catch (e) {
      return false
    }
  }

  Address.prototype.type = function () {
    if (this.version === Constants['pubKeyHash']) {
      return 'pubKeyHash'
    } else if (this.version === Constants['scripthash']) {
      return 'scripthash'
    } else {
      return 'unknown'
    }
  }

  Address.prototype.toScript = function () {
    let type = this.type()
    let script
    if (type === 'pubKeyHash') {
      script = new Script()
      script.writeOpCode(OpCode.OP_DUP)
      script.writeOpCode(OpCode.OP_HASH160)
      script.writeBuffer(this.hashBuf)
      script.writeOpCode(OpCode.OP_EQUALVERIFY)
      script.writeOpCode(OpCode.OP_CHECKSIG)
    } else if (type === 'scripthash') {
      script = new Script()
      script.writeOpCode(OpCode.OP_HASH160)
      script.writeBuffer(this.hashBuf)
      script.writeOpCode(OpCode.OP_EQUAL)
    } else {
      throw new Error('script must be either pubKeyHash or scripthash')
    }
    return script
  }

  Address.prototype.toBuffer = function () {
    let versionbuf = new Buffer([this.version])
    let buf = Buffer.concat([versionbuf, this.hashBuf])
    return buf
  }

  Address.prototype.toString = function () {
    return Base58Check.encode(this.toBuffer())
  }

  Address.prototype.asyncToString = function () {
    return asink(function * () {
      let args = []
      let workersResult = yield Workers.asyncObjectMethod(this, 'toString', args)
      return JSON.parse(workersResult.resbuf.toString())
    }, this)
  }

  Address.prototype.validate = function () {
    if (!Buffer.isBuffer(this.hashBuf) || this.hashBuf.length !== 20) {
      throw new Error('hashBuf must be a buffer of 20 bytes')
    }
    if (this.version !== Constants['pubKeyHash'] &&
      this.version !== Constants['scripthash']) {
      throw new Error('invalid version')
    }
    return this
  }

  return Address
}

inject = require('injecter')(inject, dependencies)
let Address = inject()
Address.MainNet = inject({
  Constants: require('./constants').MainNet.Address
})
Address.TestNet = inject({
  Constants: require('./constants').TestNet.Address
})
module.exports = Address
