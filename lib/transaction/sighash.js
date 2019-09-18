'use strict'

var buffer = require('buffer')

var Signature = require('../crypto/signature')
var Script = require('../script')
var Output = require('./output')
var BufferReader = require('../encoding/bufferreader')
var BufferWriter = require('../encoding/bufferwriter')
var BN = require('../crypto/bn')
var Hash = require('../crypto/hash')
var ECDSA = require('../crypto/ecdsa')
var $ = require('../util/preconditions')
var BufferUtil = require('../util/buffer')
var Interpreter = require('../script/interpreter')
var _ = require('../util/_')

var SIGHASH_SINGLE_BUG = '0000000000000000000000000000000000000000000000000000000000000001'
var BITS_64_ON = 'ffffffffffffffff'

// By default, we sign with sighash_forkid
var DEFAULT_SIGN_FLAGS = Interpreter.SCRIPT_ENABLE_SIGHASH_FORKID

var sighashForForkId = function (transaction, sighashType, inputNumber, subscript, satoshisBN) {
  var input = transaction.inputs[inputNumber]
  $.checkArgument(
    satoshisBN instanceof BN,
    'For ForkId=0 signatures, satoshis or complete input must be provided'
  )

  function GetPrevoutHash (tx) {
    var writer = new BufferWriter()

    _.each(tx.inputs, function (input) {
      writer.writeReverse(input.prevTxId)
      writer.writeUInt32LE(input.outputIndex)
    })

    var buf = writer.toBuffer()
    var ret = Hash.sha256sha256(buf)
    return ret
  }

  function GetSequenceHash (tx) {
    var writer = new BufferWriter()

    _.each(tx.inputs, function (input) {
      writer.writeUInt32LE(input.sequenceNumber)
    })

    var buf = writer.toBuffer()
    var ret = Hash.sha256sha256(buf)
    return ret
  }

  function GetOutputsHash (tx, n) {
    var writer = new BufferWriter()

    if (_.isUndefined(n)) {
      _.each(tx.outputs, function (output) {
        output.toBufferWriter(writer)
      })
    } else {
      tx.outputs[n].toBufferWriter(writer)
    }

    var buf = writer.toBuffer()
    var ret = Hash.sha256sha256(buf)
    return ret
  }

  var hashPrevouts = BufferUtil.emptyBuffer(32)
  var hashSequence = BufferUtil.emptyBuffer(32)
  var hashOutputs = BufferUtil.emptyBuffer(32)

  if (!(sighashType & Signature.SIGHASH_ANYONECANPAY)) {
    hashPrevouts = GetPrevoutHash(transaction)
  }

  if (!(sighashType & Signature.SIGHASH_ANYONECANPAY) &&
    (sighashType & 31) !== Signature.SIGHASH_SINGLE &&
    (sighashType & 31) !== Signature.SIGHASH_NONE) {
    hashSequence = GetSequenceHash(transaction)
  }

  if ((sighashType & 31) !== Signature.SIGHASH_SINGLE && (sighashType & 31) !== Signature.SIGHASH_NONE) {
    hashOutputs = GetOutputsHash(transaction)
  } else if ((sighashType & 31) === Signature.SIGHASH_SINGLE && inputNumber < transaction.outputs.length) {
    hashOutputs = GetOutputsHash(transaction, inputNumber)
  }

  var writer = new BufferWriter()

  // Version
  writer.writeInt32LE(transaction.version)

  // Input prevouts/nSequence (none/all, depending on flags)
  writer.write(hashPrevouts)
  writer.write(hashSequence)

  //  outpoint (32-byte hash + 4-byte little endian)
  writer.writeReverse(input.prevTxId)
  writer.writeUInt32LE(input.outputIndex)

  // scriptCode of the input (serialized as scripts inside CTxOuts)
  writer.writeVarintNum(subscript.toBuffer().length)
  writer.write(subscript.toBuffer())

  // value of the output spent by this input (8-byte little endian)
  writer.writeUInt64LEBN(satoshisBN)

  // nSequence of the input (4-byte little endian)
  var sequenceNumber = input.sequenceNumber
  writer.writeUInt32LE(sequenceNumber)

  // Outputs (none/one/all, depending on flags)
  writer.write(hashOutputs)

  // Locktime
  writer.writeUInt32LE(transaction.nLockTime)

  // sighashType
  writer.writeUInt32LE(sighashType >>> 0)

  var buf = writer.toBuffer()
  var ret = Hash.sha256sha256(buf)
  ret = new BufferReader(ret).readReverse()
  return ret
}

/**
 * Returns a buffer of length 32 bytes with the hash that needs to be signed
 * for witness programs as defined by:
 * https://github.com/bitcoin/bips/blob/master/bip-0143.mediawiki
 *
 * @name Signing.sighash
 * @param {Transaction} transaction the transaction to sign
 * @param {number} sighashType the type of the hash
 * @param {number} inputNumber the input index for the signature
 * @param {Buffer} scriptCode
 * @param {Buffer} satoshisBuffer
 */
