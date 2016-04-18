/**
 * BIP68: Relative Lock-Time
 * =========================
 *
 * BIP68 is an important change to the interpretation of sequence numbers in
 * transaction inputs (called seqnum in Fullnode). Originally, sequence numbers
 * specified which transaction was the most "up-to-date" version, but they did
 * so only insecurely. Because they were insecure, they were disabled, and
 * became and almost meaningless piece of data. Opt-in RBF (Replace-By-Fee)
 * changed that slightly by interpreting non-maximal sequence numbers to be
 * replaceable with greater fees. BIP68 reinterprets sequence numbers entirely
 * as relative lock-time. If the sequence number, appropriately masked, is
 * lower than the number of blocks since the input transaction was confirmed,
 * then the transaction is invalid.
 *
 * This class will embody the code from the BIP68 spec. However, some of that
 * code requires full node support, which (ironically) Fullnode does not yet
 * support. So it will be finished when appropriate.
 *
 * These functions will need to be added to this class:
 * CalculateSequenceLocks
 * EvaluateSequenceLocks
 * SequenceLocks
 * CheckSequenceLocks
 */
'use strict'

let dependencies = {
  Struct: require('./struct'),
  Txin: require('./txin')
}

let inject = function (deps) {
  let Struct = deps.Struct
  let Txin = deps.Txin

  function BIP68 () {
    if (!(this instanceof BIP68)) {
      return new BIP68()
    }
    this.fromObject({})
  }

  BIP68.prototype = Object.create(Struct.prototype)
  BIP68.prototype.constructor = BIP68

  BIP68.seqnum2height = function (seqnum) {
    return seqnum & Txin.SEQUENCE_LOCKTIME_MASK
  }

  // 0 <= height < 65,535 blocks (1.25 years)
  BIP68.height2seqnum = function (height) {
    return height
  }

  BIP68.seqnum2time = function (seqnum) {
    return (seqnum & Txin.SEQUENCE_LOCKTIME_MASK) << Txin.SEQUENCE_LOCKTIME_GRANULARITY
  }

  // 0 <= time < 33,554,431 seconds (1.06 years)
  BIP68.time2seqnum = function (time) {
    return Txin.SEQUENCE_LOCKTIME_TYPE_FLAG | (time >> Txin.SEQUENCE_LOCKTIME_GRANULARITY)
  }

  /**
   * Whether BIP68 is disabled for this seqnum.
   */
  BIP68.seqnumIsDisabled = function (seqnum) {
    return (seqnum & Txin.SEQUENCE_LOCKTIME_DISABLE_FLAG) !== 0
  }

  /**
   * true if time, false if height
   */
  BIP68.seqnumIsTime = function (seqnum) {
    return (seqnum & Txin.SEQUENCE_LOCKTIME_TYPE_FLAG) !== 0
  }

  /**
   * Get the "value" masked out of this seqnum - can be converted to time or
   * height.
   */
  BIP68.seqnumValue = function (seqnum) {
    return seqnum & Txin.SEQUENCE_LOCKTIME_MASK
  }

  return BIP68
}

inject = require('injecter')(inject, dependencies)
let BIP68 = inject()
module.exports = BIP68
