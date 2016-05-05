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

  class MsgGetAddr extends Msg {
    initialize () {
      Msg.prototype.initialize.call(this)
      this.setCmd('getaddr')
      this.datasize = 0
      this.databuf = new Buffer(0)
      this.checksumbuf = new Buffer('5df6e0e2', 'hex')
      return this
    }

    isValid () {
      return this.getCmd() === 'getaddr' && this.databuf.length === 0
    }
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
