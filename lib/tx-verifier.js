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

  class TxVerifier extends Struct {
    constructor (tx, txOutmap) {
      super()
      this.fromObject({tx, txOutmap})
    }

    /**
     * Verifies that the transaction is valid both by performing basic checks, such
     * as ensuring that no two inputs are the same, as well as by verifying every
     * script. The two checks are checkstr, which is analagous to bitcoind's
     * CheckTransaction, and verifyStr, which runs the script interpreter.
     *
     * This does NOT check that any possible claimed fees are accurate; checking
     * that the fees are accurate requires checking that the input transactions are
     * valid, which is not performed by this test. That check is done with the
     * normal verify function.
     */
    verify (flags) {
      return !this.checkstr() && !this.verifyStr(flags)
    }

    asyncVerify (flags) {
      return asink(function * () {
        let verifyStr = yield this.asyncVerifyStr(flags)
        return !this.checkstr() && !verifyStr
      }, this)
    }

    /**
     * Convenience method to verify a transaction.
     */
    static verify (tx, txOutmap, flags) {
      return new TxVerifier(tx, txOutmap).verify(flags)
    }

    static asyncVerify (tx, txOutmap, flags) {
      return new TxVerifier(tx, txOutmap).asyncVerify(flags)
    }

    /**
     * Check that a transaction passes basic sanity tests. If not, return a string
     * describing the error. This function contains the same logic as
     * CheckTransaction in bitcoin core.
     */
    checkstr () {
      // Basic checks that don't depend on any context
      if (this.tx.txIns.length === 0 || this.tx.txInsVi.toNumber() === 0) {
        return 'transaction txIns empty'
      }
      if (this.tx.txOuts.length === 0 || this.tx.txOutsVi.toNumber() === 0) {
        return 'transaction txOuts empty'
      }

      // Size limits
      if (this.tx.toBuffer().length > Block.MAX_BLOCK_SIZE) {
        return 'transaction over the maximum block size'
      }

      // Check for negative or overflow output values
      let valueoutbn = new Bn(0)
      for (let i = 0; i < this.tx.txOuts.length; i++) {
        let txOut = this.tx.txOuts[i]
        if (txOut.valueBn.lt(0)) {
          return 'transaction txOut ' + i + ' negative'
        }
        if (txOut.valueBn.gt(Tx.MAX_MONEY)) {
          return 'transaction txOut ' + i + ' greater than MAX_MONEY'
        }
        valueoutbn = valueoutbn.add(txOut.valueBn)
        if (valueoutbn.gt(Tx.MAX_MONEY)) {
          return 'transaction txOut ' + i + ' total output greater than MAX_MONEY'
        }
      }

      // Check for duplicate inputs
      let txInmap = {}
      for (let i = 0; i < this.tx.txIns.length; i++) {
        let txIn = this.tx.txIns[i]
        let inputid = txIn.txHashBuf.toString('hex') + ':' + txIn.txOutNum
        if (txInmap[inputid] !== undefined) {
          return 'transaction input ' + i + ' duplicate input'
        }
        txInmap[inputid] = true
      }

      if (this.tx.isCoinbase()) {
        let buf = this.tx.txIns[0].script.toBuffer()
        if (buf.length < 2 || buf.length > 100) {
          return 'coinbase trasaction script size invalid'
        }
      } else {
        for (let i = 0; i < this.tx.txIns.length; i++) {
          if (this.tx.txIns[i].hasNullInput()) {
            return 'tranasction input ' + i + ' has null input'
          }
        }
      }
      return false
    }

    /**
     * verify the transaction inputs by runnIng the script interpreter. Returns a
     * string of the script interpreter is invalid, otherwise returns false.
     */
    verifyStr (flags) {
      for (let i = 0; i < this.tx.txIns.length; i++) {
        if (!this.verifyNIn(i, flags)) {
          return 'input ' + i + ' failed script verify'
        }
      }
      return false
    }

    asyncVerifyStr (flags) {
      return asink(function * () {
        for (let i = 0; i < this.tx.txIns.length; i++) {
          let verifyNIn = yield this.asyncVerifyNIn(i, flags)
          if (!verifyNIn) {
            return 'input ' + i + ' failed script verify'
          }
        }
        return false
      }, this)
    }

    /**
     * Verify a particular input by runnIng the script interpreter. Returns true if
     * the input is valid, false otherwise.
     */
    verifyNIn (nIn, flags) {
      let txIn = this.tx.txIns[nIn]
      let scriptSig = txIn.script
      let scriptPubKey = this.txOutmap.get(txIn.txHashBuf, txIn.txOutNum).script
      let interp = new Interp()
      let verified = interp.verify(scriptSig, scriptPubKey, this.tx, nIn, flags)
      return verified
    }

    asyncVerifyNIn (nIn, flags) {
      return asink(function * () {
        let txIn = this.tx.txIns[nIn]
        let scriptSig = txIn.script
        let scriptPubKey = this.txOutmap.get(txIn.txHashBuf, txIn.txOutNum).script
        let interp = new Interp()
        let workersResult = yield Workers.asyncObjectMethod(interp, 'verify', [scriptSig, scriptPubKey, this.tx, nIn, flags])
        let verified = JSON.parse(workersResult.resbuf.toString())
        return verified
      }, this)
    }
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
