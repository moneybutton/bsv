/**
 * MsgPing
 * =======
 *
 * A ping p2p message. This is defined as a msg with command "ping" and where
 * databuf is a randomly selected 8 byte buffer.
 */
'use strict'
let dependencies = {
  Msg: require('./msg'),
  Random: require('./random')
}

let inject = function (deps) {
  let Msg = deps.Msg
  let Random = deps.Random

  function MsgPing (magicnum, cmdbuf, datasize, checksumbuf, databuf) {
    if (!(this instanceof MsgPing)) {
      return new MsgPing(magicnum, cmdbuf, datasize, checksumbuf, databuf)
    }
    this.initialize()
    this.fromObject({magicnum, cmdbuf, datasize, checksumbuf, databuf})
  }

  MsgPing.prototype = Object.create(Msg.prototype)
  MsgPing.prototype.constructor = MsgPing

  MsgPing.prototype.initialize = function () {
    Msg.prototype.initialize.call(this)
    this.setCmd('ping')
    return this
  }

  MsgPing.prototype.fromRandom = function () {
    this.setData(Random.getRandomBuffer(8))
    return this
  }

  MsgPing.prototype.asyncFromRandom = function () {
    return this.asyncSetData(Random.getRandomBuffer(8))
  }

  MsgPing.prototype.isValid = function () {
    return this.databuf.length === 8 && this.getCmd() === 'ping'
  }

  return MsgPing
}

inject = require('injecter')(inject, dependencies)
let MsgPing = inject()
MsgPing.MainNet = inject({
  Msg: require('./msg').MainNet
})
MsgPing.TestNet = inject({
  Msg: require('./msg').TestNet
})
module.exports = MsgPing
