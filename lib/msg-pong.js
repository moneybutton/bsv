/**
 * MsgPong
 * =======
 *
 * A pong message on the p2p network is a reponse to a ping. A pong is almost
 * the same as a ping, in that it contains a randomly selected 8 byte dataBuf.
 * The dataBuf is always the same as the ping it is responding to. And also,
 * the command is set to "pong" instead of "ping".
 */
'use strict'
let dependencies = {
  Msg: require('./msg')
}

let inject = function (deps) {
  let Msg = deps.Msg

  class MsgPong extends Msg {
    initialize () {
      Msg.prototype.initialize.call(this)
      this.setCmd('pong')
      return this
    }

    fromMsgPing (msgping) {
      this.fromObject(msgping)
      this.setCmd('pong')
      return this
    }

    static fromMsgPing (msgping) {
      return new this().fromMsgPing(msgping)
    }

    isValid () {
      return this.dataBuf.length === 8 && this.getCmd() === 'pong'
    }
  }

  return MsgPong
}

inject = require('injecter')(inject, dependencies)
let MsgPong = inject()
MsgPong.Mainnet = inject({
  Msg: require('./msg').Mainnet
})
MsgPong.Testnet = inject({
  Msg: require('./msg').Testnet
})
module.exports = MsgPong
