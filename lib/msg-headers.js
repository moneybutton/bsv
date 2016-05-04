/**
 * MsgHeaders
 * ==========
 *
 * Sends a list of block headers.
 */
'use strict'
let dependencies = {
  BlockHeader: require('./block-header'),
  Br: require('./br'),
  Bw: require('./bw'),
  Msg: require('./msg')
}

let inject = function (deps) {
  let BlockHeader = deps.BlockHeader
  let Br = deps.Br
  let Bw = deps.Bw
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
    this.setCmd('headers')
    return this
  }

  MsgHeaders.databufFromBlockHeaders = function (blockHeaders) {
    let bw = new Bw()
    bw.writeVarIntNum(blockHeaders.length)
    for (let i = 0; i < blockHeaders.length; i++) {
      bw.write(blockHeaders[i].toBuffer())
    }
    return bw.toBuffer()
  }

  MsgHeaders.prototype.fromBlockHeaders = function (blockHeaders) {
    this.setData(MsgHeaders.databufFromBlockHeaders(blockHeaders))
    return this
  }

  MsgHeaders.prototype.asyncFromBlockHeaders = function (blockHeaders) {
    return this.asyncSetData(MsgHeaders.databufFromBlockHeaders(blockHeaders))
  }

  MsgHeaders.prototype.toBlockHeaders = function () {
    let br = new Br(this.databuf)
    let len = br.readVarIntNum()
    let blockHeaders = []
    for (let i = 0; i < len; i++) {
      let blockHeaderbuf = br.read(80)
      let blockHeader = new BlockHeader().fromBuffer(blockHeaderbuf)
      blockHeaders.push(blockHeader)
    }
    return blockHeaders
  }

  MsgHeaders.prototype.isValid = function () {
    return this.getCmd() === 'headers'
  }

  return MsgHeaders
}

inject = require('injecter')(inject, dependencies)
let MsgHeaders = inject()
MsgHeaders.MainNet = inject({
  Msg: require('./msg').MainNet
})
MsgHeaders.TestNet = inject({
  Msg: require('./msg').TestNet
})
module.exports = MsgHeaders
