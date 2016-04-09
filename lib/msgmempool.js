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

  function MsgHeaders (magicnum, cmdbuf, datasize, checksumbuf, databuf) {
    if (!(this instanceof MsgHeaders)) {
      return new MsgHeaders(magicnum, cmdbuf, datasize, checksumbuf, databuf)
    }
    this.initialize()
    this.fromObject({magicnum, cmdbuf, datasize, checksumbuf, databuf})
  }

  MsgHeaders.prototype = Object.create(Msg.prototype)
  MsgHeaders.prototype.constructor = MsgHeaders

  MsgHeaders.prototype.initialize = function () {
    Msg.prototype.initialize.call(this)
    this.setCmd('mempool')
    this.datasize = 0
    this.databuf = new Buffer(0)
    this.checksumbuf = new Buffer('5df6e0e2', 'hex')
    return this
  }

  MsgHeaders.prototype.isValid = function () {
    return this.getCmd() === 'mempool' && this.databuf.length === 0
  }

  return MsgHeaders
}

inject = require('injecter')(inject, dependencies)
let MsgHeaders = inject()
MsgHeaders.Mainnet = inject({
  Msg: require('./msg').Mainnet
})
MsgHeaders.Testnet = inject({
  Msg: require('./msg').Testnet
})
module.exports = MsgHeaders
