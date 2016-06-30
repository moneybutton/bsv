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

  class Tx extends Struct {
    constructor (versionBytesNum = 1, txInsVi = VarInt.fromNumber(0), txIns = [], txOutsVi = VarInt.fromNumber(0), txOuts = [], nLockTime = 0) {
      super({versionBytesNum, txInsVi, txIns, txOutsVi, txOuts, nLockTime})
    }

    fromJSON (json) {
      let txIns = []
      json.txIns.forEach(function (txIn) {
        txIns.push(new TxIn().fromJSON(txIn))
      })
      let txOuts = []
      json.txOuts.forEach(function (txOut) {
        txOuts.push(new TxOut().fromJSON(txOut))
      })
      this.fromObject({
        versionBytesNum: json.versionBytesNum,
        txInsVi: new VarInt().fromJSON(json.txInsVi),
        txIns: txIns,
        txOutsVi: new VarInt().fromJSON(json.txOutsVi),
        txOuts: txOuts,
        nLockTime: json.nLockTime
      })
      return this
    }

    toJSON () {
      let txIns = []
      this.txIns.forEach(function (txIn) {
        txIns.push(txIn.toJSON())
      })
      let txOuts = []
      this.txOuts.forEach(function (txOut) {
        txOuts.push(txOut.toJSON())
      })
      return {
        versionBytesNum: this.versionBytesNum,
        txInsVi: this.txInsVi.toJSON(),
        txIns: txIns,
        txOutsVi: this.txOutsVi.toJSON(),
        txOuts: txOuts,
        nLockTime: this.nLockTime
      }
    }

    fromBr (br) {
      this.versionBytesNum = br.readUInt32LE()
      this.txInsVi = new VarInt(br.readVarIntBuf())
      let txInsNum = this.txInsVi.toNumber()
      this.txIns = []
      for (let i = 0; i < txInsNum; i++) {
        this.txIns.push(new TxIn().fromBr(br))
      }
      this.txOutsVi = new VarInt(br.readVarIntBuf())
      let txOutsNum = this.txOutsVi.toNumber()
      this.txOuts = []
      for (let i = 0; i < txOutsNum; i++) {
        this.txOuts.push(new TxOut().fromBr(br))
      }
      this.nLockTime = br.readUInt32LE()
      return this
    }

    toBw (bw) {
      if (!bw) {
        bw = new Bw()
      }
      bw.writeUInt32LE(this.versionBytesNum)
      bw.write(this.txInsVi.buf)
      for (let i = 0; i < this.txIns.length; i++) {
        this.txIns[i].toBw(bw)
      }
      bw.write(this.txOutsVi.buf)
      for (let i = 0; i < this.txOuts.length; i++) {
        this.txOuts[i].toBw(bw)
      }
      bw.writeUInt32LE(this.nLockTime)
      return bw
    }

    /**
     * For a normal transaction, subScript is usually the scriptPubKey. For a
     * p2sh transaction, subScript is usually the redeemScript. If you're not
     * normal because you're using OP_CODESEPARATORs, you know what to do.
     */
    sighash (nHashType, nIn, subScript) {
      let txcopy = this.cloneByBuffer()

      subScript = new Script().fromBuffer(subScript.toBuffer())
      subScript.removeCodeseparators()

      for (let i = 0; i < txcopy.txIns.length; i++) {
        txcopy.txIns[i] = TxIn.fromBuffer(txcopy.txIns[i].toBuffer()).setScript(new Script())
      }

      txcopy.txIns[nIn] = TxIn.fromBuffer(txcopy.txIns[nIn].toBuffer()).setScript(subScript)

      if ((nHashType & 31) === Sig.SIGHASH_NONE) {
        txcopy.txOuts.length = 0
        txcopy.txOutsVi = VarInt.fromNumber(0)

        for (let i = 0; i < txcopy.txIns.length; i++) {
          if (i !== nIn) {
            txcopy.txIns[i].nSequence = 0
          }
        }
      } else if ((nHashType & 31) === Sig.SIGHASH_SINGLE) {
        // The SIGHASH_SINGLE bug.
        // https://bitcointalk.org/index.php?topic=260595.0
        if (nIn > txcopy.txOuts.length - 1) {
          return new Buffer('0000000000000000000000000000000000000000000000000000000000000001', 'hex')
        }

        txcopy.txOuts.length = nIn + 1
        txcopy.txOutsVi = VarInt.fromNumber(nIn + 1)

        for (let i = 0; i < txcopy.txOuts.length; i++) {
          if (i < nIn) {
            txcopy.txOuts[i] = TxOut.fromProperties(new Bn().fromBuffer(new Buffer('ffffffffffffffff', 'hex')), new Script())
          }
        }

        for (let i = 0; i < txcopy.txIns.length; i++) {
          if (i !== nIn) {
            txcopy.txIns[i].nSequence = 0
          }
        }
      }
      // else, SIGHASH_ALL

      if (nHashType & Sig.SIGHASH_ANYONECANPAY) {
        txcopy.txIns[0] = txcopy.txIns[nIn]
        txcopy.txIns.length = 1
        txcopy.txInsVi = VarInt.fromNumber(1)
      }

      let buf = new Bw().write(txcopy.toBuffer()).writeInt32LE(nHashType).toBuffer()
      return new Br(Hash.sha256Sha256(buf)).readReverse()
    }

    asyncSighash (nHashType, nIn, subScript) {
      return asink(function * () {
        let workersResult = yield Workers.asyncObjectMethod(this, 'sighash', [nHashType, nIn, subScript])
        return workersResult.resbuf
      }, this)
    }

    // This function returns a signature but does not update any inputs
    sign (keyPair, nHashType, nIn, subScript) {
      let hashBuf = this.sighash(nHashType, nIn, subScript)
      let sig = Ecdsa.sign(hashBuf, keyPair, 'little').fromObject({nHashType: nHashType})
      return sig
    }

    asyncSign (keyPair, nHashType, nIn, subScript) {
      return asink(function * () {
        let workersResult = yield Workers.asyncObjectMethod(this, 'sign', [keyPair, nHashType, nIn, subScript])
        return new Sig().fromFastBuffer(workersResult.resbuf)
      }, this)
    }

    // This function takes a signature as input and does not parse any inputs
    verify (sig, pubKey, nIn, subScript) {
      let hashBuf = this.sighash(sig.nHashType, nIn, subScript)
      return Ecdsa.verify(hashBuf, sig, pubKey, 'little')
    }

    asyncVerify (sig, pubKey, nIn, subScript) {
      return asink(function * () {
        let workersResult = yield Workers.asyncObjectMethod(this, 'verify', [sig, pubKey, nIn, subScript])
        return JSON.parse(workersResult.resbuf.toString())
      }, this)
    }

    hash () {
      return Hash.sha256Sha256(this.toBuffer())
    }

    asyncHash () {
      return asink(function * () {
        let workersResult = yield Workers.asyncObjectMethod(this, 'hash', [])
        return workersResult.resbuf
      }, this)
    }

    id () {
      return new Br(this.hash()).readReverse()
    }

    asyncId () {
      return asink(function * () {
        let workersResult = yield Workers.asyncObjectMethod(this, 'id', [])
        return workersResult.resbuf
      }, this)
    }

    addTxIn (txHashBuf, txOutNum, script, nSequence) {
      let txIn
      if (txHashBuf instanceof TxIn) {
        txIn = txHashBuf
      } else {
        txIn = new TxIn().fromObject({txHashBuf, txOutNum, nSequence}).setScript(script)
      }
      this.txIns.push(txIn)
      this.txInsVi = VarInt.fromNumber(this.txInsVi.toNumber() + 1)
      return this
    }

    addTxOut (valueBn, script) {
      let txOut
      if (valueBn instanceof TxOut) {
        txOut = valueBn
      } else {
        txOut = new TxOut().fromObject({valueBn}).setScript(script)
      }
      this.txOuts.push(txOut)
      this.txOutsVi = VarInt.fromNumber(this.txOutsVi.toNumber() + 1)
      return this
    }

    /**
     * Analagous to bitcoind's IsCoinBase function in transaction.h
     */
    isCoinbase () {
      return (this.txIns.length === 1 && this.txIns[0].hasNullInput())
    }
  }

  Tx.MAX_MONEY = 21000000 * 1e8

  return Tx
}

inject = require('injecter')(inject, dependencies)
let Tx = inject()
module.exports = Tx
