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
  Constants: require('./constants').Default.Txbuilder,
  BN: require('./bn'),
  Pubkey: require('./pubkey'),
  Script: require('./script'),
  Sig: require('./sig'),
  Struct: require('./struct'),
  Tx: require('./tx'),
  Txin: require('./txin'),
  Txout: require('./txout'),
  Txoutmap: require('./txoutmap'),
  Varint: require('./varint'),
  asink: require('asink')
}

let inject = function (deps) {
  let Address = deps.Address
  let Constants = deps.Constants
  let BN = deps.BN
  let Pubkey = deps.Pubkey
  let Script = deps.Script
  let Sig = deps.Sig
  let Struct = deps.Struct
  let Tx = deps.Tx
  let Txin = deps.Txin
  let Txout = deps.Txout
  let Txoutmap = deps.Txoutmap
  let Varint = deps.Varint
  let asink = deps.asink

  let Txbuilder = function Txbuilder (tx, txins, txouts, utxoutmap, changeAddress, feePerKBNum) {
    if (!(this instanceof Txbuilder)) {
      return new Txbuilder(tx, txins, txouts, utxoutmap, changeAddress, feePerKBNum)
    }
    this.initialize()
    this.fromObject({tx, txins, txouts, utxoutmap, changeAddress, feePerKBNum})
  }

  Txbuilder.prototype = Object.create(Struct.prototype)
  Txbuilder.prototype.constructor = Txbuilder

  Txbuilder.prototype.initialize = function () {
    this.tx = Tx()
    this.txins = []
    this.txouts = []
    this.utxoutmap = Txoutmap()
    this.feePerKBNum = Constants.feePerKBNum
    return this
  }

  Txbuilder.prototype.toJSON = function () {
    let json = {}
    json.tx = this.tx.toHex()
    json.txins = this.txins.map((txin) => txin.toHex())
    json.txouts = this.txouts.map((txout) => txout.toHex())
    json.utxoutmap = this.utxoutmap.toJSON()
    json.changeAddress = this.changeAddress.toHex()
    json.feePerKBNum = this.feePerKBNum
    return json
  }

  Txbuilder.prototype.fromJSON = function (json) {
    this.tx = Tx().fromHex(json.tx)
    this.txins = json.txins.map((txin) => Txin().fromHex(txin))
    this.txouts = json.txouts.map((txout) => Txout().fromHex(txout))
    this.utxoutmap = Txoutmap().fromJSON(json.utxoutmap)
    this.changeAddress = Address().fromHex(json.changeAddress)
    this.feePerKBNum = json.feePerKBNum
    return this
  }

  Txbuilder.prototype.setFeePerKBNum = function (feePerKBNum) {
    this.feePerKBNum = feePerKBNum
    return this
  }

  Txbuilder.prototype.setChangeAddress = function (changeAddress) {
    this.changeAddress = changeAddress
    return this
  }

  /**
   * TODO: Add support for p2sh by allowing "pubkey" to be a redeemScript.
   */
  Txbuilder.prototype.from = function (txhashbuf, txoutnum, txout, pubkey) {
    if (!(Buffer.isBuffer(txhashbuf)) || !(typeof txoutnum === 'number') || !(txout instanceof Txout) || !(pubkey instanceof Pubkey)) {
      throw new Error('invalid one of: txhashbuf, txoutnum, txout, pubkey')
    }
    this.txins.push(Txin().fromTxout(txhashbuf, txoutnum, txout, pubkey))
    this.utxoutmap.add(txhashbuf, txoutnum, txout)
    return this
  }

  /**
   * An an address to send funds to, along with the amount. The amount should be
   * denominated in satoshis, not bitcoins.
   */
  Txbuilder.prototype.to = function (valuebn, addr) {
    if (!(addr instanceof Address) || !(valuebn instanceof BN)) {
      throw new Error('addr must be an Address, and valuebn must be a BN')
    }
    let script
    if (addr.type() === 'scripthash') {
      script = Script().fromScripthash(addr.hashbuf)
    } else if (addr.type() === 'pubkeyhash') {
      script = Script().fromPubkeyhash(addr.hashbuf)
    } else {
      throw new Error('invalid address type')
    }
    let txout = Txout(valuebn, script)
    this.txouts.push(txout)
    return this
  }

  Txbuilder.prototype.buildOutputs = function () {
    let outamount = BN(0)
    this.txouts.forEach((txout) => {
      outamount = outamount.add(txout.valuebn)
      this.tx.addTxout(txout)
    })
    return outamount
  }

  Txbuilder.prototype.buildInputs = function (outamount, extraInputsNum) {
    if (!extraInputsNum) {
      extraInputsNum = 0
    }
    let inamount = BN(0)
    for (let txin of this.txins) {
      let txout = this.utxoutmap.get(txin.txhashbuf, txin.txoutnum)
      inamount = inamount.add(txout.valuebn)
      this.tx.addTxin(txin)
      if (inamount.geq(outamount)) {
        if (extraInputsNum <= 0) {
          break
        }
        extraInputsNum--
      }
    }
    if (inamount.lt(outamount)) {
      throw new Error('not enough funds for output')
    }
    return inamount
  }

  // For now this method only supports pubkeyhash inputs. It assumes we have
  // not yet added signatures to our inputs.
  // TODO: Support it when the signatures are already on the inputs.
  // TODO: Support p2sh inputs.
  Txbuilder.prototype.estimateSize = function () {
    // largest possible sig size
    let sigsize = 1 + 1 + 1 + 1 + 32 + 1 + 1 + 32 + 1
    let size = this.tx.toBuffer().length
    size = size + sigsize * this.tx.txins.length
    size = size + 1 // assume txinsvi increases by 1 byte
    return size
  }

  Txbuilder.prototype.estimateFee = function () {
    let fee = Math.ceil(this.estimateSize() / 1000) * this.feePerKBNum
    return BN(fee)
  }

  /**
   * Builds the transaction and adds the appropriate fee.
   */
  Txbuilder.prototype.build = function () {
    let changeAmount, shouldfeebn
    for (let extraInputsNum = 0; extraInputsNum < this.txins.length; extraInputsNum++) {
      this.tx = Tx()
      let outamount = this.buildOutputs()
      let changeScript = Script().fromPubkeyhash(this.changeAddress.hashbuf)
      let changeTxout = Txout(BN(0), changeScript)
      this.tx.addTxout(changeTxout)

      let inamount = this.buildInputs(outamount, extraInputsNum)

      // TODO: What if change amount is less than dust?
      // Set change amount from inamount - outamount
      changeAmount = inamount.sub(outamount)
      this.tx.txouts[this.tx.txouts.length - 1].valuebn = changeAmount

      shouldfeebn = this.estimateFee()
      if (changeAmount.geq(shouldfeebn) && changeAmount.sub(shouldfeebn).gt(Constants.dustnum)) {
        break
      }
    }
    if (changeAmount.geq(shouldfeebn)) {
      // Subtract fee from change
      // TODO: What if change is less than dust? What if change is 0?
      changeAmount = changeAmount.sub(shouldfeebn)
      this.tx.txouts[this.tx.txouts.length - 1].valuebn = changeAmount

      if (changeAmount.lt(Constants.dustnum)) {
        throw new Error('unable to create change amount greater than dust')
      }

      return this
    } else {
      throw new Error('unable to gather enough inputs for outputs and fee')
    }
  }

  /**
   * sign ith input with keypair
   */
  Txbuilder.prototype.sign = function (i, keypair) {
    let txin = this.tx.txins[i]
    let script = txin.script
    let txhashbuf = txin.txhashbuf
    let txoutnum = txin.txoutnum
    let txout = this.utxoutmap.get(txhashbuf, txoutnum)
    let outscript = txout.script
    let subscript = outscript // true for standard script types
    let sig = this.tx.sign(keypair, Sig.SIGHASH_ALL, i, subscript)
    if (script.isPubkeyhashIn()) {
      txin.script.chunks[0] = Script().writeBuffer(sig.toTxFormat()).chunks[0]
      txin.scriptvi = Varint(txin.script.toBuffer().length)
    } else {
      throw new Error('cannot sign unknown script type for input ' + i)
    }
    return this
  }

  Txbuilder.prototype.asyncSign = function (i, keypair) {
    return asink(function *() {
      let txin = this.tx.txins[i]
      let script = txin.script
      let txhashbuf = txin.txhashbuf
      let txoutnum = txin.txoutnum
      let txout = this.utxoutmap.get(txhashbuf, txoutnum)
      let outscript = txout.script
      let subscript = outscript // true for standard script types
      let sig = yield this.tx.asyncSign(keypair, Sig.SIGHASH_ALL, i, subscript)
      if (script.isPubkeyhashIn()) {
        txin.script.chunks[0] = Script().writeBuffer(sig.toTxFormat()).chunks[0]
        txin.scriptvi = Varint(txin.script.toBuffer().length)
      } else {
        throw new Error('cannot sign unknown script type for input ' + i)
      }
      return this
    }, this)
  }

  return Txbuilder
}

inject = require('./injector')(inject, dependencies)
let Txbuilder = inject()
module.exports = Txbuilder
