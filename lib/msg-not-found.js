/**
 * MsgNotFound
 * ===========
 *
 * Sent when requested data is not found. This is identical to MsgInv, except
 * the command is "notfound", and it is used in slightly different cases. As
 * such it simply inherits from MsgInv.
 */
'use strict'
let dependencies = {
  MsgInv: require('./msg-inv')
}

let inject = function (deps) {
  let MsgInv = deps.MsgInv

  function MsgNotFound (magicnum, cmdbuf, datasize, checksumbuf, databuf) {
    if (!(this instanceof MsgNotFound)) {
      return new MsgNotFound(magicnum, cmdbuf, datasize, checksumbuf, databuf)
    }
    this.initialize()
    this.fromObject({magicnum, cmdbuf, datasize, checksumbuf, databuf})
  }

  MsgNotFound.prototype = Object.create(MsgInv.prototype)
  MsgNotFound.prototype.constructor = MsgNotFound

  MsgNotFound.prototype.initialize = function () {
    MsgInv.prototype.initialize.call(this)
    this.setCmd('notfound')
    return this
  }

  MsgNotFound.prototype.isValid = function () {
    return this.getCmd() === 'notfound'
  }

  return MsgNotFound
}

inject = require('injecter')(inject, dependencies)
let MsgNotFound = inject()
MsgNotFound.MainNet = inject({
  MsgInv: require('./msg-inv').MainNet
})
MsgNotFound.TestNet = inject({
  MsgInv: require('./msg-inv').TestNet
})
module.exports = MsgNotFound
