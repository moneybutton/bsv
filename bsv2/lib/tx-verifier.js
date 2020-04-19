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
  Workers: require('./workers')
}

let inject = function (deps) {
  let Bn = deps.Bn
  let Block = deps.Block
  let Interp = deps.Interp
  let Struct = deps.Struct
  let Tx = deps.Tx
  let Workers = deps.Workers

  class TxVerifier extends Struct {
    constructor (tx, txOutMap, errStr, interp) {
      super({ tx, txOutMap, errStr, interp })
    }

    /**
     * Verifies that the transaction is valid both by performing basic checks, such
     * as ensuring that no two inputs are the same, as well as by verifying every
     * script. The two checks are checkStr, which is analagous to bitcoind's
     * CheckTransaction, and verifyStr, which runs the script interpreter.
     *
     * This does NOT check that any possible claimed fees are accurate; checking
     * that the fees are accurate requires checking that the input transactions are
     * valid, which is not performed by this test. That check is done with the
     * normal verify function.
     */
    verify (flags) {
      return !this.checkStr() && !this.verifyStr(flags)
    }

    /*
     * Returns true if the transaction was verified successfully (that is no
     * error was found), and false otherwise. In case an error was found the
     * error message can be accessed by calling this.getDebugString().
     */
    async asyncVerify (flags) {
      let verifyStr = await this.asyncVerifyStr(flags)
      return !this.checkStr() && !verifyStr
    }

    /**
     * Convenience method to verify a transaction.
     */
    static verify (tx, txOutMap, flags) {
      return new TxVerifier(tx, txOutMap).verify(flags)
    }

    static asyncVerify (tx, txOutMap, flags) {
      return new TxVerifier(tx, txOutMap).asyncVerify(flags)
    }

    /**
     * Check that a transaction passes basic sanity tests. If not, return a string
     * describing the error. This function contains the same logic as
     * CheckTransaction in bitcoin core.
     */
    checkStr () {
      // Basic checks that don't depend on any context
      if (this.tx.txIns.length === 0 || this.tx.txInsVi.toNumber() === 0) {
        this.errStr = 'transaction txIns empty'
        return this.errStr
      }
      if (this.tx.txOuts.length === 0 || this.tx.txOutsVi.toNumber() === 0) {
        this.errStr = 'transaction txOuts empty'
        return this.errStr
      }

      // Size limits
      if (this.tx.toBuffer().length > Block.MAX_BLOCK_SIZE) {
        this.errStr = 'transaction over the maximum block size'
        return this.errStr
      }

      // Check for negative or overflow output values
      let valueoutbn = new Bn(0)
      for (let i = 0; i < this.tx.txOuts.length; i++) {
        let txOut = this.tx.txOuts[i]
        if (txOut.valueBn.lt(0)) {
          this.errStr = 'transaction txOut ' + i + ' negative'
          return this.errStr
        }
        if (txOut.valueBn.gt(Tx.MAX_MONEY)) {
          this.errStr = 'transaction txOut ' + i + ' greater than MAX_MONEY'
          return this.errStr
        }
        valueoutbn = valueoutbn.add(txOut.valueBn)
        if (valueoutbn.gt(Tx.MAX_MONEY)) {
          this.errStr =
            'transaction txOut ' + i + ' total output greater than MAX_MONEY'
          return this.errStr
        }
      }

      // Check for duplicate inputs
      let txInmap = {}
      for (let i = 0; i < this.tx.txIns.length; i++) {
        let txIn = this.tx.txIns[i]
        let inputid = txIn.txHashBuf.toString('hex') + ':' + txIn.txOutNum
        if (txInmap[inputid] !== undefined) {
          this.errStr = 'transaction input ' + i + ' duplicate input'
          return this.errStr
        }
        txInmap[inputid] = true
      }

      if (this.tx.isCoinbase()) {
        let buf = this.tx.txIns[0].script.toBuffer()
        if (buf.length < 2 || buf.length > 100) {
          this.errStr = 'coinbase trasaction script size invalid'
          return this.errStr
        }
      } else {
        for (let i = 0; i < this.tx.txIns.length; i++) {
          if (this.tx.txIns[i].hasNullInput()) {
            this.errStr = 'transaction input ' + i + ' has null input'
            return this.errStr
          }
        }
      }
      return false
    }

    /**
     * verify the transaction inputs by running the script interpreter. Returns a
     * string of the script interpreter is invalid, otherwise returns false.
     */
    verifyStr (flags) {
      for (let i = 0; i < this.tx.txIns.length; i++) {
        if (!this.verifyNIn(i, flags)) {
          this.errStr = 'input ' + i + ' failed script verify'
          return this.errStr
        }
      }
      return false
    }

    async asyncVerifyStr (flags) {
      for (let i = 0; i < this.tx.txIns.length; i++) {
        let verifyNIn = await this.asyncVerifyNIn(i, flags)
        if (!verifyNIn) {
          this.errStr = 'input ' + i + ' failed script verify'
          return this.errStr
        }
      }
      return false
    }

    /**
     * Verify a particular input by running the script interpreter. Returns true if
     * the input is valid, false otherwise.
     */
    verifyNIn (nIn, flags) {
      let txIn = this.tx.txIns[nIn]
      let scriptSig = txIn.script
      let txOut = this.txOutMap.get(txIn.txHashBuf, txIn.txOutNum)
      if (!txOut) {
        console.log('output ' + txIn.txOutNum + ' not found')
        return false
      }
      let scriptPubKey = txOut.script
      let valueBn = txOut.valueBn
      this.interp = new Interp()
      let verified = this.interp.verify(
        scriptSig,
        scriptPubKey,
        this.tx,
        nIn,
        flags,
        valueBn
      )
      return verified
    }

    async asyncVerifyNIn (nIn, flags) {
      let txIn = this.tx.txIns[nIn]
      let scriptSig = txIn.script
      let txOut = this.txOutMap.get(txIn.txHashBuf, txIn.txOutNum)
      if (!txOut) {
        console.log('output ' + txIn.txOutNum + ' not found')
        return false
      }
      let scriptPubKey = txOut.script
      let valueBn = txOut.valueBn
      this.interp = new Interp()
      let workersResult = await Workers.asyncObjectMethod(
        this.interp,
        'verify',
        [scriptSig, scriptPubKey, this.tx, nIn, flags, valueBn]
      )
      let verified = JSON.parse(workersResult.resbuf.toString())
      return verified
    }

    getDebugObject () {
      return {
        errStr: this.errStr,
        interpFailure: this.interp ? this.interp.getDebugObject() : undefined
      }
    }

    getDebugString () {
      return JSON.stringify(this.getDebugObject(), null, 2)
    }
  }

  return TxVerifier
}

inject = require('./injecter')(inject, dependencies)
let TxVerifier = inject()
TxVerifier.Mainnet = inject({
  Block: require('./block').Mainnet
})
TxVerifier.Testnet = inject({
  Block: require('./block').Testnet
})
module.exports = TxVerifier
