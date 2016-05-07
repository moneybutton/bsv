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

  class MsgReject extends Msg {
    initialize () {
      Msg.prototype.initialize.call(this)
      this.setCmd('reject')
      return this
    }

    fromReject (reject) {
      return this.setData(reject.toBuffer())
    }

    static fromReject (reject) {
      return new this().fromReject(reject)
    }

    asyncFromReject (reject) {
      return this.asyncSetData(reject.toBuffer())
    }

    static asyncFromReject (reject) {
      return new this().asyncFromReject(reject)
    }

    toReject () {
      return new Reject().fromBuffer(this.dataBuf)
    }

    isValid () {
      return this.getCmd() === 'reject'
    }
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
