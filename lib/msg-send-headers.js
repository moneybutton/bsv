/**
 * MsgSendHeaders
 * ==============
 *
 * Tell peer to send block announcements using a "headers" message rather than
 * an "inv" message. This message has no data.
 */
'use strict'
let dependencies = {
  Msg: require('./msg')
}

let inject = function (deps) {
  let Msg = deps.Msg

  class MsgSendHeaders extends Msg {
    initialize () {
      Msg.prototype.initialize.call(this)
      this.setCmd('sendheaders')
      this.datasize = 0
      this.dataBuf = new Buffer(0)
      this.checksumbuf = new Buffer('5df6e0e2', 'hex')
      return this
    }

    isValid () {
      return this.getCmd() === 'sendheaders' && this.dataBuf.length === 0
    }
  }

  return MsgSendHeaders
}

inject = require('injecter')(inject, dependencies)
let MsgSendHeaders = inject()
MsgSendHeaders.Mainnet = inject({
  MsgInv: require('./msg-inv').Mainnet
})
MsgSendHeaders.Testnet = inject({
  MsgInv: require('./msg-inv').Testnet
})
module.exports = MsgSendHeaders
