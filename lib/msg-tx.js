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

  function MsgTx (magicnum, cmdbuf, datasize, checksumbuf, databuf) {
    if (!(this instanceof MsgTx)) {
      return new MsgTx(magicnum, cmdbuf, datasize, checksumbuf, databuf)
    }
    this.initialize()
    this.fromObject({magicnum, cmdbuf, datasize, checksumbuf, databuf})
  }

  MsgTx.prototype = Object.create(Msg.prototype)
  MsgTx.prototype.constructor = MsgTx

  MsgTx.prototype.initialize = function () {
    Msg.prototype.initialize.call(this)
    this.setCmd('tx')
    return this
  }

  MsgTx.prototype.fromTx = function (tx) {
    this.setData(tx.toBuffer())
    return this
  }

  MsgTx.prototype.asyncFromTx = function (tx) {
    return this.asyncSetData(tx.toBuffer())
  }

  MsgTx.prototype.toTx = function () {
    return new Tx().fromBuffer(this.databuf)
  }

  MsgTx.prototype.isValid = function () {
    return this.getCmd() === 'tx'
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
