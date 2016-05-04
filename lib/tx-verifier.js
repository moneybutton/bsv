/**
 * Transaction Verifier
 * ====================
 */
'use strict'
let dependencies = {
  Bn: require('./bn'),
  Br: require('./br'),
  Block: require('./block'),
  Interp: require('./interp'),
  Sig: require('./sig'),
  Struct: require('./struct'),
  Tx: require('./tx'),
  Workers: require('./workers'),
  asink: require('asink')
}

let inject = function (deps) {
  let Bn = deps.Bn
  let Block = deps.Block
  let Interp = deps.Interp
  let Struct = deps.Struct
  let Tx = deps.Tx
  let Workers = deps.Workers
  let asink = deps.asink

  function TxVerifier (tx, txoutmap) {
    if (!(this instanceof TxVerifier)) {
      return new TxVerifier(tx, txoutmap)
    }
    if (tx) {
      if (txoutmap) {
        this.fromObject({tx, txoutmap})
      } else {
        let obj = tx
        this.fromObject(obj)
      }
    }
  }

  TxVerifier.prototype = Object.create(Struct.prototype)
  TxVerifier.prototype.constructor = TxVerifier

  /**
   * Verifies that the transaction is valid both by performing basic checks, such
   * as ensuring that no two inputs are the same, as well as by verifying every
   * script. The two checks are checkstr, which is analagous to bitcoind's
   * CheckTransaction, and verifystr, which runs the script interpreter.
   *
   * This does NOT check that any possible claimed fees are accurate; checking
   * that the fees are accurate requires checking that the input transactions are
   * valid, which is not performed by this test. That check is done with the
   * normal verify function.
   */
  TxVerifier.prototype.verify = function (flags) {
    return !this.checkstr() && !this.verifystr(flags)
  }

  TxVerifier.prototype.asyncVerify = function (flags) {
    return asink(function * () {
      let verifystr = yield this.asyncVerifystr(flags)
      return !this.checkstr() && !verifystr
    }, this)
  }

  /**
   * Convenience method to verify a transaction.
   */
  TxVerifier.verify = function (tx, txoutmap, flags) {
    return new TxVerifier(tx, txoutmap).verify(flags)
  }

  TxVerifier.asyncVerify = function (tx, txoutmap, flags) {
    return new TxVerifier(tx, txoutmap).asyncVerify(flags)
  }

  /**
   * Check that a transaction passes basic sanity tests. If not, return a string
   * describing the error. This function contains the same logic as
   * CheckTransaction in bitcoin core.
   */
  TxVerifier.prototype.checkstr = function () {
    // Basic checks that don't depend on any context
    if (this.tx.txins.length === 0 || this.tx.txinsvi.toNumber() === 0) {
      return 'transaction txins empty'
    }
    if (this.tx.txouts.length === 0 || this.tx.txoutsvi.toNumber() === 0) {
      return 'transaction txouts empty'
    }

    // Size limits
    if (this.tx.toBuffer().length > Block.MAX_BLOCK_SIZE) {
      return 'transaction over the maximum block size'
    }

    // Check for negative or overflow output values
    let valueoutbn = new Bn(0)
    for (let i = 0; i < this.tx.txouts.length; i++) {
      let txout = this.tx.txouts[i]
      if (txout.valuebn.lt(0)) {
        return 'transaction txout ' + i + ' negative'
      }
      if (txout.valuebn.gt(Tx.MAX_MONEY)) {
        return 'transaction txout ' + i + ' greater than MAX_MONEY'
      }
      valueoutbn = valueoutbn.add(txout.valuebn)
      if (valueoutbn.gt(Tx.MAX_MONEY)) {
        return 'transaction txout ' + i + ' total output greater than MAX_MONEY'
      }
    }

    // Check for duplicate inputs
    let txinmap = {}
    for (let i = 0; i < this.tx.txins.length; i++) {
      let txin = this.tx.txins[i]
      let inputid = txin.txHashBuf.toString('hex') + ':' + txin.txOutNum
      if (txinmap[inputid] !== undefined) {
        return 'transaction input ' + i + ' duplicate input'
      }
      txinmap[inputid] = true
    }

    if (this.tx.isCoinbase()) {
      let buf = this.tx.txins[0].script.toBuffer()
      if (buf.length < 2 || buf.length > 100) {
        return 'coinbase trasaction script size invalid'
      }
    } else {
      for (let i = 0; i < this.tx.txins.length; i++) {
        if (this.tx.txins[i].hasNullInput()) {
          return 'tranasction input ' + i + ' has null input'
        }
      }
    }
    return false
  }

  /**
   * verify the transaction inputs by running the script interpreter. Returns a
   * string of the script interpreter is invalid, otherwise returns false.
   */
  TxVerifier.prototype.verifystr = function (flags) {
    for (let i = 0; i < this.tx.txins.length; i++) {
      if (!this.verifynin(i, flags)) {
        return 'input ' + i + ' failed script verify'
      }
    }
    return false
  }

  TxVerifier.prototype.asyncVerifystr = function (flags) {
    return asink(function * () {
      for (let i = 0; i < this.tx.txins.length; i++) {
        let verifynin = yield this.asyncVerifynin(i, flags)
        if (!verifynin) {
          return 'input ' + i + ' failed script verify'
        }
      }
      return false
    }, this)
  }

  /**
   * Verify a particular input by running the script interpreter. Returns true if
   * the input is valid, false otherwise.
   */
  TxVerifier.prototype.verifynin = function (nin, flags) {
    let txin = this.tx.txins[nin]
    let scriptSig = txin.script
    let scriptPubKey = this.txoutmap.get(txin.txHashBuf, txin.txOutNum).script
    let interp = new Interp()
    let verified = interp.verify(scriptSig, scriptPubKey, this.tx, nin, flags)
    return verified
  }

  TxVerifier.prototype.asyncVerifynin = function (nin, flags) {
    return asink(function * () {
      let txin = this.tx.txins[nin]
      let scriptSig = txin.script
      let scriptPubKey = this.txoutmap.get(txin.txHashBuf, txin.txOutNum).script
      let interp = new Interp()
      let workersResult = yield Workers.asyncObjectMethod(interp, 'verify', [scriptSig, scriptPubKey, this.tx, nin, flags])
      let verified = JSON.parse(workersResult.resbuf.toString())
      return verified
    }, this)
  }

  return TxVerifier
}

inject = require('injecter')(inject, dependencies)
let TxVerifier = inject()
TxVerifier.MainNet = inject({
  Block: require('./block').MainNet
})
TxVerifier.TestNet = inject({
  Block: require('./block').TestNet
})
module.exports = TxVerifier
