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

  class MsgHeaders extends Msg {
    initialize () {
      Msg.prototype.initialize.call(this)
      this.setCmd('headers')
      return this
    }

    static databufFromBlockHeaders (blockHeaders) {
      let bw = new Bw()
      bw.writeVarIntNum(blockHeaders.length)
      for (let i = 0; i < blockHeaders.length; i++) {
        bw.write(blockHeaders[i].toBuffer())
      }
      return bw.toBuffer()
    }

    fromBlockHeaders (blockHeaders) {
      this.setData(MsgHeaders.databufFromBlockHeaders(blockHeaders))
      return this
    }

    static fromBlockHeaders (blockHeaders) {
      return new this().fromBlockHeaders(blockHeaders)
    }

    asyncFromBlockHeaders (blockHeaders) {
      return this.asyncSetData(MsgHeaders.databufFromBlockHeaders(blockHeaders))
    }

    toBlockHeaders () {
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

    isValid () {
      return this.getCmd() === 'headers'
    }
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
