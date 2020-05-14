/**
 * Transaction Builder
 * ===================
 *
 * Transaction Builder. This is a convenience class for building pubKeyHash and
 * p2sh transactions. You can pay to pubKeyHash to p2sh and can spend
 * pubKeyHash or p2sh-pubKeyHash or p2sh-multisig.
 */
'use strict'

let Address = require('./address')
let Constants = require('./constants').Default.TxBuilder
let Bn = require('./bn')
let HashCache = require('./hash-cache')
let PubKey = require('./pub-key')
let Script = require('./script')
let Sig = require('./sig')
let Struct = require('./struct')
let Tx = require('./tx')
let TxIn = require('./tx-in')
let TxOut = require('./tx-out')
let TxOutMap = require('./tx-out-map')
let VarInt = require('./var-int')

class TxBuilder extends Struct {
  constructor (
    tx = new Tx(),
    txIns = [],
    txOuts = [],
    uTxOutMap = new TxOutMap(),
    changeScript,
    feePerKbNum = Constants.feePerKbNum,
    nLockTime = 0,
    versionBytesNum = 1,
    sigsPerInput = 1,
    dust = Constants.dust,
    dustToChangeOrFees = false,
    hashCache = new HashCache()
  ) {
    super({
      tx,
      txIns,
      txOuts,
      uTxOutMap,
      changeScript,
      feePerKbNum,
      nLockTime,
      versionBytesNum,
      sigsPerInput,
      dust,
      dustToChangeOrFees,
      hashCache
    })
  }

  toJSON () {
    let json = {}
    json.tx = this.tx.toHex()
    json.txIns = this.txIns.map(txIn => txIn.toHex())
    json.txOuts = this.txOuts.map(txOut => txOut.toHex())
    json.uTxOutMap = this.uTxOutMap.toJSON()
    if (this.changeScript) {
      json.changeScript = this.changeScript.toHex()
    }
    json.feePerKbNum = this.feePerKbNum
    json.sigsPerInput = this.sigsPerInput
    json.dust = this.dust
    json.dustToChangeOrFees = this.dustToChangeOrFees
    return json
  }

  fromJSON (json) {
    this.tx = new Tx().fromHex(json.tx)
    this.txIns = json.txIns.map(txIn => TxIn.fromHex(txIn))
    this.txOuts = json.txOuts.map(txOut => TxOut.fromHex(txOut))
    this.uTxOutMap = new TxOutMap().fromJSON(json.uTxOutMap)
    if (json.changeScript) {
      this.changeScript = new Script().fromHex(json.changeScript)
    }
    this.feePerKbNum = json.feePerKbNum || this.feePerKbNum
    this.sigsPerInput = json.sigsPerInput || this.sigsPerInput
    this.dust = json.dust || this.dust
    this.dustToChangeOrFees =
        json.dustToChangeOrFees || this.dustToChangeOrFees
    return this
  }

  setFeePerKbNum (feePerKbNum) {
    if (typeof feePerKbNum !== 'number' || feePerKbNum <= 0) {
      throw new Error('cannot set a fee of zero or less')
    }
    this.feePerKbNum = feePerKbNum
    return this
  }

