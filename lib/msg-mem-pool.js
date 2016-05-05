/**
 * MsgMemPool
 * ==========
 *
 * Requests transactions in the mempool. This message has no data (dataBuf),
 * and as such is very simple.
 */
'use strict'
let dependencies = {
  Msg: require('./msg')
}

let inject = function (deps) {
  let Msg = deps.Msg

  class MsgMemPool extends Msg {
    initialize () {
      Msg.prototype.initialize.call(this)
      this.setCmd('mempool')
      this.datasize = 0
      this.dataBuf = new Buffer(0)
      this.checksumbuf = new Buffer('5df6e0e2', 'hex')
      return this
    }

    isValid () {
      return this.getCmd() === 'mempool' && this.dataBuf.length === 0
    }
  }

  return MsgMemPool
}

inject = require('injecter')(inject, dependencies)
let MsgMemPool = inject()
MsgMemPool.MainNet = inject({
  Msg: require('./msg').MainNet
})
MsgMemPool.TestNet = inject({
  Msg: require('./msg').TestNet
})
module.exports = MsgMemPool
