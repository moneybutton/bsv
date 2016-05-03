/**
 * Transaction Verifier
 * ====================
 */
'use strict'
let dependencies = {
  BN: require('./bn'),
  BR: require('./br'),
  Block: require('./block'),
  Interp: require('./interp'),
  Sig: require('./sig'),
  Struct: require('./struct'),
  Tx: require('./tx'),
  Workers: require('./workers'),
  asink: require('asink')
}

let inject = function (deps) {
  let BN = deps.BN
  let Block = deps.Block
  let Interp = deps.Interp
  let Struct = deps.Struct
  let Tx = deps.Tx
  let Workers = deps.Workers
  let asink = deps.asink

  function Txverifier (tx, txoutmap) {
    if (!(this instanceof Txverifier)) {
      return new Txverifier(tx, txoutmap)
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

  Txverifier.prototype = Object.create(Struct.prototype)
  Txverifier.prototype.constructor = Txverifier

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
  Txverifier.prototype.verify = function (flags) {
    return !this.checkstr() && !this.verifystr(flags)
  }

  Txverifier.prototype.asyncVerify = function (flags) {
    return asink(function * () {
      let verifystr = yield this.asyncVerifystr(flags)
      return !this.checkstr() && !verifystr
    }, this)
  }

  /**
   * Convenience method to verify a transaction.
   */
  Txverifier.verify = function (tx, txoutmap, flags) {
    return Txverifier(tx, txoutmap).verify(flags)
  }

  Txverifier.asyncVerify = function (tx, txoutmap, flags) {
    return Txverifier(tx, txoutmap).asyncVerify(flags)
  }

  /**
   * Check that a transaction passes basic sanity tests. If not, return a string
   * describing the error. This function contains the same logic as
   * CheckTransaction in bitcoin core.
   */
  Txverifier.prototype.checkstr = function () {
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
    let valueoutbn = BN(0)
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
      let inputid = txin.txhashbuf.toString('hex') + ':' + txin.txoutnum
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
  Txverifier.prototype.verifystr = function (flags) {
    for (let i = 0; i < this.tx.txins.length; i++) {
      if (!this.verifynin(i, flags)) {
        return 'input ' + i + ' failed script verify'
      }
    }
    return false
  }

  Txverifier.prototype.asyncVerifystr = function (flags) {
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
  Txverifier.prototype.verifynin = function (nin, flags) {
    let txin = this.tx.txins[nin]
    let scriptSig = txin.script
    let scriptPubkey = this.txoutmap.get(txin.txhashbuf, txin.txoutnum).script
    let interp = Interp()
    let verified = interp.verify(scriptSig, scriptPubkey, this.tx, nin, flags)
    return verified
  }

  Txverifier.prototype.asyncVerifynin = function (nin, flags) {
    return asink(function * () {
      let txin = this.tx.txins[nin]
      let scriptSig = txin.script
      let scriptPubkey = this.txoutmap.get(txin.txhashbuf, txin.txoutnum).script
      let interp = Interp()
      let workersResult = yield Workers.asyncObjectMethod(interp, 'verify', [scriptSig, scriptPubkey, this.tx, nin, flags])
      let verified = JSON.parse(workersResult.resbuf.toString())
      return verified
    }, this)
  }

  return Txverifier
}

inject = require('injecter')(inject, dependencies)
let Txverifier = inject()
Txverifier.Mainnet = inject({
  Block: require('./block').Mainnet
})
Txverifier.Testnet = inject({
  Block: require('./block').Testnet
})
module.exports = Txverifier
