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
  MsgGetBlocks: require('./msggetblocks')
}

let inject = function (deps) {
  let MsgGetBlocks = deps.MsgGetBlocks

  function MsgGetHeaders (magicnum, cmdbuf, datasize, checksumbuf, databuf) {
    if (!(this instanceof MsgGetHeaders)) {
      return new MsgGetHeaders(magicnum, cmdbuf, datasize, checksumbuf, databuf)
    }
    this.initialize()
    this.fromObject({magicnum, cmdbuf, datasize, checksumbuf, databuf})
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
MsgGetHeaders.Mainnet = inject({
  MsgGetBlocks: require('./msggetblocks').Mainnet
})
MsgGetHeaders.Testnet = inject({
  MsgGetBlocks: require('./msggetblocks').Testnet
})
module.exports = MsgGetHeaders
