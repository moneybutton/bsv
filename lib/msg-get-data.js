/**
 * MsgGetData
 * ==========
 *
 * This is identical to MsgInv, except the command is "getdata", and it is used
 * in slightly different cases. As such as simply inherit from MsgInv.
 */
'use strict'
let dependencies = {
  MsgInv: require('./msg-inv')
}

let inject = function (deps) {
  let MsgInv = deps.MsgInv

  class MsgGetData extends MsgInv {
    initialize () {
      MsgInv.prototype.initialize.call(this)
      this.setCmd('getdata')
      return this
    }

    isValid () {
      return this.getCmd() === 'getdata'
    }
  }

  return MsgGetData
}

inject = require('injecter')(inject, dependencies)
let MsgGetData = inject()
MsgGetData.MainNet = inject({
  MsgInv: require('./msg-inv').MainNet
})
MsgGetData.TestNet = inject({
  MsgInv: require('./msg-inv').TestNet
})
module.exports = MsgGetData
