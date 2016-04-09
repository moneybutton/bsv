/**
 * GetBlocks
 * =========
 *
 * The data structure used inside the "getblocks" p2p message. Contains a list
 * of block header haashes to be gotten.
 */
'use strict'
let dependencies = {
  BW: require('./bw'),
  Constants: require('./constants').Default,
  Struct: require('./struct'),
  Varint: require('./varint')
}

let inject = function (deps) {
  let BW = deps.BW
  let Constants = deps.Constants
  let Struct = deps.Struct
  let Varint = deps.Varint

  function GetBlocks (versionnum, hashbufsvi, hashbufs, stophashbuf) {
    if (!(this instanceof GetBlocks)) {
      return new GetBlocks(versionnum, hashbufsvi, hashbufs, stophashbuf)
    }
    this.initialize()
    this.fromObject({versionnum, hashbufsvi, hashbufs, stophashbuf})
  }

  GetBlocks.prototype = Object.create(Struct.prototype)
  GetBlocks.prototype.constructor = GetBlocks

  GetBlocks.prototype.initialize = function () {
    this.versionnum = Constants.Msg.versionnum
  }

  GetBlocks.prototype.toBW = function (bw) {
    if (!bw) {
      bw = BW()
    }
    bw.writeUInt32BE(this.versionnum)
    bw.write(this.hashbufsvi.buf)
    for (let i = 0; i < this.hashbufs.lenth; i++) {
      bw.write(this.hashbufs[i])
    }
    bw.write(this.stophashbuf)
    return bw
  }

  GetBlocks.prototype.fromBR = function (br) {
    this.versionnum = br.readUInt32BE()
    this.hashbufsvi = Varint(br.readVarintBuf())
    let len = this.hashbufsvi.toNumber()
    this.hashbufs = []
    for (let i = 0; i < len; i++) {
      this.hashbufs.push(br.read(32))
    }
    this.stophashbuf = br.read(32)
    return this
  }

  /**
   * The last hashbuf in the list is the stophashbuf.
   */
  GetBlocks.prototype.fromHashes = function (hashbufs) {
    if (hashbufs.length < 1) {
      throw new Error('hashbufs must have at least one buffer, the stophashbuf')
    }
    this.hashbufsvi = Varint().fromNumber(hashbufs.length - 1)
    this.hashbufs = hashbufs.slice(0, hashbufs.length - 1)
    this.stophashbuf = hashbufs[hashbufs.length - 1]
    return this
  }

  GetBlocks.prototype.toHashes = function () {
    return this.hashbufs.concat(this.stophashbuf)
  }

  return GetBlocks
}

inject = require('injecter')(inject, dependencies)
let GetBlocks = inject()
module.exports = GetBlocks
