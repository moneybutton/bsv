/**
 * MsgGetBlocks
 * ============
 *
 * Gets what blocks are available from a given peer.
 */
'use strict'
let dependencies = {
  GetBlocks: require('./getblocks'),
  Msg: require('./msg'),
  asink: require('asink')
}

let inject = function (deps) {
  let GetBlocks = deps.GetBlocks
  let Msg = deps.Msg
  let asink = deps.asink

  function MsgGetBlocks (magicnum, cmdbuf, datasize, checksumbuf, databuf) {
    if (!(this instanceof MsgGetBlocks)) {
      return new MsgGetBlocks(magicnum, cmdbuf, datasize, checksumbuf, databuf)
    }
    this.initialize()
    this.fromObject({magicnum, cmdbuf, datasize, checksumbuf, databuf})
  }

  MsgGetBlocks.prototype = Object.create(Msg.prototype)
  MsgGetBlocks.prototype.constructor = MsgGetBlocks

  MsgGetBlocks.prototype.initialize = function () {
    Msg.prototype.initialize.call(this)
    this.setCmd('getblocks')
    return this
  }

  MsgGetBlocks.prototype.fromGetBlocks = function (getblocks) {
    return this.setData(getblocks.toBuffer())
  }

  MsgGetBlocks.prototype.fromHashes = function (hashes) {
    let getblocks = GetBlocks().fromHashes(hashes)
    return this.fromGetBlocks(getblocks)
  }

  MsgGetBlocks.prototype.asyncFromGetBlocks = function (getblocks) {
    return this.asyncSetData(getblocks.toBuffer())
  }

  MsgGetBlocks.prototype.asyncFromHashes = function (hashes) {
    return asink(function * () {
      let getblocks = GetBlocks().fromHashes(hashes)
      return this.asyncFromGetBlocks(getblocks)
    }, this)
  }

  MsgGetBlocks.prototype.toGetBlocks = function () {
    return GetBlocks().fromBuffer(this.databuf)
  }

  MsgGetBlocks.prototype.toHashes = function () {
    return GetBlocks().fromBuffer(this.databuf).toHashes()
  }

  MsgGetBlocks.prototype.isValid = function () {
    return this.getCmd() === 'getblocks'
  }

  return MsgGetBlocks
}

inject = require('injecter')(inject, dependencies)
let MsgGetBlocks = inject()
MsgGetBlocks.Mainnet = inject({
  Block: require('./block').Mainnet,
  Msg: require('./msg').Mainnet
})
MsgGetBlocks.Testnet = inject({
  Block: require('./block').Testnet,
  Msg: require('./msg').Testnet
})
module.exports = MsgGetBlocks
