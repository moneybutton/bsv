/**
 * MsgPing
 * =======
 *
 * A ping p2p message. This is defined as a msg with command "ping" and where
 * dataBuf is a randomly selected 8 byte buffer.
 */
'use strict'
let dependencies = {
  Msg: require('./msg'),
  Random: require('./random')
}

let inject = function (deps) {
  let Msg = deps.Msg
  let Random = deps.Random

  class MsgPing extends Msg {
    initialize () {
      Msg.prototype.initialize.call(this)
      this.setCmd('ping')
      return this
    }

    fromRandom () {
      this.setData(Random.getRandomBuffer(8))
      return this
    }

    static fromRandom () {
      return new this().fromRandom()
    }

    asyncFromRandom () {
      return this.asyncSetData(Random.getRandomBuffer(8))
    }

    static asyncFromRandom () {
      return new this().asyncFromRandom()
    }

    isValid () {
      return this.dataBuf.length === 8 && this.getCmd() === 'ping'
    }
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
