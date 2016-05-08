/**
 * MsgVerAck
 * =========
 *
 * Acknowledge a version message.
 */
'use strict'
let dependencies = {
  Msg: require('./msg-inv')
}

let inject = function (deps) {
  let Msg = deps.Msg

  class MsgVerAck extends Msg {
    initialize () {
      Msg.prototype.initialize.call(this)
      this.setCmd('verack')
      this.datasize = 0
      this.dataBuf = new Buffer(0)
      this.checksumbuf = new Buffer('5df6e0e2', 'hex')
      return this
    }

    isValid () {
      return this.getCmd() === 'verack' && this.dataBuf.length === 0
    }
  }

  return MsgVerAck
}

inject = require('injecter')(inject, dependencies)
let MsgVerAck = inject()
MsgVerAck.Mainnet = inject({
  MsgInv: require('./msg-inv').Mainnet
})
MsgVerAck.Testnet = inject({
  MsgInv: require('./msg-inv').Testnet
})
module.exports = MsgVerAck
