/**
 * Transaction
 * ===========
 *
 * A bitcoin transaction.
 */
'use strict'

import { Bn } from './bn'
import { Br } from './br'
import { Bw } from './bw'
import { Ecdsa } from './ecdsa'
import { Hash } from './hash'
import { HashCache } from './hash-cache'
import { Script } from './script'
import { Sig } from './sig'
import { Struct } from './struct'
import { TxIn } from './tx-in'
import { TxOut } from './tx-out'
import { VarInt } from './var-int'
import { Workers } from './workers'

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
  }

  fromJSON (json) {
    const txIns = []
    json.txIns.forEach(function (txIn) {
      txIns.push(new TxIn().fromJSON(txIn))
    })
    const txOuts = []
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
    const txIns = []
    this.txIns.forEach(function (txIn) {
      txIns.push(txIn.toJSON())
    })
    const txOuts = []
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
    const txInsNum = this.txInsVi.toNumber()
    this.txIns = []
    for (let i = 0; i < txInsNum; i++) {
      this.txIns.push(new TxIn().fromBr(br))
    }
    this.txOutsVi = new VarInt(br.readVarIntBuf())
    const txOutsNum = this.txOutsVi.toNumber()
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
    const bw = new Bw()
    for (const i in this.txIns) {
      const txIn = this.txIns[i]
      bw.write(txIn.txHashBuf) // outpoint (1/2)
      bw.writeUInt32LE(txIn.txOutNum) // outpoint (2/2)
    }
    return Hash.sha256Sha256(bw.toBuffer())
  }

  hashSequence () {
    const bw = new Bw()
    for (const i in this.txIns) {
      const txIn = this.txIns[i]
      bw.writeUInt32LE(txIn.nSequence)
    }
    return Hash.sha256Sha256(bw.toBuffer())
  }

  hashOutputs () {
    const bw = new Bw()
    for (const i in this.txOuts) {
      const txOut = this.txOuts[i]
      bw.write(txOut.toBuffer())
    }
    return Hash.sha256Sha256(bw.toBuffer())
  }

  /**
   * For a normal transaction, subScript is usually the scriptPubKey. For a
   * p2sh transaction, subScript is usually the redeemScript. If you're not
   * normal because you're using OP_CODESEPARATORs, you know what to do.
   */
  sighash (nHashType, nIn, subScript, valueBn, flags = 0, hashCache = new HashCache()) {
    const buf = this.sighashPreimage(nHashType, nIn, subScript, valueBn, flags, hashCache)
    if (buf.compare(Buffer.from('0000000000000000000000000000000000000000000000000000000000000001', 'hex')) === 0) {
      return buf
    }
    return new Br(Hash.sha256Sha256(buf)).readReverse()
  }

  async asyncSighash (nHashType, nIn, subScript, valueBn, flags = 0, hashCache = {}) {
    const workersResult = await Workers.asyncObjectMethod(this, 'sighash', [
      nHashType,
      nIn,
      subScript,
      valueBn,
      flags,
      hashCache
    ])
    return workersResult.resbuf
  }

  sighashPreimage (nHashType, nIn, subScript, valueBn, flags = 0, hashCache = new HashCache()) {
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
        hashPrevouts = hashCache.prevoutsHashBuf ? hashCache.prevoutsHashBuf : hashCache.prevoutsHashBuf = this.hashPrevouts()
      }

      if (
        !(nHashType & Sig.SIGHASH_ANYONECANPAY) &&
        (nHashType & 0x1f) !== Sig.SIGHASH_SINGLE &&
        (nHashType & 0x1f) !== Sig.SIGHASH_NONE
      ) {
        hashSequence = hashCache.sequenceHashBuf ? hashCache.sequenceHashBuf : hashCache.sequenceHashBuf = this.hashSequence()
      }

      if (
        (nHashType & 0x1f) !== Sig.SIGHASH_SINGLE &&
        (nHashType & 0x1f) !== Sig.SIGHASH_NONE
      ) {
        hashOutputs = hashCache.outputsHashBuf ? hashCache.outputsHashBuf : hashCache.outputsHashBuf = this.hashOutputs()
      } else if (
        (nHashType & 0x1f) === Sig.SIGHASH_SINGLE &&
        nIn < this.txOuts.length
      ) {
        hashOutputs = Hash.sha256Sha256(this.txOuts[nIn].toBuffer())
      }

      const bw = new Bw()
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

      return bw.toBuffer()
    }

    // original bitcoin code follows - not related to UAHF (Bitcoin SV)
    const txcopy = this.cloneByBuffer()

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

    const buf = new Bw()
      .write(txcopy.toBuffer())
      .writeInt32LE(nHashType)
      .toBuffer()
    return buf
  }

  async asyncSighashPreimage (nHashType, nIn, subScript, valueBn, flags = 0, hashCache = {}) {
    const workersResult = await Workers.asyncObjectMethod(this, 'sighashPreimage', [
      nHashType,
      nIn,
      subScript,
      valueBn,
      flags,
      hashCache
    ])
    return workersResult.resbuf
  }

  // This function returns a signature but does not update any inputs
  sign (keyPair, nHashType = Sig.SIGHASH_ALL | Sig.SIGHASH_FORKID, nIn, subScript, valueBn, flags = Tx.SCRIPT_ENABLE_SIGHASH_FORKID, hashCache = {}) {
    const hashBuf = this.sighash(nHashType, nIn, subScript, valueBn, flags, hashCache)
    const sig = Ecdsa.sign(hashBuf, keyPair, 'little').fromObject({
      nHashType: nHashType
    })
    return sig
  }

  async asyncSign (keyPair, nHashType = Sig.SIGHASH_ALL | Sig.SIGHASH_FORKID, nIn, subScript, valueBn, flags = Tx.SCRIPT_ENABLE_SIGHASH_FORKID, hashCache = {}) {
    const workersResult = await Workers.asyncObjectMethod(this, 'sign', [
      keyPair,
      nHashType,
      nIn,
      subScript,
      valueBn,
      flags,
      hashCache
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
    flags = Tx.SCRIPT_ENABLE_SIGHASH_FORKID,
    hashCache = {}
  ) {
    const hashBuf = this.sighash(sig.nHashType, nIn, subScript, valueBn, flags, hashCache)
    return Ecdsa.verify(hashBuf, sig, pubKey, 'little', enforceLowS)
  }

  async asyncVerify (
    sig,
    pubKey,
    nIn,
    subScript,
    enforceLowS = false,
    valueBn,
    flags = Tx.SCRIPT_ENABLE_SIGHASH_FORKID,
    hashCache = {}
  ) {
    const workersResult = await Workers.asyncObjectMethod(this, 'verify', [
      sig,
      pubKey,
      nIn,
      subScript,
      enforceLowS,
      valueBn,
      flags,
      hashCache
    ])
    return JSON.parse(workersResult.resbuf.toString())
  }

  hash () {
    return Hash.sha256Sha256(this.toBuffer())
  }

  async asyncHash () {
    const workersResult = await Workers.asyncObjectMethod(this, 'hash', [])
    return workersResult.resbuf
  }

  id () {
    return new Br(this.hash()).readReverse().toString('hex')
  }

  async asyncId () {
    const workersResult = await Workers.asyncObjectMethod(this, 'id', [])
    return JSON.parse(workersResult.resbuf.toString())
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

  /**
   * BIP 69 sorting. Be sure to sign after sorting.
   */
  sort () {
    this.txIns.sort((first, second) => {
      return new Br(first.txHashBuf).readReverse().compare(new Br(second.txHashBuf).readReverse()) ||
        first.txOutNum - second.txOutNum
    })

    this.txOuts.sort((first, second) => {
      return first.valueBn.sub(second.valueBn).toNumber() ||
        first.script.toBuffer().compare(second.script.toBuffer())
    })

    return this
  }
}

Tx.MAX_MONEY = 21000000 * 1e8

// This is defined on Interp, but Tx cannot depend on Interp - must redefine here
Tx.SCRIPT_ENABLE_SIGHASH_FORKID = 1 << 16

export { Tx }