var sighashBip143 = function sighashBip143(transaction, sighashType, inputNumber, scriptCode, satoshisBuffer, flags) {
  /* jshint maxstatements: 50 */
  var hashPrevouts;
  var hashSequence;
  var hashOutputs;
  if (!(sighashType & Signature.SIGHASH_ANYONECANPAY)) {
    var buffers = [];
    for (var n = 0; n < transaction.inputs.length; n++) {
      var input = transaction.inputs[n];
      var prevTxIdBuffer = new BufferReader(input.prevTxId).readReverse();
      buffers.push(prevTxIdBuffer);
      var outputIndexBuffer = new Buffer(new Array(4));
      outputIndexBuffer.writeUInt32LE(input.outputIndex, 0);
      buffers.push(outputIndexBuffer);
    }
    hashPrevouts = Hash.sha256sha256(Buffer.concat(buffers));
  }else{
    hashPrevouts =  Buffer.alloc(32);
  }

  if (!(sighashType & Signature.SIGHASH_ANYONECANPAY) &&
      (sighashType & 0x1f) !== Signature.SIGHASH_SINGLE && (sighashType & 0x1f) !== Signature.SIGHASH_NONE) {

    var sequenceBuffers = [];
    for (var m = 0; m < transaction.inputs.length; m++) {
      var sequenceBuffer = new Buffer(new Array(4));
      sequenceBuffer.writeUInt32LE(transaction.inputs[m].sequenceNumber, 0);
      sequenceBuffers.push(sequenceBuffer);
    }
    hashSequence = Hash.sha256sha256(Buffer.concat(sequenceBuffers));
  }else{
    hashSequence =  Buffer.alloc(32);
  }

  var outputWriter = new BufferWriter();
  if ((sighashType & 0x1f) !== Signature.SIGHASH_SINGLE && (sighashType & 0x1f) !== Signature.SIGHASH_NONE) {
    for (var p = 0; p < transaction.outputs.length; p++) {
      transaction.outputs[p].toBufferWriter(outputWriter);
    }
    var bbuf = outputWriter.toBuffer();
    hashOutputs = Hash.sha256sha256(bbuf);
  } else if ((sighashType & 0x1f) === Signature.SIGHASH_SINGLE && inputNumber < transaction.outputs.length) {
    transaction.outputs[inputNumber].toBufferWriter(outputWriter);
    hashOutputs = Hash.sha256sha256(outputWriter.toBuffer());
  }else{
    hashOutputs =  Buffer.alloc(32);
  }

  // Version
  var writer = new BufferWriter();
  writer.writeUInt32LE(transaction.version);
  // Input prevouts/nSequence (none/all, depending on flags)
  writer.write(hashPrevouts);
  writer.write(hashSequence);
  // The input being signed (replacing the scriptSig with scriptCode + amount)
  // The prevout may already be contained in hashPrevout, and the nSequence
  // may already be contain in hashSequence.
  var outpointId = new BufferReader(transaction.inputs[inputNumber].prevTxId).readReverse();
  writer.write(outpointId);
  writer.writeUInt32LE(transaction.inputs[inputNumber].outputIndex);

  writer.write(scriptCode);

  writer.write(satoshisBuffer);

  writer.writeUInt32LE(transaction.inputs[inputNumber].sequenceNumber);
  // Outputs (none/one/all, depending on flags)
  writer.write(hashOutputs);
  
  // Locktime
  writer.writeUInt32LE(transaction.nLockTime);

  // Sighash type
  sighashType = sighashType | Signature.SIGHASH_FORKID;
  writer.writeInt32LE(sighashType);
  return Hash.sha256sha256(writer.toBuffer());
};


/**
 * Returns a buffer of length 32 bytes with the hash that needs to be signed
 * for OP_CHECKSIG.
 *
 * @name Signing.sighash
 * @param {Transaction} transaction the transaction to sign
 * @param {number} sighashType the type of the hash
 * @param {number} inputNumber the input index for the signature
 * @param {Script} subscript the script that will be signed
 * @param {satoshisBN} input's amount (for  ForkId signatures)
 *
 */
