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

  class GetBlocks extends Struct {
    constructor (versionnum, hashBufsVi, hashBufs, stopHashBuf) {
      super()
      this.initialize()
      this.fromObject({versionnum, hashBufsVi, hashBufs, stopHashBuf})
    }

    initialize () {
      this.versionnum = Constants.Msg.versionnum
    }

    toBw (bw) {
      if (!bw) {
        bw = new Bw()
      }
      bw.writeUInt32LE(this.versionnum)
      bw.write(this.hashBufsVi.buf)
      for (let i = 0; i < this.hashBufs.lenth; i++) {
        bw.write(this.hashBufs[i])
      }
      bw.write(this.stopHashBuf)
      return bw
    }

    fromBr (br) {
      this.versionnum = br.readUInt32LE()
      this.hashBufsVi = new VarInt(br.readVarIntBuf())
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
    fromHashes (hashBufs) {
      if (hashBufs.length < 1) {
        throw new Error('hashBufs must have at least one buffer, the stopHashBuf')
      }
      this.hashBufsVi = new VarInt().fromNumber(hashBufs.length - 1)
      this.hashBufs = hashBufs.slice(0, hashBufs.length - 1)
      this.stopHashBuf = hashBufs[hashBufs.length - 1]
      return this
    }

    static fromHashes (hashBufs) {
      return new this().fromHashes(hashBufs)
    }

    toHashes () {
      return this.hashBufs.concat(this.stopHashBuf)
    }
  }

  return GetBlocks
}

inject = require('injecter')(inject, dependencies)
let GetBlocks = inject()
module.exports = GetBlocks
