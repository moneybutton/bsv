/**
 * MsgPong
 * =======
 *
 * A pong message on the p2p network is a reponse to a ping. A pong is almost
 * the same as a ping, in that it contains a randomly selected 8 byte databuf.
 * The databuf is always the same as the ping it is responding to. And also,
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
      return this.databuf.length === 8 && this.getCmd() === 'pong'
    }
  }

  return MsgPong
}

inject = require('injecter')(inject, dependencies)
let MsgPong = inject()
MsgPong.MainNet = inject({
  Msg: require('./msg').MainNet
})
MsgPong.TestNet = inject({
  Msg: require('./msg').TestNet
})
module.exports = MsgPong
