/**
 * Transaction Builder (experimental)
 * ==================================
 *
 * Transaction Builder. This is a, yet unfinished, convenience class for
 * building pubKeyHash and p2sh transactions, and also for verifying arbitrary
 * transactions (and their inputs). You can (or will be able to) pay to
 * pubKeyHash to p2sh and can spend pubKeyHash or p2sh-pubKeyHash or
 * p2sh-multisig.
 */
'use strict'
let dependencies = {
  Address: require('./address'),
  Constants: require('./constants').Default.TxBuilder,
  Bn: require('./bn'),
  PubKey: require('./pub-key'),
  Script: require('./script'),
  Sig: require('./sig'),
  Struct: require('./struct'),
  Tx: require('./tx'),
  TxIn: require('./tx-in'),
  TxOut: require('./tx-out'),
  TxOutMap: require('./tx-out-map'),
  VarInt: require('./var-int'),
  asink: require('asink')
}

let inject = function (deps) {
  let Address = deps.Address
  let Constants = deps.Constants
  let Bn = deps.Bn
  let PubKey = deps.PubKey
  let Script = deps.Script
  let Sig = deps.Sig
  let Struct = deps.Struct
  let Tx = deps.Tx
  let TxIn = deps.TxIn
  let TxOut = deps.TxOut
  let TxOutMap = deps.TxOutMap
  let VarInt = deps.VarInt
  let asink = deps.asink

  class TxBuilder extends Struct {
    constructor (tx, txIns, txOuts, uTxOutMap, changeScript, feePerKbNum, nLockTime, version) {
      super()
      this.initialize()
      this.fromObject({tx, txIns, txOuts, uTxOutMap, changeScript, feePerKbNum, nLockTime, version})
    }

    initialize () {
      this.tx = new Tx()
      this.txIns = []
      this.txOuts = []
      this.uTxOutMap = new TxOutMap()
      this.feePerKbNum = Constants.feePerKbNum
      this.nLockTime = 0
      this.version = 1
      return this
    }

    toJson () {
      let json = {}
      json.tx = this.tx.toHex()
      json.txIns = this.txIns.map((txIn) => txIn.toHex())
      json.txOuts = this.txOuts.map((txOut) => txOut.toHex())
      json.uTxOutMap = this.uTxOutMap.toJson()
      json.changeScript = this.changeScript.toHex()
      json.feePerKbNum = this.feePerKbNum
      return json
    }

    fromJson (json) {
      this.tx = new Tx().fromHex(json.tx)
      this.txIns = json.txIns.map((txIn) => TxIn.fromHex(txIn))
      this.txOuts = json.txOuts.map((txOut) => TxOut.fromHex(txOut))
      this.uTxOutMap = new TxOutMap().fromJson(json.uTxOutMap)
      this.changeScript = new Script().fromHex(json.changeScript)
      this.feePerKbNum = json.feePerKbNum
      return this
    }

    setFeePerKbNum (feePerKbNum) {
      this.feePerKbNum = feePerKbNum
      return this
    }

    setChangeAddress (changeAddress) {
      this.changeScript = changeAddress.toScript()
      return this
    }

    setChangeScript (changeScript) {
      this.changeScript = changeScript
      return this
    }

    /**
     * nLockTime is an unsigned integer.
     */
    setNLocktime (nLockTime) {
      this.nLockTime = nLockTime
      return this
    }

    setVersion (version) {
      this.version = version
      return this
    }

    /**
     * Import a transaction partially signed by someone else. The only thing you
     * can do after this is sign one or more inputs. Usually used for multisig
     * transactions. uTxOutMap is optional. It is not necessary so long as you
     * pass in the txOut when you sign.
     */
    importPartiallySignedTx (tx, uTxOutMap) {
      this.tx = tx
      if (uTxOutMap) {
        this.uTxOutMap = uTxOutMap
      }
      return this
    }

    /**
     * Pay "from" a script - in other words, add an input to the transaction.
     */
    inputFromScript (txHashBuf, txOutNum, txOut, script, nSequence) {
      if (!(Buffer.isBuffer(txHashBuf)) || !(typeof txOutNum === 'number') || !(txOut instanceof TxOut) || !(script instanceof Script)) {
        throw new Error('invalid one of: txHashBuf, txOutNum, txOut, script')
      }
      this.txIns.push(TxIn.fromProperties(txHashBuf, txOutNum, script, nSequence))
      this.uTxOutMap.add(txHashBuf, txOutNum, txOut)
      return this
    }

    /**
     * Pay "from" a pubKeyHash output - in other words, add an input to the
     * transaction.
     */
    inputFromPubKeyHash (txHashBuf, txOutNum, txOut, pubKey, nSequence) {
      if (!(Buffer.isBuffer(txHashBuf)) || !(typeof txOutNum === 'number') || !(txOut instanceof TxOut) || !(pubKey instanceof PubKey)) {
        throw new Error('invalid one of: txHashBuf, txOutNum, txOut, pubKey')
      }
      this.txIns.push(new TxIn().fromObject({nSequence}).fromPubKeyHashTxOut(txHashBuf, txOutNum, txOut, pubKey))
      this.uTxOutMap.add(txHashBuf, txOutNum, txOut)
      return this
    }

    /**
     * Pay "from" a scriptHash (p2sh) output - in other words, add an input to
     * the transaction.
     */
    inputFromScriptHashMultiSig (txHashBuf, txOutNum, txOut, redeemScript, nSequence) {
      if (!(Buffer.isBuffer(txHashBuf)) || !(typeof txOutNum === 'number') || !(txOut instanceof TxOut) || !(redeemScript instanceof Script)) {
        throw new Error('invalid one of: txHashBuf, txOutNum, txOut, redeemScript')
      }
      this.txIns.push(new TxIn().fromObject({nSequence}).fromScriptHashMultiSigTxOut(txHashBuf, txOutNum, txOut, redeemScript))
      this.uTxOutMap.add(txHashBuf, txOutNum, txOut)
      return this
    }

    /**
     * An address to send funds to, along with the amount. The amount should be
     * denominated in satoshis, not bitcoins.
     */
    outputToAddress (valueBn, addr) {
      if (!(addr instanceof Address) || !(valueBn instanceof Bn)) {
        throw new Error('addr must be an Address, and valueBn must be a Bn')
      }
      let script
      if (addr.type() === 'scriptHash') {
        script = new Script().fromScriptHash(addr.hashBuf)
      } else if (addr.type() === 'pubKeyHash') {
        script = new Script().fromPubKeyHash(addr.hashBuf)
      } else {
        throw new Error('invalid address type')
      }
      this.outputToScript(valueBn, script)
      return this
    }

    /**
     * A script to send funds to, along with the amount. The amount should be
     * denominated in satoshis, not bitcoins.
     */
    outputToScript (valueBn, script) {
      if (!(script instanceof Script) || !(valueBn instanceof Bn)) {
        throw new Error('script must be a Script, and valueBn must be a Bn')
      }
      let txOut = TxOut.fromProperties(valueBn, script)
      this.txOuts.push(txOut)
      return this
    }

    buildOutputs () {
      let outamount = new Bn(0)
      this.txOuts.forEach((txOut) => {
        outamount = outamount.add(txOut.valueBn)
        this.tx.addTxOut(txOut)
      })
      return outamount
    }

    buildInputs (outamount, extraInputsNum) {
      if (!extraInputsNum) {
        extraInputsNum = 0
      }
      let inamount = new Bn(0)
      for (let txIn of this.txIns) {
        let txOut = this.uTxOutMap.get(txIn.txHashBuf, txIn.txOutNum)
        inamount = inamount.add(txOut.valueBn)
        this.tx.addTxIn(txIn)
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

    // For now this method only supports pubKeyHash inputs. It assumes we have
    // not yet added signatures to our inputs.
    // TODO: Support it when the signatures are already on the inputs.
    // TODO: Support p2sh inputs.
    estimateSize () {
      // largest possible sig size
      let sigsize = 1 + 1 + 1 + 1 + 32 + 1 + 1 + 32 + 1
      let size = this.tx.toBuffer().length
      size = size + sigsize * this.tx.txIns.length
      size = size + 1 // assume txInsVi increases by 1 byte
      return size
    }

    estimateFee () {
      // TODO: Support calculating fees from p2sh multisig.
      let fee = Math.ceil(this.estimateSize() / 1000) * this.feePerKbNum
      return new Bn(fee)
    }

    /**
     * Builds the transaction and adds the appropriate fee.
     */
    build () {
      let changeAmount, shouldfeebn
      for (let extraInputsNum = 0; extraInputsNum < this.txIns.length; extraInputsNum++) {
        this.tx = new Tx()
        let outamount = this.buildOutputs()
        let changeScript = this.changeScript
        let changeTxOut = TxOut.fromProperties(new Bn(0), changeScript)
        this.tx.addTxOut(changeTxOut)

        let inamount = this.buildInputs(outamount, extraInputsNum)

        // TODO: What if change amount is less than dust?
        // Set change amount from inamount - outamount
        changeAmount = inamount.sub(outamount)
        this.tx.txOuts[this.tx.txOuts.length - 1].valueBn = changeAmount

        shouldfeebn = this.estimateFee()
        if (changeAmount.geq(shouldfeebn) && changeAmount.sub(shouldfeebn).gt(Constants.dustNum)) {
          break
        }
      }
      if (changeAmount.geq(shouldfeebn)) {
        // Subtract fee from change
        // TODO: What if change is less than dust? What if change is 0?
        changeAmount = changeAmount.sub(shouldfeebn)
        this.tx.txOuts[this.tx.txOuts.length - 1].valueBn = changeAmount

        if (changeAmount.lt(Constants.dustNum)) {
          throw new Error('unable to create change amount greater than dust')
        }

        this.tx.nLockTime = this.nLockTime
        this.tx.version = this.version
        return this
      } else {
        throw new Error('unable to gather enough inputs for outputs and fee')
      }
    }

    /**
     * Check if all signatures are present in a p2sh multisig input script.
     */
    static allSigsPresent (m, script) {
      // The first element is a Famous MultiSig Bug OP_0, and last element is the
      // redeemScript. The rest are signatures.
      let present = 0
      for (let i = 1; i < script.chunks.length - 1; i++) {
        if (script.chunks[i].buf) {
          present++
        }
      }
      return present === m
    }

    /**
     * Remove blank signatures in a p2sh multisig input script.
     */
    static removeBlankSigs (script) {
      // The first element is a Famous MultiSig Bug OP_0, and last element is the
      // redeemScript. The rest are signatures.
      script = new Script(script.chunks.slice()) // copy the script
      for (let i = 1; i < script.chunks.length - 1; i++) {
        if (!script.chunks[i].buf) {
          script.chunks.splice(i, 1) // remove ith element
        }
      }
      return script
    }

    /**
     * Given the signature for a transaction, fill it in the appropriate place
     * for an input that spends a pubKeyHash output.
     */
    fillPubKeyHashSig (i, keyPair, sig) {
      let txIn = this.tx.txIns[i]
      txIn.script.chunks[0] = new Script().writeBuffer(sig.toTxFormat()).chunks[0]
      txIn.scriptVi = VarInt.fromNumber(txIn.script.toBuffer().length)
      return this
    }

    fillScripthashMultiSigSig (i, keyPair, sig, redeemScript) {
      let txIn = this.tx.txIns[i]
      let script = txIn.script

      // three normal opCodes, and the rest are pubKeys
      let pubKeychunks = redeemScript.chunks.slice(1, redeemScript.chunks.length - 2)

      let pubKeybufs = pubKeychunks.map((chunk) => chunk.buf)
      let pubKeybuf = keyPair.pubKey.toBuffer()

      // find which pubKey in the redeemScript is the one we are trying to sign
      let thisPubKeyIndex
      for (thisPubKeyIndex = 0; thisPubKeyIndex < pubKeybufs.length; thisPubKeyIndex++) {
        if (Buffer.compare(pubKeybuf, pubKeybufs[thisPubKeyIndex]) === 0) {
          break
        }
        if (thisPubKeyIndex >= pubKeybufs.length - 1) {
          throw new Error('cannot sign; pubKey not found in input ' + i)
        }
      }

      script.chunks[thisPubKeyIndex + 1] = new Script().writeBuffer(sig.toTxFormat()).chunks[0]
      let m = redeemScript.chunks[0].opCodeNum - 0x50
      if (TxBuilder.allSigsPresent(m, script)) {
        txIn.script = TxBuilder.removeBlankSigs(script)
      }
      txIn.scriptVi = VarInt.fromNumber(txIn.script.toBuffer().length)
      return this
    }

    /**
     * Sign an input, but do not fill the signature into the transaction. Return
     * the signature.
     */
    getSig (keyPair, nHashType, nIn, subScript) {
      nHashType = nHashType === undefined ? Sig.SIGHASH_ALL : nHashType
      return this.tx.sign(keyPair, nHashType, nIn, subScript)
    }

    /**
     * Asynchronously sign an input in a worker, but do not fill the signature
     * into the transaction. Return the signature.
     */
    asyncGetSig (keyPair, nHashType, nIn, subScript) {
      nHashType = nHashType === undefined ? Sig.SIGHASH_ALL : nHashType
      return this.tx.asyncSign(keyPair, nHashType, nIn, subScript)
    }

    /**
     * Sign ith input with keyPair and insert the signature into the transaction.
     * This method only works for some standard transaction types. For
     * non-standard transaction types, use getSig.
     */
    sign (i, keyPair, txOut) {
      let txIn = this.tx.txIns[i]
      let script = txIn.script
      if (script.isPubKeyHashIn()) {
        let txHashBuf = txIn.txHashBuf
        let txOutNum = txIn.txOutNum
        if (!txOut) {
          txOut = this.uTxOutMap.get(txHashBuf, txOutNum)
        }
        let outScript = txOut.script
        let subScript = outScript // true for standard script types
        let sig = this.getSig(keyPair, Sig.SIGHASH_ALL, i, subScript)
        this.fillPubKeyHashSig(i, keyPair, sig, subScript)
      } else if (script.isScriptHashIn()) {
        let redeemScript = new Script().fromBuffer(script.chunks[script.chunks.length - 1].buf)
        let subScript = redeemScript
        if (!redeemScript.isMultiSigOut()) {
          throw new Error('cannot sign non-multisig scriptHash script type for input ' + i)
        }
        let sig = this.tx.sign(keyPair, Sig.SIGHASH_ALL, i, subScript)
        this.fillScripthashMultiSigSig(i, keyPair, sig, redeemScript)
      } else {
        throw new Error('cannot sign unknown script type for input ' + i)
      }
      return this
    }

    /**
     * Asynchronously sign ith input with keyPair in a worker and insert the
     * signature into the transaction.  This method only works for some standard
     * transaction types. For non-standard transaction types, use asyncGetSig.
     */
    asyncSign (i, keyPair, txOut) {
      return asink(function * () {
        let txIn = this.tx.txIns[i]
        let script = txIn.script
        if (script.isPubKeyHashIn()) {
          let txHashBuf = txIn.txHashBuf
          let txOutNum = txIn.txOutNum
          if (!txOut) {
            txOut = this.uTxOutMap.get(txHashBuf, txOutNum)
          }
          let outScript = txOut.script
          let subScript = outScript // true for standard script types
          let sig = yield this.asyncGetSig(keyPair, Sig.SIGHASH_ALL, i, subScript)
          this.fillPubKeyHashSig(i, keyPair, sig, subScript)
        } else if (script.isScriptHashIn()) {
          let redeemScript = new Script().fromBuffer(script.chunks[script.chunks.length - 1].buf)
          let subScript = redeemScript
          if (!redeemScript.isMultiSigOut()) {
            throw new Error('cannot sign non-multisig scriptHash script type for input ' + i)
          }
          let sig = yield this.tx.asyncSign(keyPair, Sig.SIGHASH_ALL, i, subScript)
          this.fillScripthashMultiSigSig(i, keyPair, sig, redeemScript)
        } else {
          throw new Error('cannot sign unknown script type for input ' + i)
        }
        return this
      }, this)
    }
  }

  return TxBuilder
}

inject = require('injecter')(inject, dependencies)
let TxBuilder = inject()
module.exports = TxBuilder
