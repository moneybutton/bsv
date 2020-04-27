/**
 * Transaction
 * ===========
 *
 * A bitcoin transaction.
 */
'use strict'

let Bn = require('./bn')
let Br = require('./br')
let Bw = require('./bw')
let Ecdsa = require('./ecdsa')
let Hash = require('./hash')
let Script = require('./script')
let Sig = require('./sig')
let Struct = require('./struct')
let TxIn = require('./tx-in')
let TxOut = require('./tx-out')
let VarInt = require('./var-int')
let Workers = require('./workers')

class Tx extends Struct {
  constructor (
    versionBytesNum = 1,
    txInsVi = VarInt.fromNumber(0),
    txIns = [],
    txOutsVi = VarInt.fromNumber(0),
    txOuts = [],
    nLockTime = 0
  ) {
    super({ versionBytesNum, txInsVi, txIns, txOutsVi, txOuts, nLockTime })
    this.hashCache = {}
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

  // https://github.com/Bitcoin-UAHF/spec/blob/master/replay-protected-sighash.md
  hashPrevouts () {
    if (this.hashCache.hashPrevouts) {
      return this.hashCache.hashPrevouts
    }
    let bw = new Bw()
    for (let i in this.txIns) {
      let txIn = this.txIns[i]
      bw.write(txIn.txHashBuf) // outpoint (1/2)
      bw.writeUInt32LE(txIn.txOutNum) // outpoint (2/2)
    }
    this.hashCache.hashPrevouts = Hash.sha256Sha256(bw.toBuffer())
    return this.hashCache.hashPrevouts
  }

  hashSequence () {
    if (this.hashCache.hashSequence) {
      return this.hashCache.hashSequence
    }
    let bw = new Bw()
    for (let i in this.txIns) {
      let txIn = this.txIns[i]
      bw.writeUInt32LE(txIn.nSequence)
    }
    this.hashCache.hashSequence = Hash.sha256Sha256(bw.toBuffer())
    return this.hashCache.hashSequence
  }

  hashOutputs () {
    if (this.hashCache.hashOutputs) {
      return this.hashCache.hashOutputs
    }
    let bw = new Bw()
    for (let i in this.txOuts) {
      let txOut = this.txOuts[i]
      bw.write(txOut.toBuffer())
    }
    this.hashCache.hashOutputs = Hash.sha256Sha256(bw.toBuffer())
    return this.hashCache.hashOutputs
  }

  /**
   * For a normal transaction, subScript is usually the scriptPubKey. For a
   * p2sh transaction, subScript is usually the redeemScript. If you're not
   * normal because you're using OP_CODESEPARATORs, you know what to do.
   */
  sighash (nHashType, nIn, subScript, valueBn, flags = 0) {
    // start with UAHF part (Bitcoin SV)
    // https://github.com/Bitcoin-UAHF/spec/blob/master/replay-protected-sighash.md
    if (
      nHashType & Sig.SIGHASH_FORKID &&
      flags & Tx.SCRIPT_ENABLE_SIGHASH_FORKID
    ) {
      let hashPrevouts = Buffer.alloc(32, 0)
      let hashSequence = Buffer.alloc(32, 0)
      let hashOutputs = Buffer.alloc(32, 0)

      if (!(nHashType & Sig.SIGHASH_ANYONECANPAY)) {
        hashPrevouts = this.hashPrevouts()
      }

      if (
        !(nHashType & Sig.SIGHASH_ANYONECANPAY) &&
        (nHashType & 0x1f) !== Sig.SIGHASH_SINGLE &&
        (nHashType & 0x1f) !== Sig.SIGHASH_NONE
      ) {
        hashSequence = this.hashSequence()
      }

      if (
        (nHashType & 0x1f) !== Sig.SIGHASH_SINGLE &&
        (nHashType & 0x1f) !== Sig.SIGHASH_NONE
      ) {
        hashOutputs = this.hashOutputs()
      } else if (
        (nHashType & 0x1f) === Sig.SIGHASH_SINGLE &&
        nIn < this.txOuts.length
      ) {
        hashOutputs = Hash.sha256Sha256(this.txOuts[nIn].toBuffer())
      }

      let bw = new Bw()
      bw.writeUInt32LE(this.versionBytesNum)
      bw.write(hashPrevouts)
      bw.write(hashSequence)
      bw.write(this.txIns[nIn].txHashBuf) // outpoint (1/2)
      bw.writeUInt32LE(this.txIns[nIn].txOutNum) // outpoint (2/2)
      bw.writeVarIntNum(subScript.toBuffer().length)
      bw.write(subScript.toBuffer())
      bw.writeUInt64LEBn(valueBn)
      bw.writeUInt32LE(this.txIns[nIn].nSequence)
      bw.write(hashOutputs)
      bw.writeUInt32LE(this.nLockTime)
      bw.writeUInt32LE(nHashType >>> 0)

      return new Br(Hash.sha256Sha256(bw.toBuffer())).readReverse()
    }

    // original bitcoin code follows - not related to UAHF (Bitcoin SV)
    let txcopy = this.cloneByBuffer()

    subScript = new Script().fromBuffer(subScript.toBuffer())
    subScript.removeCodeseparators()

    for (let i = 0; i < txcopy.txIns.length; i++) {
      txcopy.txIns[i] = TxIn.fromBuffer(txcopy.txIns[i].toBuffer()).setScript(
        new Script()
      )
    }

    txcopy.txIns[nIn] = TxIn.fromBuffer(
      txcopy.txIns[nIn].toBuffer()
    ).setScript(subScript)

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
        return Buffer.from(
          '0000000000000000000000000000000000000000000000000000000000000001',
          'hex'
        )
      }

      txcopy.txOuts.length = nIn + 1
      txcopy.txOutsVi = VarInt.fromNumber(nIn + 1)

      for (let i = 0; i < txcopy.txOuts.length; i++) {
        if (i < nIn) {
          txcopy.txOuts[i] = TxOut.fromProperties(
            new Bn().fromBuffer(Buffer.from('ffffffffffffffff', 'hex')),
            new Script()
          )
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

    let buf = new Bw()
      .write(txcopy.toBuffer())
      .writeInt32LE(nHashType)
      .toBuffer()
    return new Br(Hash.sha256Sha256(buf)).readReverse()
  }

  async asyncSighash (nHashType, nIn, subScript, valueBn, flags = 0) {
    let workersResult = await Workers.asyncObjectMethod(this, 'sighash', [
      nHashType,
      nIn,
      subScript,
      valueBn,
      flags
    ])
    return workersResult.resbuf
  }

  // This function returns a signature but does not update any inputs
  sign (keyPair, nHashType = Sig.SIGHASH_ALL | Sig.SIGHASH_FORKID, nIn, subScript, valueBn, flags = Tx.SCRIPT_ENABLE_SIGHASH_FORKID) {
    let hashBuf = this.sighash(nHashType, nIn, subScript, valueBn, flags)
    let sig = Ecdsa.sign(hashBuf, keyPair, 'little').fromObject({
      nHashType: nHashType
    })
    return sig
  }

  async asyncSign (keyPair, nHashType = Sig.SIGHASH_ALL | Sig.SIGHASH_FORKID, nIn, subScript, valueBn, flags = Tx.SCRIPT_ENABLE_SIGHASH_FORKID) {
    let workersResult = await Workers.asyncObjectMethod(this, 'sign', [
      keyPair,
      nHashType,
      nIn,
      subScript,
      valueBn,
      flags
    ])
    return new Sig().fromFastBuffer(workersResult.resbuf)
  }

  // This function takes a signature as input and does not parse any inputs
  verify (
    sig,
    pubKey,
    nIn,
    subScript,
    enforceLowS = false,
    valueBn,
    flags = Tx.SCRIPT_ENABLE_SIGHASH_FORKID
  ) {
    let hashBuf = this.sighash(sig.nHashType, nIn, subScript, valueBn, flags)
    return Ecdsa.verify(hashBuf, sig, pubKey, 'little', enforceLowS)
  }

  async asyncVerify (
    sig,
    pubKey,
    nIn,
    subScript,
    enforceLowS = false,
    valueBn,
    flags = Tx.SCRIPT_ENABLE_SIGHASH_FORKID
  ) {
    let workersResult = await Workers.asyncObjectMethod(this, 'verify', [
      sig,
      pubKey,
      nIn,
      subScript,
      enforceLowS,
      valueBn,
      flags
    ])
    return JSON.parse(workersResult.resbuf.toString())
  }

  hash () {
    return Hash.sha256Sha256(this.toBuffer())
  }

  async asyncHash () {
    let workersResult = await Workers.asyncObjectMethod(this, 'hash', [])
    return workersResult.resbuf
  }

  id () {
    return new Br(this.hash()).readReverse()
  }

  async asyncId () {
    let workersResult = await Workers.asyncObjectMethod(this, 'id', [])
    return workersResult.resbuf
  }

  addTxIn (txHashBuf, txOutNum, script, nSequence) {
    let txIn
    if (txHashBuf instanceof TxIn) {
      txIn = txHashBuf
    } else {
      txIn = new TxIn()
        .fromObject({ txHashBuf, txOutNum, nSequence })
        .setScript(script)
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
      txOut = new TxOut().fromObject({ valueBn }).setScript(script)
    }
    this.txOuts.push(txOut)
    this.txOutsVi = VarInt.fromNumber(this.txOutsVi.toNumber() + 1)
    return this
  }

  /**
   * Analagous to bitcoind's IsCoinBase function in transaction.h
   */
  isCoinbase () {
    return this.txIns.length === 1 && this.txIns[0].hasNullInput()
  }
}

Tx.MAX_MONEY = 21000000 * 1e8

// This is defined on Interp, but Tx cannot depend on Interp - must redefine here
Tx.SCRIPT_ENABLE_SIGHASH_FORKID = 1 << 16

module.exports = Tx