  setChangeAddress (changeAddress) {
    this.changeScript = changeAddress.toOutputScript()
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

  setVersion (versionBytesNum) {
    this.versionBytesNum = versionBytesNum
    return this
  }

  /**
     * Set the number of signatures in an input. This figure is used to
     * estimate the size of a transaction before signing it so that we can
     * calculate the fee correctly. If all inputs are pubkeyhash, use 1. If all
     * inputs are 2-of-2 multisig, use 2. Unfortunately we have poor support
     * for the case where some inputs have some number and others have another.
     *
     * TODO: Support case where some inputs have 1 sig and others have 2 or more.
     */
  setSigsPerInput (sigsPerInput = 1) {
    this.sigsPerInput = sigsPerInput
    return this
  }

  /**
     * Sometimes one of your outputs or the change output will be less than
     * dust. Values less than dust cannot be broadcast. If you are OK with
     * sending dust amounts to fees, then set this value to true.
     */
  setDust (dust = Constants.dust) {
    this.dust = dust
    return this
  }

  /**
     * Sometimes one of your outputs or the change output will be less than
     * dust. Values less than dust cannot be broadcast. If you are OK with
     * sending dust amounts to fees, then set this value to true. We
     * preferentially send all dust to the change if possible. However, that
     * might not be possible if the change itself is less than dust, in which
     * case all dust goes to fees.
     */
  sendDustToChangeOrFees (dustToChangeOrFees = false) {
    this.dustToChangeOrFees = dustToChangeOrFees
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
    if (
      !Buffer.isBuffer(txHashBuf) ||
        !(typeof txOutNum === 'number') ||
        !(txOut instanceof TxOut) ||
        !(script instanceof Script)
    ) {
      throw new Error('invalid one of: txHashBuf, txOutNum, txOut, script')
    }
    this.txIns.push(
      TxIn.fromProperties(txHashBuf, txOutNum, script, nSequence)
    )
    this.uTxOutMap.add(txHashBuf, txOutNum, txOut)
    return this
  }

  /**
     * Pay "from" a pubKeyHash output - in other words, add an input to the
     * transaction.
     */
  inputFromPubKeyHash (txHashBuf, txOutNum, txOut, pubKey, nSequence) {
    if (
      !Buffer.isBuffer(txHashBuf) ||
        typeof txOutNum !== 'number' ||
        !(txOut instanceof TxOut) ||
        !(pubKey instanceof PubKey)
    ) {
      throw new Error('invalid one of: txHashBuf, txOutNum, txOut, pubKey')
    }
    this.txIns.push(
      new TxIn()
        .fromObject({ nSequence })
        .fromPubKeyHashTxOut(txHashBuf, txOutNum, txOut, pubKey)
    )
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
    let script = new Script().fromPubKeyHash(addr.hashBuf)
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
    let outAmount = new Bn(0)
    this.txOuts.forEach(txOut => {
      if (txOut.valueBn.lt(this.dust) && !txOut.script.isOpReturn()) {
        if (this.dustToChangeOrFees) {
          // This output is smaller than dust, and the dustToChangeOrFees option
          // is set, so we will simply not add this output, and that means
          // the amount will go to fees.
          if (process.browser) {
            console.log(
              'tx-builder: buildOutputs: sending dust to change or fees for txOut:',
              txOut.toJSON()
            )
          }
          return
        }
        throw new Error('cannot create output lesser than dust')
      }
      outAmount = outAmount.add(txOut.valueBn)
      this.tx.addTxOut(txOut)
    })
    return outAmount
  }

  buildInputs (outAmount, extraInputsNum = 0) {
    let inAmount = new Bn(0)
    for (let txIn of this.txIns) {
      let txOut = this.uTxOutMap.get(txIn.txHashBuf, txIn.txOutNum)
      inAmount = inAmount.add(txOut.valueBn)
      this.tx.addTxIn(txIn)
      if (inAmount.geq(outAmount)) {
        if (extraInputsNum <= 0) {
          break
        }
        extraInputsNum--
      }
    }
    if (inAmount.lt(outAmount)) {
      throw new Error(
        'not enough funds for output: inAmount ' +
            inAmount.toNumber() +
            ' outAmount ' +
            outAmount.toNumber()
      )
    }
    return inAmount
  }

  // For now this method only supports pubKeyHash inputs. It assumes we have
  // not yet added signatures to our inputs.
  // TODO: Support it when the signatures are already on the inputs.
  estimateSize () {
    // largest possible sig size
    let sigsize = 1 + 1 + 1 + 1 + 32 + 1 + 1 + 32 + 1
    sigsize = sigsize * this.sigsPerInput

    let size = this.tx.toBuffer().length
    size = size + sigsize * this.tx.txIns.length
    size = size + 1 // assume txInsVi increases by 1 byte
    return Math.round(size)
  }

  estimateFee (extraFeeAmount = new Bn(0)) {
    // Note that in order to estimate fee correctly for transactions whose
    // inputs are not pubkeyhash, please use the setSigsPerInput method.

    // old style rounding up per kb - pays too high fees:
    // let fee = Math.ceil(this.estimateSize() / 1000) * this.feePerKbNum

    // new style pays lower fees - rounds up to satoshi, not per kb:
    let fee = Math.ceil(this.estimateSize() / 1000 * this.feePerKbNum)

    return new Bn(fee).add(extraFeeAmount)
  }

  /**
     * Builds the transaction and adds the appropriate fee by subtracting from
     * the change output. Note that by default the TxBuilder will use as many
     * inputs as necessary to pay the output amounts and the required fee. The
     * TxBuilder will not necessarily us all the inputs. To force the TxBuilder
     * to use all the inputs (such as if you wish to spend the entire balance
     * of a wallet), set the argument useAllInputs = true.
     */
  build (useAllInputs = false) {
    let changeAmount, shouldfeebn
    if (this.txIns.length <= 0) {
      throw Error('tx-builder number of inputs must be greater than 0')
    }
    for (
      let extraInputsNum = useAllInputs ? this.txIns.length - 1 : 0;
      extraInputsNum < this.txIns.length;
      extraInputsNum++
    ) {
      this.tx = new Tx()
      let outAmount = this.buildOutputs()
      let changeTxOut = TxOut.fromProperties(new Bn(0), this.changeScript)
      this.tx.addTxOut(changeTxOut)

      let inAmount = this.buildInputs(outAmount, extraInputsNum)

      // Set change amount from inAmount - outAmount
      changeAmount = inAmount.sub(outAmount)
      this.tx.txOuts[this.tx.txOuts.length - 1].valueBn = changeAmount

      shouldfeebn = this.estimateFee()
      if (
        changeAmount.geq(shouldfeebn) &&
          changeAmount.sub(shouldfeebn).gt(this.dust)
      ) {
        break
      }
    }
    if (changeAmount.geq(shouldfeebn)) {
      // Subtract fee from change
      changeAmount = changeAmount.sub(shouldfeebn)
      this.tx.txOuts[this.tx.txOuts.length - 1].valueBn = changeAmount

      if (changeAmount.lt(this.dust)) {
        if (this.dustToChangeOrFees) {
          // Remove the change amount since it is less than dust and the
          // builder has requested dust be sent to fees.
          this.tx.txOuts.pop()
        } else {
          throw new Error('unable to create change amount greater than dust')
        }
      }

      this.tx.nLockTime = this.nLockTime
      this.tx.versionBytesNum = this.versionBytesNum
      if (this.tx.txOuts.length === 0) {
        throw new Error(
          'outputs length is zero - unable to create any outputs greater than dust'
        )
      }
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
  fillPubKeyHashSig (i, sig) {
    let txIn = this.tx.txIns[i]
    txIn.script.chunks[0] = new Script().writeBuffer(
      sig.toTxFormat()
    ).chunks[0]
    txIn.scriptVi = VarInt.fromNumber(txIn.script.toBuffer().length)
    return this
  }

  /**
     * Sign an input, but do not fill the signature into the transaction. Return
     * the signature.
     *
     * For a normal transaction, subScript is usually the scriptPubKey. For a
     * p2sh transaction, subScript is usually the redeemScript. If you're not
     * normal because you're using OP_CODESEPARATORs, you know what to do.
     */
  getSig (keyPair, nHashType = Sig.SIGHASH_ALL | Sig.SIGHASH_FORKID, nIn, subScript, flags = Tx.SCRIPT_ENABLE_SIGHASH_FORKID) {
    nHashType = nHashType === undefined ? Sig.SIGHASH_ALL : nHashType
    let valueBn
    if (
      nHashType & Sig.SIGHASH_FORKID &&
        flags & Tx.SCRIPT_ENABLE_SIGHASH_FORKID
    ) {
      let txHashBuf = this.txIns[nIn].txHashBuf
      let txOutNum = this.txIns[nIn].txOutNum
      let txOut = this.uTxOutMap.get(txHashBuf, txOutNum)
      if (!txOut) {
        throw new Error('for SIGHASH_FORKID must provide UTXOs')
      }
      valueBn = txOut.valueBn
    }
    return this.tx.sign(keyPair, nHashType, nIn, subScript, valueBn, flags, this.hashCache)
  }

  /**
     * Asynchronously sign an input in a worker, but do not fill the signature
     * into the transaction. Return the signature.
     */
  asyncGetSig (keyPair, nHashType = Sig.SIGHASH_ALL | Sig.SIGHASH_FORKID, nIn, subScript, flags = Tx.SCRIPT_ENABLE_SIGHASH_FORKID) {
    nHashType = nHashType === undefined ? Sig.SIGHASH_ALL : nHashType
    let valueBn
    if (
      nHashType & Sig.SIGHASH_FORKID &&
        flags & Tx.SCRIPT_ENABLE_SIGHASH_FORKID
    ) {
      let txHashBuf = this.txIns[nIn].txHashBuf
      let txOutNum = this.txIns[nIn].txOutNum
      let txOut = this.uTxOutMap.get(txHashBuf, txOutNum)
      if (!txOut) {
        throw new Error('for SIGHASH_FORKID must provide UTXOs')
      }
      valueBn = txOut.valueBn
    }
    return this.tx.asyncSign(
      keyPair,
      nHashType,
      nIn,
      subScript,
      valueBn,
      flags,
      this.hashCache
    )
  }

  /**
     * Sign ith input with keyPair and insert the signature into the transaction.
     * This method only works for some standard transaction types. For
     * non-standard transaction types, use getSig.
     */
  sign (i, keyPair, txOut, nHashType = Sig.SIGHASH_ALL | Sig.SIGHASH_FORKID, flags = Tx.SCRIPT_ENABLE_SIGHASH_FORKID) {
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
      let sig = this.getSig(keyPair, nHashType, i, subScript, flags, this.hashCache)
      this.fillPubKeyHashSig(i, sig)
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
  async asyncSign (i, keyPair, txOut, nHashType = Sig.SIGHASH_ALL, flags) {
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
      let sig = await this.asyncGetSig(
        keyPair,
        nHashType,
        i,
        subScript,
        flags,
        this.hashCache
      )
      this.fillPubKeyHashSig(i, sig)
    } else {
      throw new Error('cannot sign unknown script type for input ' + i)
    }
    return this
  }
}

module.exports = TxBuilder
