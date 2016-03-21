/**
 * MsgPing
 * =======
 */
'use strict'
let dependencies = {
  Msg: require('./msg'),
  Random: require('./random'),
  asink: require('asink')
}

let inject = function (deps) {
  let Msg = deps.Msg
  let Random = deps.Random
  let asink = deps.asink

  function MsgPing (magicnum, cmdbuf, datasize, checksumbuf, databuf) {
    if (!(this instanceof MsgPing)) {
      return new MsgPing(magicnum, cmdbuf, datasize, checksumbuf, databuf)
    }
    this.initialize()
    this.fromObject({magicnum, cmdbuf, datasize, checksumbuf, databuf})
  }

  MsgPing.prototype = Object.create(Msg.prototype)
  MsgPing.prototype.constructor = MsgPing

  MsgPing.prototype.fromRandom = function () {
    this.setCmd('ping')
    this.setData(Random.getRandomBuffer(8))
    return this
  }

  MsgPing.prototype.asyncFromRandom = function () {
    return asink(function *() {
      this.setCmd('ping')
      yield this.asyncSetData(Random.getRandomBuffer(8))
      return this
    }, this)
  }

  MsgPing.prototype.isValid = function () {
    return this.databuf.length === 8 && this.getCmd() === 'ping'
  }

  return MsgPing
}

inject = require('./injector')(inject, dependencies)
let MsgPing = inject()
MsgPing.Mainnet = inject({
  Msg: require('./msg').Mainnet
})
MsgPing.Testnet = inject({
  Msg: require('./msg').Testnet
})
module.exports = MsgPing
