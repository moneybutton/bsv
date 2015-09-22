/**
 * Transaction Builder (experimental)
 * ==================================
 *
 * Transaction Builder. This is a, yet unfinished, convenience class for
 * building pubkeyhash and p2sh transactions, and also for verifying arbitrary
 * transactions (and their inputs). You can (or will be able to) pay to
 * pubkeyhash to p2sh and can spend pubkeyhash or p2sh-pubkeyhash or
 * p2sh-multisig.
 */
'use strict'
let dependencies = {
  Address: require('./address'),
  BN: require('./bn'),
  BR: require('./br'),
  Opcode: require('./opcode'),
  Script: require('./script'),
  Sig: require('./sig'),
  Struct: require('./struct'),
  Tx: require('./tx'),
  Txout: require('./txout'),
  Varint: require('./varint')
}

let inject = function (deps) {
  let Address = deps.Address
  let BN = deps.BN
  let BR = deps.BR
  let Opcode = deps.Opcode
  let Script = deps.Script
  let Sig = deps.Sig
  let Struct = deps.Struct
  let Tx = deps.Tx
  let Txout = deps.Txout
  let Varint = deps.Varint

  let Txbuilder = function Txbuilder (obj) {
    if (!(this instanceof Txbuilder)) {
      return new Txbuilder(obj)
    }
    if (obj) {
      this.initialize()
      this.fromObject(obj)
    } else {
      this.initialize()
    }
  }

  Txbuilder.prototype = Object.create(Struct.prototype)
  Txbuilder.prototype.constructor = Txbuilder

  Txbuilder.prototype.initialize = function () {
    this.tx = Tx()
    this.utxoutmap = {}
    this.toTxouts = []
    return this
  }

  Txbuilder.prototype.setFee = function (feebn) {
    this.feebn = feebn
    return this
  }

  Txbuilder.prototype.setChangeAddress = function (changeaddr) {
    this.changeaddr = changeaddr
    return this
  }

  Txbuilder.prototype.setUTxoutMap = function (utxoutmap) {
    this.utxoutmap = utxoutmap
    return this
  }

  /**
   * An an address to send funds to, along with the amount. The amount should be
   * denominated in satoshis, not bitcoins.
   */
  Txbuilder.prototype.to = function (valuebn, addr) {
    if (!(addr instanceof Address) || !(valuebn instanceof BN))
      throw new Error('addr must be an Address, and valuebn must be a BN')
    let script
    if (addr.type() === 'scripthash') {
      script = Script().fromScripthash(addr.hashbuf)
    } else if (addr.type() === 'pubkeyhash') {
      script = Script().fromPubkeyhash(addr.hashbuf)
    } else {
      throw new Error('invalid address type')
    }
    let txout = Txout(valuebn, script)
    this.toTxouts.push(txout)
    return this
  }

  Txbuilder.prototype.buildOutputs = function () {
    let outamount = BN(0)
    for (let i = 0; i < this.toTxouts.length; i++) {
      let txout = this.toTxouts[i]
      this.tx.addTxout(txout)
      outamount = outamount.add(txout.valuebn)
    }

    return outamount
  }

  Txbuilder.prototype.buildInputs = function (outamount) {
    let inamount = BN(0)
    for (let id in this.utxoutmap) {
      if (!this.utxoutmap.hasOwnProperty(id))
        continue

      let obj = this.utxoutmap[id]
      let txout = obj.txout

      inamount = inamount.add(txout.valuebn)
      let split = id.split(':')
      let txidbuf = new Buffer(split[0], 'hex')
      let txhashbuf = BR(txidbuf).readReverse()
      let txoutnum = parseInt(split[1])

      let script = Script()
      if (txout.script.isPubkeyhashOut()) {
        let pubkey = obj.pubkey
        script.writeOpcode(Opcode.OP_0) // blank signature
        script.writeBuffer(pubkey.toBuffer())
      } else if (txout.script.isScripthashOut()) { // assume p2sh multisig
        let redeemScript = obj.redeemScript
        let nsigs = redeemScript.chunks[0].opcodenum - 80
        script.writeOpcode(OP_0); // extra OP_0; famous multisig bug in bitcoin pops one too many items from the stack
        for (let i = 0; i < nsigs; i++)
          script.writeOpcode(OP_0) // one blank per signature
        script.writeBuffer(redeemScript.toBuffer())
      } else {
        continue // not something we can spend
      }

      this.tx.addTxin(txhashbuf, txoutnum, script, 0xffffffff)

      if (inamount.geq(outamount))
        return inamount
    }

    throw new Error('Not enough spendable funds')
  }

  Txbuilder.prototype.build = function () {
    if (this.changeaddr === undefined)
      throw new Error('Must specify change address')

    if (this.feebn === undefined)
      throw new Error('Must specify fee')

    if (this.toTxouts.length === 0)
      throw new Error('Must specify toTxouts')

    let outamount = this.buildOutputs()
    outamount = outamount.add(this.feebn)
    let inamount = this.buildInputs(outamount)

    // TODO: Confirm change amount is above dust
    let changeamount = inamount.sub(outamount)
    if (changeamount.gt(0)) {
      let txout = Txbuilder().to(changeamount, this.changeaddr).toTxouts[0]
      this.tx.addTxout(txout)
    }

    return this
  }

  /**
   * sign ith input with keypair
   */
  Txbuilder.prototype.sign = function (i, keypair) {
    let txin = this.tx.txins[i]
    let script = txin.script
    let txhashbuf = txin.txhashbuf
    let txidbuf = BR(txhashbuf).readReverse()
    let txoutnum = txin.txoutnum
    let id = txidbuf.toString('hex') + ':' + txoutnum
    let obj = this.utxoutmap[id]
    let outscript = obj.txout.script
    let subscript = outscript // true for standard script types
    let sig = this.tx.sign(keypair, Sig.SIGHASH_ALL, i, subscript)
    if (script.isPubkeyhashIn()) {
      txin.script.chunks[0] = Script().writeBuffer(sig.toTxFormat()).chunks[0]
      txin.scriptvi = Varint(txin.script.toBuffer().length)
    } else if (script.isScripthashIn()) {
      txin.script.chunks[1 + obj.n] = Script().writeBuffer(sig.toTxFormat()).chunks[0]
      txin.scriptvi = Varint(txin.script.toBuffer().length)
    } else {
      throw new Error('cannot sign unknown script type for input ' + i)
    }
    return this
  }

  return Txbuilder
}

inject = require('./injector')(inject, dependencies)
let Txbuilder = inject()
module.exports = Txbuilder
