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

  function MsgAlert (magicnum, cmdbuf, datasize, checksumbuf, databuf) {
    if (!(this instanceof MsgAlert)) {
      return new MsgAlert(magicnum, cmdbuf, datasize, checksumbuf, databuf)
    }
    this.initialize()
    this.fromObject({magicnum, cmdbuf, datasize, checksumbuf, databuf})
  }

  MsgAlert.prototype = Object.create(Msg.prototype)
  MsgAlert.prototype.constructor = MsgAlert

  MsgAlert.prototype.initialize = function () {
    Msg.prototype.initialize.call(this)
    this.setCmd('alert')
    return this
  }

  MsgAlert.prototype.isValid = function () {
    return this.getCmd() === 'alert'
  }

  return MsgAlert
}

inject = require('injecter')(inject, dependencies)
let MsgAlert = inject()
MsgAlert.Mainnet = inject({
  Msg: require('./msg').Mainnet
})
MsgAlert.Testnet = inject({
  Msg: require('./msg').Testnet
})
module.exports = MsgAlert
