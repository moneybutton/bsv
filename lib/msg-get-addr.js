/**
 * MsgGetAddr
 * ==========
 *
 * Requests an addr message. This message has no data (databuf), and as such is
 * very simple.
 */
'use strict'
let dependencies = {
  Msg: require('./msg')
}

let inject = function (deps) {
  let Msg = deps.Msg

  function MsgGetAddr (magicnum, cmdbuf, datasize, checksumbuf, databuf) {
    if (!(this instanceof MsgGetAddr)) {
      return new MsgGetAddr(magicnum, cmdbuf, datasize, checksumbuf, databuf)
    }
    this.initialize()
    this.fromObject({magicnum, cmdbuf, datasize, checksumbuf, databuf})
  }

  MsgGetAddr.prototype = Object.create(Msg.prototype)
  MsgGetAddr.prototype.constructor = MsgGetAddr

  MsgGetAddr.prototype.initialize = function () {
    Msg.prototype.initialize.call(this)
    this.setCmd('getaddr')
    this.datasize = 0
    this.databuf = new Buffer(0)
    this.checksumbuf = new Buffer('5df6e0e2', 'hex')
    return this
  }

  MsgGetAddr.prototype.isValid = function () {
    return this.getCmd() === 'getaddr' && this.databuf.length === 0
  }

  return MsgGetAddr
}

inject = require('injecter')(inject, dependencies)
let MsgGetAddr = inject()
MsgGetAddr.MainNet = inject({
  Msg: require('./msg').MainNet
})
MsgGetAddr.TestNet = inject({
  Msg: require('./msg').TestNet
})
module.exports = MsgGetAddr
