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

  function MsgPong (magicnum, cmdbuf, datasize, checksumbuf, databuf) {
    if (!(this instanceof MsgPong)) {
      return new MsgPong(magicnum, cmdbuf, datasize, checksumbuf, databuf)
    }
    this.initialize()
    this.fromObject({magicnum, cmdbuf, datasize, checksumbuf, databuf})
  }

  MsgPong.prototype = Object.create(Msg.prototype)
  MsgPong.prototype.constructor = MsgPong

  MsgPong.prototype.initialize = function () {
    Msg.prototype.initialize.call(this)
    this.setCmd('pong')
    return this
  }

  MsgPong.prototype.fromMsgPing = function (msgping) {
    this.fromObject(msgping)
    this.setCmd('pong')
    return this
  }

  MsgPong.prototype.isValid = function () {
    return this.databuf.length === 8 && this.getCmd() === 'pong'
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
