/**
 * MsgMemPool
 * ==========
 *
 * Requests transactions in the mempool. This message has no data (databuf),
 * and as such is very simple.
 */
'use strict'
let dependencies = {
  Msg: require('./msg')
}

let inject = function (deps) {
  let Msg = deps.Msg

  function MsgMemPool (magicnum, cmdbuf, datasize, checksumbuf, databuf) {
    if (!(this instanceof MsgMemPool)) {
      return new MsgMemPool(magicnum, cmdbuf, datasize, checksumbuf, databuf)
    }
    this.initialize()
    this.fromObject({magicnum, cmdbuf, datasize, checksumbuf, databuf})
  }

  MsgMemPool.prototype = Object.create(Msg.prototype)
  MsgMemPool.prototype.constructor = MsgMemPool

  MsgMemPool.prototype.initialize = function () {
    Msg.prototype.initialize.call(this)
    this.setCmd('mempool')
    this.datasize = 0
    this.databuf = new Buffer(0)
    this.checksumbuf = new Buffer('5df6e0e2', 'hex')
    return this
  }

  MsgMemPool.prototype.isValid = function () {
    return this.getCmd() === 'mempool' && this.databuf.length === 0
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
