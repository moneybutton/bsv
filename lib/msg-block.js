/**
 * MsgBlock
 * ========
 *
 * Sends one block.
 */
'use strict'
let dependencies = {
  Block: require('./block'),
  Msg: require('./msg')
}

let inject = function (deps) {
  let Block = deps.Block
  let Msg = deps.Msg

  class MsgBlock extends Msg {
    initialize () {
      Msg.prototype.initialize.call(this)
      this.setCmd('block')
      return this
    }

    fromBlock (block) {
      this.setData(block.toBuffer())
      return this
    }

    static fromBlock (block) {
      return new this().fromBlock(block)
    }

    asyncFromBlock (block) {
      return this.asyncSetData(block.toBuffer())
    }

    static asyncFromBlock (block) {
      return new this().asyncFromBlock(block)
    }

    toBlock () {
      return new Block().fromBuffer(this.dataBuf)
    }

    isValid () {
      return this.getCmd() === 'block'
    }
  }

  return MsgBlock
}

inject = require('injecter')(inject, dependencies)
let MsgBlock = inject()
MsgBlock.MainNet = inject({
  Block: require('./block').MainNet,
  Msg: require('./msg').MainNet
})
MsgBlock.TestNet = inject({
  Block: require('./block').TestNet,
  Msg: require('./msg').TestNet
})
module.exports = MsgBlock
