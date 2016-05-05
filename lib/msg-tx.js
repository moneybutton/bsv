/**
 * MsgTx
 * ========
 *
 * Sends one tx.
 */
'use strict'
let dependencies = {
  Tx: require('./tx'),
  Msg: require('./msg')
}

let inject = function (deps) {
  let Tx = deps.Tx
  let Msg = deps.Msg

  class MsgTx extends Msg {
    initialize () {
      Msg.prototype.initialize.call(this)
      this.setCmd('tx')
      return this
    }

    fromTx (tx) {
      this.setData(tx.toBuffer())
      return this
    }

    static fromTx (tx) {
      return new this().fromTx(tx)
    }

    asyncFromTx (tx) {
      return this.asyncSetData(tx.toBuffer())
    }

    static asyncFromTx (tx) {
      return new this().asyncFromTx(tx)
    }

    toTx () {
      return new Tx().fromBuffer(this.dataBuf)
    }

    isValid () {
      return this.getCmd() === 'tx'
    }
  }

  return MsgTx
}

inject = require('injecter')(inject, dependencies)
let MsgTx = inject()
MsgTx.MainNet = inject({
  Msg: require('./msg').MainNet
})
MsgTx.TestNet = inject({
  Msg: require('./msg').TestNet
})
module.exports = MsgTx
