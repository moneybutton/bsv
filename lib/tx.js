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

  function Tx (version, txInsVi, txins, txOutsVi, txouts, nLockTime) {
    if (!(this instanceof Tx)) {
      return new Tx(version, txInsVi, txins, txOutsVi, txouts, nLockTime)
    }
    if (typeof version === 'number') {
      this.initialize()
      this.fromObject({version, txInsVi, txins, txOutsVi, txouts, nLockTime})
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
    this.txInsVi = VarInt.fromNumber(0)
    this.txins = []
    this.txOutsVi = VarInt.fromNumber(0)
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
      txInsVi: new VarInt().fromJson(json.txInsVi),
      txins: txins,
      txOutsVi: new VarInt().fromJson(json.txOutsVi),
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
      txInsVi: this.txInsVi.toJson(),
      txins: txins,
      txOutsVi: this.txOutsVi.toJson(),
      txouts: txouts,
      nLockTime: this.nLockTime
    }
  }

  Tx.prototype.fromBr = function (br) {
    this.version = br.readUInt32LE()
    this.txInsVi = new VarInt(br.readVarIntBuf())
    let txinsnum = this.txInsVi.toNumber()
    this.txins = []
    for (let i = 0; i < txinsnum; i++) {
      this.txins.push(new TxIn().fromBr(br))
    }
    this.txOutsVi = new VarInt(br.readVarIntBuf())
    let txoutsnum = this.txOutsVi.toNumber()
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
    bw.write(this.txInsVi.buf)
    for (let i = 0; i < this.txins.length; i++) {
      this.txins[i].toBw(bw)
    }
    bw.write(this.txOutsVi.buf)
    for (let i = 0; i < this.txouts.length; i++) {
      this.txouts[i].toBw(bw)
    }
    bw.writeUInt32LE(this.nLockTime)
    return bw
  }

  Tx.prototype.sighash = function (nhashtype, nIn, subScript) {
    let txcopy = new Tx(this.toBuffer())

    subScript = new Script().fromBuffer(subScript.toBuffer())
    subScript.removeCodeseparators()

    for (let i = 0; i < txcopy.txins.length; i++) {
      txcopy.txins[i] = TxIn.fromBuffer(txcopy.txins[i].toBuffer()).setScript(new Script())
    }

    txcopy.txins[nIn] = TxIn.fromBuffer(txcopy.txins[nIn].toBuffer()).setScript(subScript)

    if ((nhashtype & 31) === Sig.SIGHASH_NONE) {
      txcopy.txouts.length = 0
      txcopy.txOutsVi = VarInt.fromNumber(0)

      for (let i = 0; i < txcopy.txins.length; i++) {
        if (i !== nIn) {
          txcopy.txins[i].nSequence = 0
        }
      }
    } else if ((nhashtype & 31) === Sig.SIGHASH_SINGLE) {
      // The SIGHASH_SINGLE bug.
      // https://bitcointalk.org/index.php?topic=260595.0
      if (nIn > txcopy.txouts.length - 1) {
        return new Buffer('0000000000000000000000000000000000000000000000000000000000000001', 'hex')
      }

      txcopy.txouts.length = nIn + 1
      txcopy.txOutsVi = VarInt.fromNumber(nIn + 1)

      for (let i = 0; i < txcopy.txouts.length; i++) {
        if (i < nIn) {
          txcopy.txouts[i] = TxOut.fromProperties(new Bn().fromBuffer(new Buffer('ffffffffffffffff', 'hex')), new Script())
        }
      }

      for (let i = 0; i < txcopy.txins.length; i++) {
        if (i !== nIn) {
          txcopy.txins[i].nSequence = 0
        }
      }
    }
    // else, SIGHASH_ALL

    if (nhashtype & Sig.SIGHASH_ANYONECANPAY) {
      txcopy.txins[0] = txcopy.txins[nIn]
      txcopy.txins.length = 1
      txcopy.txInsVi = VarInt.fromNumber(1)
    }

    let buf = new Bw().write(txcopy.toBuffer()).writeInt32LE(nhashtype).toBuffer()
    return new Br(Hash.sha256Sha256(buf)).readReverse()
  }

  Tx.prototype.asyncSighash = function (nhashtype, nIn, subScript) {
    return asink(function * () {
      let workersResult = yield Workers.asyncObjectMethod(this, 'sighash', [nhashtype, nIn, subScript])
      return workersResult.resbuf
    }, this)
  }

  // This function returns a signature but does not update any inputs
  Tx.prototype.sign = function (keyPair, nhashtype, nIn, subScript) {
    let hashBuf = this.sighash(nhashtype, nIn, subScript)
    let sig = Ecdsa.sign(hashBuf, keyPair, 'little').fromObject({nhashtype: nhashtype})
    return sig
  }

  Tx.prototype.asyncSign = function (keyPair, nhashtype, nIn, subScript) {
    return asink(function * () {
      let workersResult = yield Workers.asyncObjectMethod(this, 'sign', [keyPair, nhashtype, nIn, subScript])
      return new Sig().fromFastBuffer(workersResult.resbuf)
    }, this)
  }

  // This function takes a signature as input and does not parse any inputs
  Tx.prototype.verify = function (sig, pubKey, nIn, subScript) {
    let hashBuf = this.sighash(sig.nhashtype, nIn, subScript)
    return Ecdsa.verify(hashBuf, sig, pubKey, 'little')
  }

  Tx.prototype.asyncVerify = function (sig, pubKey, nIn, subScript) {
    return asink(function * () {
      let workersResult = yield Workers.asyncObjectMethod(this, 'verify', [sig, pubKey, nIn, subScript])
      return JSON.parse(workersResult.resbuf.toString())
    }, this)
  }

  Tx.prototype.hash = function () {
    return Hash.sha256Sha256(this.toBuffer())
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
    this.txInsVi = VarInt.fromNumber(this.txInsVi.toNumber() + 1)
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
    this.txOutsVi = VarInt.fromNumber(this.txOutsVi.toNumber() + 1)
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
