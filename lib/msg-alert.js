/**
 * MsgAlert
 * ======
 *
 * An alert sent across the network by a developer with access to a primary
 * private key. Since this message type is almost entirely unused and will be
 * removed from bitcoin soon, it is not fully implemented here.
 */
'use strict'
let dependencies = {
  Msg: require('./msg')
}

let inject = function (deps) {
  let Msg = deps.Msg

  class MsgAlert extends Msg {
    initialize () {
      Msg.prototype.initialize.call(this)
      this.setCmd('alert')
      return this
    }

    isValid () {
      return this.getCmd() === 'alert'
    }
  }

  return MsgAlert
}

inject = require('injecter')(inject, dependencies)
let MsgAlert = inject()
MsgAlert.MainNet = inject({
  Msg: require('./msg').MainNet
})
MsgAlert.TestNet = inject({
  Msg: require('./msg').TestNet
})
module.exports = MsgAlert
