/**
 * MsgReject
 * ============
 *
 * Sent when a message is rejected, analous to a "404" or other HTTP error.
 * Conveys the reason why the message was rejected.
 */
'use strict'
let dependencies = {
  Reject: require('./reject'),
  Msg: require('./msg')
}

let inject = function (deps) {
  let Reject = deps.Reject
  let Msg = deps.Msg

  function MsgReject (magicnum, cmdbuf, datasize, checksumbuf, databuf) {
    if (!(this instanceof MsgReject)) {
      return new MsgReject(magicnum, cmdbuf, datasize, checksumbuf, databuf)
    }
    this.initialize()
    this.fromObject({magicnum, cmdbuf, datasize, checksumbuf, databuf})
  }

  MsgReject.prototype = Object.create(Msg.prototype)
  MsgReject.prototype.constructor = MsgReject

  MsgReject.prototype.initialize = function () {
    Msg.prototype.initialize.call(this)
    this.setCmd('reject')
    return this
  }

  MsgReject.prototype.fromReject = function (reject) {
    return this.setData(reject.toBuffer())
  }

  MsgReject.prototype.asyncFromReject = function (reject) {
    return this.asyncSetData(reject.toBuffer())
  }

  MsgReject.prototype.toReject = function () {
    return Reject().fromBuffer(this.databuf)
  }

  MsgReject.prototype.isValid = function () {
    return this.getCmd() === 'reject'
  }

  return MsgReject
}

inject = require('injecter')(inject, dependencies)
let MsgReject = inject()
MsgReject.Mainnet = inject({
  Msg: require('./msg').Mainnet
})
MsgReject.Testnet = inject({
  Msg: require('./msg').Testnet
})
module.exports = MsgReject
