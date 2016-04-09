/**
 * MsgGetData
 * ==========
 *
 * This is identical to MsgInv, except the command is "getdata", and it is used
 * in slightly different cases. As such as simply inherit from MsgInv.
 */
'use strict'
let dependencies = {
  MsgInv: require('./msginv')
}

let inject = function (deps) {
  let MsgInv = deps.MsgInv

  function MsgGetData (magicnum, cmdbuf, datasize, checksumbuf, databuf) {
    if (!(this instanceof MsgGetData)) {
      return new MsgGetData(magicnum, cmdbuf, datasize, checksumbuf, databuf)
    }
    this.initialize()
    this.fromObject({magicnum, cmdbuf, datasize, checksumbuf, databuf})
  }

  MsgGetData.prototype = Object.create(MsgInv.prototype)
  MsgGetData.prototype.constructor = MsgGetData

  MsgGetData.prototype.initialize = function () {
    MsgInv.prototype.initialize.call(this)
    this.setCmd('getdata')
    return this
  }

  MsgGetData.prototype.isValid = function () {
    return this.getCmd() === 'getdata'
  }

  return MsgGetData
}

inject = require('injecter')(inject, dependencies)
let MsgGetData = inject()
MsgGetData.Mainnet = inject({
  MsgInv: require('./msginv').Mainnet
})
MsgGetData.Testnet = inject({
  MsgInv: require('./msginv').Testnet
})
module.exports = MsgGetData
