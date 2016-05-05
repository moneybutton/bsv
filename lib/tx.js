/**
 * Transaction
 * ===========
 *
 * A bitcoin transaction.
 */
'use strict'
let dependencies = {
  Bn: require('./bn'),
  Br: require('./br'),
  Bw: require('./bw'),
  Ecdsa: require('./ecdsa'),
  Hash: require('./hash'),
  Script: require('./script'),
  Sig: require('./sig'),
  Struct: require('./struct'),
  TxIn: require('./tx-in'),
  TxOut: require('./tx-out'),
  VarInt: require('./var-int'),
  Workers: require('./workers'),
  asink: require('asink')
}

let inject = function (deps) {
  let Bn = deps.Bn
  let Br = deps.Br
  let Bw = deps.Bw
  let Ecdsa = deps.Ecdsa
  let Hash = deps.Hash
  let Script = deps.Script
  let Sig = deps.Sig
  let Struct = deps.Struct
  let TxIn = deps.TxIn
  let TxOut = deps.TxOut
  let VarInt = deps.VarInt
  let Workers = deps.Workers
  let asink = deps.asink

  function Tx (version, txinsvi, txins, txoutsvi, txouts, nLockTime) {
    if (!(this instanceof Tx)) {
      return new Tx(version, txinsvi, txins, txoutsvi, txouts, nLockTime)
    }
    if (typeof version === 'number') {
      this.initialize()
      this.fromObject({version, txinsvi, txins, txoutsvi, txouts, nLockTime})
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
    this.txinsvi = new VarInt(0)
    this.txins = []
    this.txoutsvi = new VarInt(0)
    this.txouts = []
    this.nLockTime = 0
    return this
  }

  Tx.prototype.fromJson = function (json) {
    let txins = []
    json.txins.forEach(function (txin) {
      txins.push(new TxIn().fromJson(txin))
    })
    let txouts = []
    json.txouts.forEach(function (txout) {
      txouts.push(new TxOut().fromJson(txout))
    })
    this.fromObject({
      version: json.version,
      txinsvi: new VarInt().fromJson(json.txinsvi),
      txins: txins,
      txoutsvi: new VarInt().fromJson(json.txoutsvi),
      txouts: txouts,
      nLockTime: json.nLockTime
    })
    return this
  }

  Tx.prototype.toJson = function () {
    let txins = []
    this.txins.forEach(function (txin) {
      txins.push(txin.toJson())
    })
    let txouts = []
    this.txouts.forEach(function (txout) {
      txouts.push(txout.toJson())
    })
    return {
      version: this.version,
      txinsvi: this.txinsvi.toJson(),
      txins: txins,
      txoutsvi: this.txoutsvi.toJson(),
      txouts: txouts,
      nLockTime: this.nLockTime
    }
  }

  Tx.prototype.fromBr = function (br) {
    this.version = br.readUInt32LE()
    this.txinsvi = new VarInt(br.readVarIntBuf())
    let txinsnum = this.txinsvi.toNumber()
    this.txins = []
    for (let i = 0; i < txinsnum; i++) {
      this.txins.push(new TxIn().fromBr(br))
    }
    this.txoutsvi = new VarInt(br.readVarIntBuf())
    let txoutsnum = this.txoutsvi.toNumber()
    this.txouts = []
    for (let i = 0; i < txoutsnum; i++) {
      this.txouts.push(new TxOut().fromBr(br))
    }
    this.nLockTime = br.readUInt32LE()
    return this
  }

  Tx.prototype.toBw = function (bw) {
    if (!bw) {
      bw = new Bw()
    }
    bw.writeUInt32LE(this.version)
    bw.write(this.txinsvi.buf)
    for (let i = 0; i < this.txins.length; i++) {
      this.txins[i].toBw(bw)
    }
    bw.write(this.txoutsvi.buf)
    for (let i = 0; i < this.txouts.length; i++) {
      this.txouts[i].toBw(bw)
    }
    bw.writeUInt32LE(this.nLockTime)
    return bw
  }

  Tx.prototype.sighash = function (nhashtype, nin, subScript) {
    let txcopy = new Tx(this.toBuffer())

    subScript = new Script().fromBuffer(subScript.toBuffer())
    subScript.removeCodeseparators()

    for (let i = 0; i < txcopy.txins.length; i++) {
      txcopy.txins[i] = new TxIn().fromBuffer(txcopy.txins[i].toBuffer()).setScript(new Script())
    }

    txcopy.txins[nin] = new TxIn().fromBuffer(txcopy.txins[nin].toBuffer()).setScript(subScript)

    if ((nhashtype & 31) === Sig.SIGHASH_NONE) {
      txcopy.txouts.length = 0
      txcopy.txoutsvi = new VarInt(0)

      for (let i = 0; i < txcopy.txins.length; i++) {
        if (i !== nin) {
          txcopy.txins[i].nSequence = 0
        }
      }
    } else if ((nhashtype & 31) === Sig.SIGHASH_SINGLE) {
      // The SIGHASH_SINGLE bug.
      // https://bitcointalk.org/index.php?topic=260595.0
      if (nin > txcopy.txouts.length - 1) {
        return new Buffer('0000000000000000000000000000000000000000000000000000000000000001', 'hex')
      }

      txcopy.txouts.length = nin + 1
      txcopy.txoutsvi = new VarInt(nin + 1)

      for (let i = 0; i < txcopy.txouts.length; i++) {
        if (i < nin) {
          txcopy.txouts[i] = new TxOut(new Bn().fromBuffer(new Buffer('ffffffffffffffff', 'hex')), new Script())
        }
      }

      for (let i = 0; i < txcopy.txins.length; i++) {
        if (i !== nin) {
          txcopy.txins[i].nSequence = 0
        }
      }
    }
    // else, SIGHASH_ALL

    if (nhashtype & Sig.SIGHASH_ANYONECANPAY) {
      txcopy.txins[0] = txcopy.txins[nin]
      txcopy.txins.length = 1
      txcopy.txinsvi = new VarInt(1)
    }

    let buf = new Bw().write(txcopy.toBuffer()).writeInt32LE(nhashtype).toBuffer()
    return new Br(Hash.sha256sha256(buf)).readReverse()
  }

  Tx.prototype.asyncSighash = function (nhashtype, nin, subScript) {
    return asink(function * () {
      let workersResult = yield Workers.asyncObjectMethod(this, 'sighash', [nhashtype, nin, subScript])
      return workersResult.resbuf
    }, this)
  }

  // This function returns a signature but does not update any inputs
  Tx.prototype.sign = function (keyPair, nhashtype, nin, subScript) {
    let hashBuf = this.sighash(nhashtype, nin, subScript)
    let sig = Ecdsa.sign(hashBuf, keyPair, 'little').fromObject({nhashtype: nhashtype})
    return sig
  }

  Tx.prototype.asyncSign = function (keyPair, nhashtype, nin, subScript) {
    return asink(function * () {
      let workersResult = yield Workers.asyncObjectMethod(this, 'sign', [keyPair, nhashtype, nin, subScript])
      return new Sig().fromFastBuffer(workersResult.resbuf)
    }, this)
  }

  // This function takes a signature as input and does not parse any inputs
  Tx.prototype.verify = function (sig, pubKey, nin, subScript) {
    let hashBuf = this.sighash(sig.nhashtype, nin, subScript)
    return Ecdsa.verify(hashBuf, sig, pubKey, 'little')
  }

  Tx.prototype.asyncVerify = function (sig, pubKey, nin, subScript) {
    return asink(function * () {
      let workersResult = yield Workers.asyncObjectMethod(this, 'verify', [sig, pubKey, nin, subScript])
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
    return new Br(this.hash()).readReverse()
  }

  Tx.prototype.asyncId = function () {
    return asink(function * () {
      let workersResult = yield Workers.asyncObjectMethod(this, 'id', [])
      return workersResult.resbuf
    }, this)
  }

  Tx.prototype.addTxIn = function (txHashBuf, txOutNum, script, nSequence) {
    let txin
    if (txHashBuf instanceof TxIn) {
      txin = txHashBuf
    } else {
      txin = new TxIn().fromObject({txHashBuf, txOutNum, nSequence}).setScript(script)
    }
    this.txins.push(txin)
    this.txinsvi = new VarInt(this.txinsvi.toNumber() + 1)
    return this
  }

  Tx.prototype.addTxOut = function (valuebn, script) {
    let txout
    if (valuebn instanceof TxOut) {
      txout = valuebn
    } else {
      txout = new TxOut().fromObject({valuebn}).setScript(script)
    }
    this.txouts.push(txout)
    this.txoutsvi = new VarInt(this.txoutsvi.toNumber() + 1)
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
