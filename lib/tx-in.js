/*
 * Transaction Input
 * =================
 *
 * An input to a transaction. The way you probably want to use this is through
 * the convenient method of new TxIn(txHashBuf, txOutNum, script, nSequence) (i.e., you
 * can leave out the scriptVi, which is computed automatically if you leave it
 * out.)
 */
'use strict'
let dependencies = {
  Bw: require('./bw'),
  VarInt: require('./var-int'),
  OpCode: require('./op-code'),
  Script: require('./script'),
  Struct: require('./struct')
}

let inject = function (deps) {
  let Bw = deps.Bw
  let VarInt = deps.VarInt
  let OpCode = deps.OpCode
  let Script = deps.Script
  let Struct = deps.Struct

  class TxIn extends Struct {
    constructor (txHashBuf, txOutNum, scriptVi, script, nSequence = 0xffffffff) {
      super({txHashBuf, txOutNum, scriptVi, script, nSequence})
    }

    setScript (script) {
      this.scriptVi = VarInt.fromNumber(script.toBuffer().length)
      this.script = script
      return this
    }

    fromProperties (txHashBuf, txOutNum, script, nSequence) {
      this.fromObject({txHashBuf, txOutNum, nSequence})
      this.setScript(script)
      return this
    }

    static fromProperties (txHashBuf, txOutNum, script, nSequence) {
      return new this().fromProperties(txHashBuf, txOutNum, script, nSequence)
    }

    fromJson (json) {
      this.fromObject({
        txHashBuf: new Buffer(json.txHashBuf, 'hex'),
        txOutNum: json.txOutNum,
        scriptVi: VarInt.fromJson(json.scriptVi),
        script: Script.fromJson(json.script),
        nSequence: json.nSequence
      })
      return this
    }

    toJson () {
      return {
        txHashBuf: this.txHashBuf.toString('hex'),
        txOutNum: this.txOutNum,
        scriptVi: this.scriptVi.toJson(),
        script: this.script.toJson(),
        nSequence: this.nSequence
      }
    }

    fromBr (br) {
      this.txHashBuf = br.read(32)
      this.txOutNum = br.readUInt32LE()
      this.scriptVi = VarInt.fromBuffer(br.readVarIntBuf())
      this.script = Script.fromBuffer(br.read(this.scriptVi.toNumber()))
      this.nSequence = br.readUInt32LE()
      return this
    }

    toBw (bw) {
      if (!bw) {
        bw = new Bw()
      }
      bw.write(this.txHashBuf)
      bw.writeUInt32LE(this.txOutNum)
      bw.write(this.scriptVi.buf)
      bw.write(this.script.toBuffer())
      bw.writeUInt32LE(this.nSequence)
      return bw
    }

    /**
     * Generate txIn with blank signatures from a txOut and its
     * txHashBuf+txOutNum. A "blank" signature is just an OP_0.
     */
    fromPubKeyHashTxOut (txHashBuf, txOutNum, txOut, pubKey) {
      let script = new Script()
      if (txOut.script.isPubKeyHashOut()) {
        script.writeOpCode(OpCode.OP_0) // blank signature
        script.writeBuffer(pubKey.toBuffer())
      } else {
        throw new Error('txOut must be of type pubKeyHash')
      }
      this.txHashBuf = txHashBuf
      this.txOutNum = txOutNum
      this.setScript(script)
      return this
    }

    /**
     * Generate txIn with blank signatures from a txOut and its
     * txHashBuf+txOutNum. A "blank" signature is just an OP_0.
     *
     * TODO: Also support other types of p2sh outputs other than multisig.
     */
    fromScriptHashMultiSigTxOut (txHashBuf, txOutNum, txOut, redeemScript) {
      let script = new Script()
      if (!txOut.script.isScriptHashOut()) {
        throw new Error('txOut must be of type scriptHash')
      }
      if (!redeemScript.isMultiSigOut()) {
        throw new Error('redeemScript must be multisig')
      }
      script.writeOpCode(OpCode.OP_0) // extra OP_0; famous multisig bug in bitcoin pops one too many items from the stack
      let numpubKeys = redeemScript.chunks.length - 3 // 3 normal opCodes, the rest pubKeys
      for (let i = 0; i < numpubKeys; i++) {
        script.writeOpCode(OpCode.OP_0) // one blank per pubKey (not per sig)
      }
      script.writeBuffer(redeemScript.toBuffer())
      this.fromProperties(txHashBuf, txOutNum, script)
      return this
    }

    static fromScriptHashMultiSigTxOut (txHashBuf, txOutNum, txOut, redeemScript) {
      return new this().fromScriptHashMultiSigTxOut(txHashBuf, txOutNum, txOut, redeemScript)
    }

    hasNullInput () {
      let hex = this.txHashBuf.toString('hex')
      if (hex === '0000000000000000000000000000000000000000000000000000000000000000' && this.txOutNum === 0xffffffff) {
        return true
      }
      return false
    }

    /**
     * Analagous to bitcoind's SetNull in COutPoint
     */
    setNullInput () {
      this.txHashBuf = new Buffer(32)
      this.txHashBuf.fill(0)
      this.txOutNum = 0xffffffff // -1 cast to unsigned int
    }
  }

  /* Interpret sequence numbers as relative lock-time constraints. */
  TxIn.LOCKTIME_VERIFY_SEQUENCE = (1 << 0)

  /* Setting nSequence to this value for every input in a transaction disables
   * nLockTime. */
  TxIn.SEQUENCE_FINAL = 0xffffffff

  /* Below flags apply in the context of Bip 68*/
  /* If this flag set, txIn.nSequence is NOT interpreted as a relative lock-time.
   * */
  TxIn.SEQUENCE_LOCKTIME_DISABLE_FLAG = (1 << 31)

  /* If txIn.nSequence encodes a relative lock-time and this flag is set, the
   * relative lock-time has units of 512 seconds, otherwise it specifies blocks
   * with a granularity of 1. */
  TxIn.SEQUENCE_LOCKTIME_TYPE_FLAG = (1 << 22)

  /* If txIn.nSequence encodes a relative lock-time, this mask is applied to
   * extract that lock-time from the sequence field. */
  TxIn.SEQUENCE_LOCKTIME_MASK = 0x0000ffff

  /* In order to use the same number of bits to encode roughly the same
   * wall-clock duration, and because blocks are naturally limited to occur
   * every 600s on average, the minimum granularity for time-based relative
   * lock-time is fixed at 512 seconds.  Converting from CTxIn::nSequence to
   * seconds is performed by multiplying by 512 = 2^9, or equivalently
   * shifting up by 9 bits. */
  TxIn.SEQUENCE_LOCKTIME_GRANULARITY = 9

  return TxIn
}

inject = require('injecter')(inject, dependencies)
let TxIn = inject()
module.exports = TxIn
