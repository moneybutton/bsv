/**
 * MsgGetHeaders
 * =============
 *
 * This is identical to MsgGetBlocks, except the command is "getheaders", and
 * it is used in slightly different cases. As such as simply inherit from
 * MsgGetBlocks.
 */
'use strict'
let dependencies = {
  MsgGetBlocks: require('./msg-get-blocks')
}

let inject = function (deps) {
  let MsgGetBlocks = deps.MsgGetBlocks

  function MsgGetHeaders (magicNum, cmdbuf, datasize, checksumbuf, dataBuf) {
    if (!(this instanceof MsgGetHeaders)) {
      return new MsgGetHeaders(magicNum, cmdbuf, datasize, checksumbuf, dataBuf)
    }
    this.initialize()
    this.fromObject({magicNum, cmdbuf, datasize, checksumbuf, dataBuf})
  }

  MsgGetHeaders.prototype = Object.create(MsgGetBlocks.prototype)
  MsgGetHeaders.prototype.constructor = MsgGetHeaders

  MsgGetHeaders.prototype.initialize = function () {
    MsgGetBlocks.prototype.initialize.call(this)
    this.setCmd('getheaders')
    return this
  }

  MsgGetHeaders.prototype.isValid = function () {
    return this.getCmd() === 'getheaders'
  }

  return MsgGetHeaders
}

inject = require('injecter')(inject, dependencies)
let MsgGetHeaders = inject()
MsgGetHeaders.MainNet = inject({
  MsgGetBlocks: require('./msg-get-blocks').MainNet
})
MsgGetHeaders.TestNet = inject({
  MsgGetBlocks: require('./msg-get-blocks').TestNet
})
module.exports = MsgGetHeaders
