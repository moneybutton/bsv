/*
 * Transaction Input
 * =================
 *
 * An input to a transaction. The way you probably want to use this is through
 * the convenient method of Txin(txhashbuf, txoutnum, script, seqnum) (i.e., you
 * can leave out the scriptvi, which is computed automatically if you leave it
 * out.)
 */
'use strict'
let dependencies = {
  BW: require('./bw'),
  Varint: require('./varint'),
  Opcode: require('./opcode'),
  Script: require('./script'),
  Struct: require('./struct')
}

let inject = function (deps) {
  let BW = deps.BW
  let Varint = deps.Varint
  let Opcode = deps.Opcode
  let Script = deps.Script
  let Struct = deps.Struct

  function Txin (txhashbuf, txoutnum, scriptvi, script, seqnum) {
    if (!(this instanceof Txin)) {
      return new Txin(txhashbuf, txoutnum, scriptvi, script, seqnum)
    }
    this.initialize()
    if (Buffer.isBuffer(txhashbuf) && txoutnum !== undefined) {
      if (txhashbuf.length !== 32) {
        throw new Error('txhashbuf must be 32 bytes')
      }
      if (scriptvi instanceof Script) {
        seqnum = script
        script = scriptvi
        this.fromObject({txhashbuf, txoutnum, seqnum})
        this.setScript(script)
      } else {
        this.fromObject({txhashbuf, txoutnum, scriptvi, script, seqnum})
      }
    } else if (Buffer.isBuffer(txhashbuf)) {
      let txinbuf = txhashbuf
      this.fromBuffer(txinbuf)
    } else if (txhashbuf) {
      let obj = txhashbuf
      this.fromObject(obj)
    }
  }

  Txin.prototype = Object.create(Struct.prototype)
  Txin.prototype.constructor = Txin

  /**
   * Setting nSequence to this value for every input in a transaction
   * disables nLockTime.
   */
  Txin.SEQUENCE_FINAL = 0xffffffff
  Txin.SEQUENCE_LOCKTIME_DISABLE_FLAG = (1 << 31)
  Txin.SEQUENCE_LOCKTIME_TYPE_FLAG = (1 << 22)
  Txin.SEQUENCE_LOCKTIME_MASK = 0x0000ffff
  Txin.SEQUENCE_LOCKTIME_GRANULARITY = 9

  Txin.prototype.initialize = function () {
    this.seqnum = 0xffffffff
    return this
  }

  Txin.prototype.setScript = function (script) {
    this.scriptvi = Varint(script.toBuffer().length)
    this.script = script
    return this
  }

  Txin.prototype.fromJSON = function (json) {
    this.fromObject({
      txhashbuf: new Buffer(json.txhashbuf, 'hex'),
      txoutnum: json.txoutnum,
      scriptvi: Varint().fromJSON(json.scriptvi),
      script: Script().fromJSON(json.script),
      seqnum: json.seqnum
    })
    return this
  }

  Txin.prototype.toJSON = function () {
    return {
      txhashbuf: this.txhashbuf.toString('hex'),
      txoutnum: this.txoutnum,
      scriptvi: this.scriptvi.toJSON(),
      script: this.script.toJSON(),
      seqnum: this.seqnum
    }
  }

  Txin.prototype.fromBR = function (br) {
    this.txhashbuf = br.read(32)
    this.txoutnum = br.readUInt32LE()
    this.scriptvi = Varint(br.readVarintBuf())
    this.script = Script().fromBuffer(br.read(this.scriptvi.toNumber()))
    this.seqnum = br.readUInt32LE()
    return this
  }

  Txin.prototype.toBW = function (bw) {
    if (!bw) {
      bw = new BW()
    }
    bw.write(this.txhashbuf)
    bw.writeUInt32LE(this.txoutnum)
    bw.write(this.scriptvi.buf)
    bw.write(this.script.toBuffer())
    bw.writeUInt32LE(this.seqnum)
    return bw
  }

  /**
   * Generate txin with blank signatures from a txout and its
   * txhashbuf+txoutnum. A "blank" signature is just an OP_0.
   */
  Txin.prototype.fromPubkeyhashTxout = function (txhashbuf, txoutnum, txout, pubkey) {
    let script = Script()
    if (txout.script.isPubkeyhashOut()) {
      script.writeOpcode(Opcode.OP_0) // blank signature
      script.writeBuffer(pubkey.toBuffer())
    } else {
      throw new Error('txout must be of type pubkeyhash')
    }
    this.txhashbuf = txhashbuf
    this.txoutnum = txoutnum
    this.setScript(script)
    return this
  }

  /**
   * Generate txin with blank signatures from a txout and its
   * txhashbuf+txoutnum. A "blank" signature is just an OP_0.
   *
   * TODO: Also support other types of p2sh outputs other than multisig.
   */
  Txin.prototype.fromScripthashMultisigTxout = function (txhashbuf, txoutnum, txout, redeemScript) {
    let script = Script()
    if (!txout.script.isScripthashOut()) {
      throw new Error('txout must be of type scripthash')
    }
    if (!redeemScript.isMultisigOut()) {
      throw new Error('redeemScript must be multisig')
    }
    script.writeOpcode(Opcode.OP_0) // extra OP_0; famous multisig bug in bitcoin pops one too many items from the stack
    let numpubkeys = redeemScript.chunks.length - 3 // 3 normal opcodes, the rest pubkeys
    for (let i = 0; i < numpubkeys; i++) {
      script.writeOpcode(Opcode.OP_0) // one blank per pubkey (not per sig)
    }
    script.writeBuffer(redeemScript.toBuffer())
    this.txhashbuf = txhashbuf
    this.txoutnum = txoutnum
    this.setScript(script)
    return this
  }

  Txin.prototype.hasNullInput = function () {
    let hex = this.txhashbuf.toString('hex')
    if (hex === '0000000000000000000000000000000000000000000000000000000000000000' && this.txoutnum === 0xffffffff) {
      return true
    }
    return false
  }

  /**
   * Analagous to bitcoind's SetNull in COutPoint
   */
  Txin.prototype.setNullInput = function () {
    this.txhashbuf = new Buffer(32)
    this.txhashbuf.fill(0)
    this.txoutnum = 0xffffffff // -1 cast to unsigned int
  }

  return Txin
}

inject = require('injecter')(inject, dependencies)
let Txin = inject()
module.exports = Txin
