/**
 * Bip68: Relative Lock-Time
 * =========================
 *
 * Bip68 is an important change to the interpretation of sequence numbers in
 * transaction inputs (called nSequence in Yours Bitcoin). Originally, sequence
 * numbers specified which transaction was the most "up-to-date" version, but
 * they did so only insecurely. BEcause they were insecure, they were disabled,
 * and became and almost meanIngless piece of data. Opt-in RBF (Replace-By-Fee)
 * changed that slightly by interpreting non-maximal sequence numbers to be
 * replaceable with greater fees. Bip68 reinterprets sequence numbers entirely
 * as relative lock-time. If the sequence number, appropriately masked, is
 * lower than the number of blocks since the input transaction was confirmed,
 * then the transaction is invalid.
 *
 * This class will embody the code from the Bip68 spec. However, some of that
 * code requires full node support, which (ironically) Yours Bitcoin does not yet
 * support. So it will be finished when appropriate.
 *
 * These functions will need to be added to this class:
 * CalculateSequenceLocks
 * EvaluateSequenceLocks
 * SequenceLocks
 * CheckSequenceLocks
 */
'use strict'

let Struct = require('./struct')
let TxIn = require('./tx-in')

class Bip68 extends Struct {
  static nSequence2Height (nSequence) {
    return nSequence & TxIn.SEQUENCE_LOCKTIME_MASK
  }

  // 0 <= height < 65,535 blocks (1.25 years)
  static height2NSequence (height) {
    return height
  }

  static nSequence2Time (nSequence) {
    return (
      (nSequence & TxIn.SEQUENCE_LOCKTIME_MASK) <<
        TxIn.SEQUENCE_LOCKTIME_GRANULARITY
    )
  }

  // 0 <= time < 33,554,431 seconds (1.06 years)
  static time2NSequence (time) {
    return (
      TxIn.SEQUENCE_LOCKTIME_TYPE_FLAG |
        (time >> TxIn.SEQUENCE_LOCKTIME_GRANULARITY)
    )
  }

  /**
     * Whether Bip68 is disabled for this nSequence.
     */
  static nSequenceIsDisabled (nSequence) {
    return (nSequence & TxIn.SEQUENCE_LOCKTIME_DISABLE_FLAG) !== 0
  }

  /**
     * true if time, false if height
     */
  static nSequenceIsTime (nSequence) {
    return (nSequence & TxIn.SEQUENCE_LOCKTIME_TYPE_FLAG) !== 0
  }

  /**
     * Get the "value" masked out of this nSequence - can be converted to time or
     * height.
     */
  static nSequenceValue (nSequence) {
    return nSequence & TxIn.SEQUENCE_LOCKTIME_MASK
  }
}

module.exports = Bip68
