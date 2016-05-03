/**
 * Transaction
 * ===========
 *
 * A bitcoin transaction.
 */
'use strict'
let dependencies = {
  BN: require('./bn'),
  BR: require('./br'),
  BW: require('./bw'),
  ECDSA: require('./ecdsa'),
  Hash: require('./hash'),
  Script: require('./script'),
  Sig: require('./sig'),
  Struct: require('./struct'),
  Txin: require('./txin'),
  Txout: require('./txout'),
  Varint: require('./varint'),
  Workers: require('./workers'),
  asink: require('asink')
}

let inject = function (deps) {
  let BN = deps.BN
  let BR = deps.BR
  let BW = deps.BW
  let ECDSA = deps.ECDSA
  let Hash = deps.Hash
  let Script = deps.Script
  let Sig = deps.Sig
  let Struct = deps.Struct
  let Txin = deps.Txin
  let Txout = deps.Txout
  let Varint = deps.Varint
  let Workers = deps.Workers
  let asink = deps.asink

  function Tx (version, txinsvi, txins, txoutsvi, txouts, nlocktime) {
    if (!(this instanceof Tx)) {
      return new Tx(version, txinsvi, txins, txoutsvi, txouts, nlocktime)
    }
    if (typeof version === 'number') {
      this.initialize()
      this.fromObject({version, txinsvi, txins, txoutsvi, txouts, nlocktime})
    } else if (Buffer.isBuffer(version)) {
      // not necessary to initialize, since everything should be overwritten
      let txbuf = version
      this.fromBuffer(txbuf)
    } else if (version) {
      this.initialize()
      let obj = version
      this.fromObject(obj)
    } else {
      this.initialize()
    }
  }

  Tx.prototype = Object.create(Struct.prototype)
  Tx.prototype.constructor = Tx

  Tx.MAX_MONEY = 21000000 * 1e8

  Tx.prototype.initialize = function () {
    this.version = 1
    this.txinsvi = Varint(0)
    this.txins = []
    this.txoutsvi = Varint(0)
    this.txouts = []
    this.nlocktime = 0
    return this
  }

  Tx.prototype.fromJSON = function (json) {
    let txins = []
    json.txins.forEach(function (txin) {
      txins.push(Txin().fromJSON(txin))
    })
    let txouts = []
    json.txouts.forEach(function (txout) {
      txouts.push(Txout().fromJSON(txout))
    })
    this.fromObject({
      version: json.version,
      txinsvi: Varint().fromJSON(json.txinsvi),
      txins: txins,
      txoutsvi: Varint().fromJSON(json.txoutsvi),
      txouts: txouts,
      nlocktime: json.nlocktime
    })
    return this
  }

  Tx.prototype.toJSON = function () {
    let txins = []
    this.txins.forEach(function (txin) {
      txins.push(txin.toJSON())
    })
    let txouts = []
    this.txouts.forEach(function (txout) {
      txouts.push(txout.toJSON())
    })
    return {
      version: this.version,
      txinsvi: this.txinsvi.toJSON(),
      txins: txins,
      txoutsvi: this.txoutsvi.toJSON(),
      txouts: txouts,
      nlocktime: this.nlocktime
    }
  }

  Tx.prototype.fromBR = function (br) {
    this.version = br.readUInt32LE()
    this.txinsvi = Varint(br.readVarintBuf())
    let txinsnum = this.txinsvi.toNumber()
    this.txins = []
    for (let i = 0; i < txinsnum; i++) {
      this.txins.push(Txin().fromBR(br))
    }
    this.txoutsvi = Varint(br.readVarintBuf())
    let txoutsnum = this.txoutsvi.toNumber()
    this.txouts = []
    for (let i = 0; i < txoutsnum; i++) {
      this.txouts.push(Txout().fromBR(br))
    }
    this.nlocktime = br.readUInt32LE()
    return this
  }

  Tx.prototype.toBW = function (bw) {
    if (!bw) {
      bw = new BW()
    }
    bw.writeUInt32LE(this.version)
    bw.write(this.txinsvi.buf)
    for (let i = 0; i < this.txins.length; i++) {
      this.txins[i].toBW(bw)
    }
    bw.write(this.txoutsvi.buf)
    for (let i = 0; i < this.txouts.length; i++) {
      this.txouts[i].toBW(bw)
    }
    bw.writeUInt32LE(this.nlocktime)
    return bw
  }

  Tx.prototype.sighash = function (nhashtype, nin, subscript) {
    let txcopy = Tx(this.toBuffer())

    subscript = Script().fromBuffer(subscript.toBuffer())
    subscript.removeCodeseparators()

    for (let i = 0; i < txcopy.txins.length; i++) {
      txcopy.txins[i] = Txin(txcopy.txins[i].toBuffer()).setScript(Script())
    }

    txcopy.txins[nin] = Txin(txcopy.txins[nin].toBuffer()).setScript(subscript)

    if ((nhashtype & 31) === Sig.SIGHASH_NONE) {
      txcopy.txouts.length = 0
      txcopy.txoutsvi = Varint(0)

      for (let i = 0; i < txcopy.txins.length; i++) {
        if (i !== nin) {
          txcopy.txins[i].seqnum = 0
        }
      }
    } else if ((nhashtype & 31) === Sig.SIGHASH_SINGLE) {
      // The SIGHASH_SINGLE bug.
      // https://bitcointalk.org/index.php?topic=260595.0
      if (nin > txcopy.txouts.length - 1) {
        return new Buffer('0000000000000000000000000000000000000000000000000000000000000001', 'hex')
      }

      txcopy.txouts.length = nin + 1
      txcopy.txoutsvi = Varint(nin + 1)

      for (let i = 0; i < txcopy.txouts.length; i++) {
        if (i < nin) {
          txcopy.txouts[i] = Txout(BN().fromBuffer(new Buffer('ffffffffffffffff', 'hex')), Script())
        }
      }

      for (let i = 0; i < txcopy.txins.length; i++) {
        if (i !== nin) {
          txcopy.txins[i].seqnum = 0
        }
      }
    }
    // else, SIGHASH_ALL

    if (nhashtype & Sig.SIGHASH_ANYONECANPAY) {
      txcopy.txins[0] = txcopy.txins[nin]
      txcopy.txins.length = 1
      txcopy.txinsvi = Varint(1)
    }

    let buf = BW().write(txcopy.toBuffer()).writeInt32LE(nhashtype).toBuffer()
    return BR(Hash.sha256sha256(buf)).readReverse()
  }

  Tx.prototype.asyncSighash = function (nhashtype, nin, subscript) {
    return asink(function * () {
      let workersResult = yield Workers.asyncObjectMethod(this, 'sighash', [nhashtype, nin, subscript])
      return workersResult.resbuf
    }, this)
  }

  // This function returns a signature but does not update any inputs
  Tx.prototype.sign = function (keypair, nhashtype, nin, subscript) {
    let hashbuf = this.sighash(nhashtype, nin, subscript)
    let sig = ECDSA.sign(hashbuf, keypair, 'little').fromObject({nhashtype: nhashtype})
    return sig
  }

  Tx.prototype.asyncSign = function (keypair, nhashtype, nin, subscript) {
    return asink(function * () {
      let workersResult = yield Workers.asyncObjectMethod(this, 'sign', [keypair, nhashtype, nin, subscript])
      return Sig().fromFastBuffer(workersResult.resbuf)
    }, this)
  }

  // This function takes a signature as input and does not parse any inputs
  Tx.prototype.verify = function (sig, pubkey, nin, subscript) {
    let hashbuf = this.sighash(sig.nhashtype, nin, subscript)
    return ECDSA.verify(hashbuf, sig, pubkey, 'little')
  }

  Tx.prototype.asyncVerify = function (sig, pubkey, nin, subscript) {
    return asink(function * () {
      let workersResult = yield Workers.asyncObjectMethod(this, 'verify', [sig, pubkey, nin, subscript])
      return JSON.parse(workersResult.resbuf.toString())
    }, this)
  }

  Tx.prototype.hash = function () {
    return Hash.sha256sha256(this.toBuffer())
  }

  Tx.prototype.asyncHash = function () {
    return asink(function * () {
      let workersResult = yield Workers.asyncObjectMethod(this, 'hash', [])
      return workersResult.resbuf
    }, this)
  }

  Tx.prototype.id = function () {
    return BR(this.hash()).readReverse()
  }

  Tx.prototype.asyncId = function () {
    return asink(function * () {
      let workersResult = yield Workers.asyncObjectMethod(this, 'id', [])
      return workersResult.resbuf
    }, this)
  }

  Tx.prototype.addTxin = function (txhashbuf, txoutnum, script, seqnum) {
    let txin
    if (txhashbuf instanceof Txin) {
      txin = txhashbuf
    } else {
      txin = Txin(txhashbuf, txoutnum, script, seqnum)
    }
    this.txins.push(txin)
    this.txinsvi = Varint(this.txinsvi.toNumber() + 1)
    return this
  }

  Tx.prototype.addTxout = function (valuebn, script) {
    let txout
    if (valuebn instanceof Txout) {
      txout = valuebn
    } else {
      txout = Txout(valuebn, script)
    }
    this.txouts.push(txout)
    this.txoutsvi = Varint(this.txoutsvi.toNumber() + 1)
    return this
  }

  /**
   * Analagous to bitcoind's IsCoinBase function in transaction.h
   */
  Tx.prototype.isCoinbase = function () {
    return (this.txins.length === 1 && this.txins[0].hasNullInput())
  }

  return Tx
}

inject = require('injecter')(inject, dependencies)
let Tx = inject()
module.exports = Tx
