'use strict'

var inherits = require('inherits')

var $ = require('../../util/preconditions')

var Hash = require('../../crypto/hash')
var Input = require('./input')
var Output = require('../output')
var Sighash = require('../sighash')
var Script = require('../../script')
var Signature = require('../../crypto/signature')
var TransactionSignature = require('../signature')

/**
 * Represents a special kind of input of PayToPublicKeyHash kind.
 * @constructor
 */
function PublicKeyHashInput () {
  Input.apply(this, arguments)
}
inherits(PublicKeyHashInput, Input)

/**
 * @param {Transaction} transaction - the transaction to be signed
 * @param {PrivateKey} privateKey - the private key with which to sign the transaction
 * @param {number} index - the index of the input in the transaction input vector
 * @param {number=} sigtype - the type of signature, defaults to Signature.SIGHASH_ALL
 * @param {Buffer=} hashData - the precalculated hash of the public key associated with the privateKey provided
 * @return {Array} of objects that can be
 */
PublicKeyHashInput.prototype.getSignatures = function (transaction, privateKey, index, sigtype, hashData) {
  $.checkState(this.output instanceof Output)
  hashData = hashData || Hash.sha256ripemd160(privateKey.publicKey.toBuffer())
  sigtype = sigtype || (Signature.SIGHASH_ALL | Signature.SIGHASH_FORKID)

  if (hashData.equals(this.output.script.getPublicKeyHash())) {
    return [new TransactionSignature({
      publicKey: privateKey.publicKey,
      prevTxId: this.prevTxId,
      outputIndex: this.outputIndex,
      inputIndex: index,
      signature: Sighash.sign(transaction, privateKey, sigtype, index, this.output.script, this.output.satoshisBN),
      sigtype: sigtype
    })]
  }
  return []
}

/**
 * Add the provided signature
 *
 * @param {Object} signature
 * @param {PublicKey} signature.publicKey
 * @param {Signature} signature.signature
 * @param {number=} signature.sigtype
 * @return {PublicKeyHashInput} this, for chaining
 */
PublicKeyHashInput.prototype.addSignature = function (transaction, signature) {
  $.checkState(this.isValidSignature(transaction, signature), 'Signature is invalid')

  this.setScript(Script.buildPublicKeyHashIn(
    signature.publicKey,
    signature.signature.toDER(),
    signature.sigtype
  ))
  return this
}

/**
 * Clear the input's signature
 * @return {PublicKeyHashInput} this, for chaining
 */
PublicKeyHashInput.prototype.clearSignatures = function () {
  this.setScript(Script.empty())
  return this
}

/**
 * Query whether the input is signed
 * @return {boolean}
 */
PublicKeyHashInput.prototype.isFullySigned = function () {
  return this.script.isPublicKeyHashIn()
}

// 32   txid
// 4    output index
// --- script ---
// 1    script size (VARINT)
// 1    signature size (OP_PUSHDATA)
// <=72 signature (DER + SIGHASH type)
// 1    public key size (OP_PUSHDATA)
// 33   compressed public key
//
// 4    sequence number
PublicKeyHashInput.SCRIPT_MAX_SIZE = 108

PublicKeyHashInput.prototype._estimateSize = function () {
  return Input.BASE_SIZE + PublicKeyHashInput.SCRIPT_MAX_SIZE
}

module.exports = PublicKeyHashInput
