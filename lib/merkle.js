/**
 * Merkle Node
 * ===========
 *
 * A node in a Merkle tree (possibly the root node, in which case it is the
 * Merkle root). A node either contains a buffer or links to two other nodes.
 */
'use strict'

let dependencies = {
  Hash: require('./hash'),
  Struct: require('./struct')
}

let inject = function (deps) {
  let Hash = deps.Hash
  let Struct = deps.Struct

  function Merkle (hashbuf, buf, merkle1, merkle2) {
    if (!(this instanceof Merkle)) {
      return new Merkle(hashbuf, buf, merkle1, merkle2)
    }
    this.fromObject({hashbuf, buf, merkle1, merkle2})
  }

  Merkle.prototype = Object.create(Struct.prototype)
  Merkle.prototype.constructor = Merkle

  Merkle.prototype.hash = function () {
    if (this.hashbuf) {
      return this.hashbuf
    }
    if (this.buf) {
      return Hash.sha256sha256(this.buf)
    }
    let hashbuf1 = this.merkle1.hash()
    let hashbuf2 = this.merkle2.hash()
    this.buf = Buffer.concat([hashbuf1, hashbuf2])
    return Hash.sha256sha256(this.buf)
  }

  Merkle.prototype.fromBuffers = function (bufs) {
    if (bufs.length < 1) {
      throw new Error('buffers must have a length')
    }
    bufs = bufs.slice()
    let log = Math.log2(bufs.length)
    if (!Number.isInteger(log)) {
      // If a merkle tree does not have a number of ends that is a power of 2,
      // then we have to copy the last value until it is a power of 2. Note
      // that we copy *the actual object* over and over again, which ensures
      // that when we finds its hash, the hash is cached.
      let lastval = bufs[bufs.length - 1]
      var len = Math.pow(2, Math.ceil(log))
      for (let i = bufs.length; i < len; i++) {
        bufs.push(lastval)
      }
    }
    let bufs1 = bufs.slice(0, bufs.length / 2)
    let bufs2 = bufs.slice(bufs.length / 2)
    this.fromBufferArrays(bufs1, bufs2)
    return this
  }

  /**
   * Takes two arrays, both of which *must* be of a length that is a power of
   * two.
   */
  Merkle.prototype.fromBufferArrays = function (bufs1, bufs2) {
    if (bufs1.length === 1) {
      this.merkle1 = Merkle(undefined, bufs1[0])
      this.merkle2 = Merkle(undefined, bufs2[0])
      return this
    }
    let bufs11 = bufs1.slice(0, bufs1.length / 2)
    let bufs12 = bufs1.slice(bufs1.length / 2)
    this.merkle1 = Merkle().fromBufferArrays(bufs11, bufs12)
    let bufs21 = bufs2.slice(0, bufs2.length / 2)
    let bufs22 = bufs2.slice(bufs2.length / 2)
    this.merkle2 = Merkle().fromBufferArrays(bufs21, bufs22)
    return this
  }

  Merkle.prototype.leavesNum = function () {
    if (this.merkle1) {
      return this.merkle1.leavesNum() + this.merkle2.leavesNum()
    }
    if (this.buf) {
      return 1
    }
    throw new Error('invalid number of leaves')
  }

  return Merkle
}

inject = require('./injector')(inject, dependencies)
let Merkle = inject()
module.exports = Merkle
