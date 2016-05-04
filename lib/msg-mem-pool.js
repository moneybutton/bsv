/**
 * MsgMempool
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

  function MsgMempool (magicnum, cmdbuf, datasize, checksumbuf, databuf) {
    if (!(this instanceof MsgMempool)) {
      return new MsgMempool(magicnum, cmdbuf, datasize, checksumbuf, databuf)
    }
    this.initialize()
    this.fromObject({magicnum, cmdbuf, datasize, checksumbuf, databuf})
  }

  MsgMempool.prototype = Object.create(Msg.prototype)
  MsgMempool.prototype.constructor = MsgMempool

  MsgMempool.prototype.initialize = function () {
    Msg.prototype.initialize.call(this)
    this.setCmd('mempool')
    this.datasize = 0
    this.databuf = new Buffer(0)
    this.checksumbuf = new Buffer('5df6e0e2', 'hex')
    return this
  }

  MsgMempool.prototype.isValid = function () {
    return this.getCmd() === 'mempool' && this.databuf.length === 0
  }

  return MsgMempool
}

inject = require('injecter')(inject, dependencies)
let MsgMempool = inject()
MsgMempool.MainNet = inject({
  Msg: require('./msg').MainNet
})
MsgMempool.TestNet = inject({
  Msg: require('./msg').TestNet
})
module.exports = MsgMempool