var sighash = function sighash (transaction, sighashType, inputNumber, subscript, satoshisBN, flags) {
  var Transaction = require('./transaction')
  var Input = require('./input')

  if (_.isUndefined(flags)) {
    flags = DEFAULT_SIGN_FLAGS
  }

  // Copy transaction
  var txcopy = Transaction.shallowCopy(transaction)

  // Copy script
  subscript = new Script(subscript)

  if (flags & Interpreter.SCRIPT_ENABLE_REPLAY_PROTECTION) {
    // Legacy chain's value for fork id must be of the form 0xffxxxx.
    // By xoring with 0xdead, we ensure that the value will be different
    // from the original one, even if it already starts with 0xff.
    var forkValue = sighashType >> 8
    var newForkValue = 0xff0000 | (forkValue ^ 0xdead)
    sighashType = (newForkValue << 8) | (sighashType & 0xff)
  }

  if ((sighashType & Signature.SIGHASH_FORKID) && (flags & Interpreter.SCRIPT_ENABLE_SIGHASH_FORKID)) {
    return sighashForForkId(txcopy, sighashType, inputNumber, subscript, satoshisBN)
  }

  // For no ForkId sighash, separators need to be removed.
  subscript.removeCodeseparators()

  var i

  for (i = 0; i < txcopy.inputs.length; i++) {
    // Blank signatures for other inputs
    txcopy.inputs[i] = new Input(txcopy.inputs[i]).setScript(Script.empty())
  }

  txcopy.inputs[inputNumber] = new Input(txcopy.inputs[inputNumber]).setScript(subscript)

  if ((sighashType & 31) === Signature.SIGHASH_NONE ||
    (sighashType & 31) === Signature.SIGHASH_SINGLE) {
    // clear all sequenceNumbers
    for (i = 0; i < txcopy.inputs.length; i++) {
      if (i !== inputNumber) {
        txcopy.inputs[i].sequenceNumber = 0
      }
    }
  }

  if ((sighashType & 31) === Signature.SIGHASH_NONE) {
    txcopy.outputs = []
  } else if ((sighashType & 31) === Signature.SIGHASH_SINGLE) {
    // The SIGHASH_SINGLE bug.
    // https://bitcointalk.org/index.php?topic=260595.0
    if (inputNumber >= txcopy.outputs.length) {
      return Buffer.from(SIGHASH_SINGLE_BUG, 'hex')
    }

    txcopy.outputs.length = inputNumber + 1

    for (i = 0; i < inputNumber; i++) {
      txcopy.outputs[i] = new Output({
        satoshis: BN.fromBuffer(buffer.Buffer.from(BITS_64_ON, 'hex')),
        script: Script.empty()
      })
    }
  }

  if (sighashType & Signature.SIGHASH_ANYONECANPAY) {
    txcopy.inputs = [txcopy.inputs[inputNumber]]
  }

  var buf = new BufferWriter()
    .write(txcopy.toBuffer())
    .writeInt32LE(sighashType)
    .toBuffer()
  var ret = Hash.sha256sha256(buf)
  ret = new BufferReader(ret).readReverse()
  return ret
}

/**
 * Create a signature
 *
 * @name Signing.sign
 * @param {Transaction} transaction
 * @param {PrivateKey} privateKey
 * @param {number} sighash
 * @param {number} inputIndex
 * @param {Script} subscript
 * @param {satoshisBN} input's amount
 * @return {Signature}
 */
function sign (transaction, privateKey, sighashType, inputIndex, subscript, satoshisBN, flags) {
  // var hashbuf = sighash(transaction, sighashType, inputIndex, subscript, satoshisBN, flags)
  var subscriptBuffer = subscript.toBuffer();
  var scriptCodeWriter = new BufferWriter();
  scriptCodeWriter.writeVarintNum(subscriptBuffer.length);
  scriptCodeWriter.write(subscriptBuffer);
  var satoshisBuffer;
  if (satoshisBN) {
      satoshisBuffer = new BufferWriter().writeUInt64LEBN(new BN(satoshisBN)).toBuffer();
    } else {
      satoshisBuffer = this.inputs[nin].getSatoshisBuffer();
    }
  var hashbuf = sighashBip143(transaction, sighashType, inputIndex, scriptCodeWriter.toBuffer(), satoshisBuffer, flags);
  var sig = ECDSA.sign(hashbuf, privateKey, 'big').set({
    nhashtype: sighashType
  })
  return sig
}

/**
 * Verify a signature
 *
 * @name Signing.verify
 * @param {Transaction} transaction
 * @param {Signature} signature
 * @param {PublicKey} publicKey
 * @param {number} inputIndex
 * @param {Script} subscript
 * @param {satoshisBN} input's amount
 * @param {flags} verification flags
 * @return {boolean}
 */
function verify (transaction, signature, publicKey, inputIndex, subscript, satoshisBN, flags) {
  $.checkArgument(!_.isUndefined(transaction))
  $.checkArgument(!_.isUndefined(signature) && !_.isUndefined(signature.nhashtype))
  // var hashbuf = sighash(transaction, signature.nhashtype, inputIndex, subscript, satoshisBN, flags)
  var subscriptBuffer = subscript.toBuffer();
  var scriptCodeWriter = new BufferWriter();
  scriptCodeWriter.writeVarintNum(subscriptBuffer.length);
  scriptCodeWriter.write(subscriptBuffer);
  var satoshisBuffer;
  if (satoshisBN) {
      satoshisBuffer = new BufferWriter().writeUInt64LEBN(new BN(satoshisBN)).toBuffer();
    } else {
      satoshisBuffer = this.inputs[nin].getSatoshisBuffer();
    }
  var hashbuf = sighashBip143(transaction, signature.nhashtype, inputIndex, scriptCodeWriter.toBuffer(), satoshisBuffer, flags);
  return ECDSA.verify(hashbuf, signature, publicKey, 'big')
}

/**
 * @namespace Signing
 */
module.exports = {
  sighash: sighash,
  sign: sign,
  verify: verify
}
