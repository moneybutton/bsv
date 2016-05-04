/**
 * GetBlocks
 * =========
 *
 * The data structure used inside the "getblocks" p2p message. Contains a list
 * of block header haashes to be gotten.
 */
'use strict'
let dependencies = {
  Bw: require('./bw'),
  Constants: require('./constants').Default,
  Struct: require('./struct'),
  VarInt: require('./var-int')
}

let inject = function (deps) {
  let Bw = deps.Bw
  let Constants = deps.Constants
  let Struct = deps.Struct
  let VarInt = deps.VarInt

  function GetBlocks (versionnum, hashBufsVi, hashBufs, stopHashBuf) {
    if (!(this instanceof GetBlocks)) {
      return new GetBlocks(versionnum, hashBufsVi, hashBufs, stopHashBuf)
    }
    this.initialize()
    this.fromObject({versionnum, hashBufsVi, hashBufs, stopHashBuf})
  }

  GetBlocks.prototype = Object.create(Struct.prototype)
  GetBlocks.prototype.constructor = GetBlocks

  GetBlocks.prototype.initialize = function () {
    this.versionnum = Constants.Msg.versionnum
  }

  GetBlocks.prototype.toBw = function (bw) {
    if (!bw) {
      bw = Bw()
    }
    bw.writeUInt32LE(this.versionnum)
    bw.write(this.hashBufsVi.buf)
    for (let i = 0; i < this.hashBufs.lenth; i++) {
      bw.write(this.hashBufs[i])
    }
    bw.write(this.stopHashBuf)
    return bw
  }

  GetBlocks.prototype.fromBr = function (br) {
    this.versionnum = br.readUInt32LE()
    this.hashBufsVi = VarInt(br.readVarIntBuf())
    let len = this.hashBufsVi.toNumber()
    this.hashBufs = []
    for (let i = 0; i < len; i++) {
      this.hashBufs.push(br.read(32))
    }
    this.stopHashBuf = br.read(32)
    return this
  }

  /**
   * The last hashBuf in the list is the stopHashBuf.
   */
  GetBlocks.prototype.fromHashes = function (hashBufs) {
    if (hashBufs.length < 1) {
      throw new Error('hashBufs must have at least one buffer, the stopHashBuf')
    }
    this.hashBufsVi = VarInt().fromNumber(hashBufs.length - 1)
    this.hashBufs = hashBufs.slice(0, hashBufs.length - 1)
    this.stopHashBuf = hashBufs[hashBufs.length - 1]
    return this
  }

  GetBlocks.prototype.toHashes = function () {
    return this.hashBufs.concat(this.stopHashBuf)
  }

  return GetBlocks
}

inject = require('injecter')(inject, dependencies)
let GetBlocks = inject()
module.exports = GetBlocks
