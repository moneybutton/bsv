/**
 * MsgHeaders
 * ==========
 *
 * Sends a list of block headers.
 */
'use strict'
let dependencies = {
  Blockheader: require('./blockheader'),
  BR: require('./br'),
  BW: require('./bw'),
  Msg: require('./msg')
}

let inject = function (deps) {
  let Blockheader = deps.Blockheader
  let BR = deps.BR
  let BW = deps.BW
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

  MsgHeaders.databufFromBlockheaders = function (blockheaders) {
    let bw = BW()
    bw.writeVarintNum(blockheaders.length)
    for (let i = 0; i < blockheaders.length; i++) {
      bw.write(blockheaders[i].toBuffer())
    }
    return bw.toBuffer()
  }

  MsgHeaders.prototype.fromBlockheaders = function (blockheaders) {
    this.setData(MsgHeaders.databufFromBlockheaders(blockheaders))
    return this
  }

  MsgHeaders.prototype.asyncFromBlockheaders = function (blockheaders) {
    return this.asyncSetData(MsgHeaders.databufFromBlockheaders(blockheaders))
  }

  MsgHeaders.prototype.toBlockheaders = function () {
    let br = BR(this.databuf)
    let len = br.readVarintNum()
    let blockheaders = []
    for (let i = 0; i < len; i++) {
      let blockheaderbuf = br.read(80)
      let blockheader = Blockheader().fromBuffer(blockheaderbuf)
      blockheaders.push(blockheader)
    }
    return blockheaders
  }

  MsgHeaders.prototype.isValid = function () {
    return this.getCmd() === 'headers'
  }

  return MsgHeaders
}

inject = require('injecter')(inject, dependencies)
let MsgHeaders = inject()
MsgHeaders.Mainnet = inject({
  Msg: require('./msg').Mainnet
})
MsgHeaders.Testnet = inject({
  Msg: require('./msg').Testnet
})
module.exports = MsgHeaders
