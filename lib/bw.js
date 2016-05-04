/**
 * Buffer Writer
 * =============
 *
 * This is the writing complement of the Br. You can easily write
 * VarInts and other basic number types. The way to use it is: buf =
 * new Bw().write(buf1).write(buf2).toBuffer()
 */
'use strict'
let dependencies = {
}

let inject = function (deps) {
  let Bw = function Bw (obj) {
    if (!(this instanceof Bw)) {
      return new Bw(obj)
    }
    if (obj) {
      this.fromObject(obj)
    } else {
      this.bufs = []
    }
  }

  Bw.prototype.fromObject = function (obj) {
    this.bufs = obj.bufs || this.bufs || []
    return this
  }

  Bw.prototype.getLEngth = function () {
    let len = 0
    for (let i in this.bufs) {
      let buf = this.bufs[i]
      len = len + buf.length
    }
    return len
  }

  Bw.prototype.toBuffer = function () {
    return Buffer.concat(this.bufs)
  }

  Bw.prototype.write = function (buf) {
    this.bufs.push(buf)
    return this
  }

  Bw.prototype.writeReverse = function (buf) {
    let buf2 = new Buffer(buf.length)
    for (let i = 0; i < buf2.length; i++) {
      buf2[i] = buf[buf.length - 1 - i]
    }
    this.bufs.push(buf2)
    return this
  }

  Bw.prototype.writeUInt8 = function (n) {
    let buf = new Buffer(1)
    buf.writeUInt8(n, 0)
    this.write(buf)
    return this
  }

  Bw.prototype.writeInt8 = function (n) {
    let buf = new Buffer(1)
    buf.writeInt8(n, 0)
    this.write(buf)
    return this
  }

  Bw.prototype.writeUInt16BE = function (n) {
    let buf = new Buffer(2)
    buf.writeUInt16BE(n, 0)
    this.write(buf)
    return this
  }

  Bw.prototype.writeInt16BE = function (n) {
    let buf = new Buffer(2)
    buf.writeInt16BE(n, 0)
    this.write(buf)
    return this
  }

  Bw.prototype.writeUInt16LE = function (n) {
    let buf = new Buffer(2)
    buf.writeUInt16LE(n, 0)
    this.write(buf)
    return this
  }

  Bw.prototype.writeInt16LE = function (n) {
    let buf = new Buffer(2)
    buf.writeInt16LE(n, 0)
    this.write(buf)
    return this
  }

  Bw.prototype.writeUInt32BE = function (n) {
    let buf = new Buffer(4)
    buf.writeUInt32BE(n, 0)
    this.write(buf)
    return this
  }

  Bw.prototype.writeInt32BE = function (n) {
    let buf = new Buffer(4)
    buf.writeInt32BE(n, 0)
    this.write(buf)
    return this
  }

  Bw.prototype.writeUInt32LE = function (n) {
    let buf = new Buffer(4)
    buf.writeUInt32LE(n, 0)
    this.write(buf)
    return this
  }

  Bw.prototype.writeInt32LE = function (n) {
    let buf = new Buffer(4)
    buf.writeInt32LE(n, 0)
    this.write(buf)
    return this
  }

  Bw.prototype.writeUInt64BEBn = function (bn) {
    let buf = bn.toBuffer({size: 8})
    this.write(buf)
    return this
  }

  Bw.prototype.writeUInt64LEBn = function (bn) {
    let buf = bn.toBuffer({size: 8})
    this.writeReverse(buf)
    return this
  }

  Bw.prototype.writeVarIntNum = function (n) {
    let buf = Bw.varIntBufNum(n)
    this.write(buf)
    return this
  }

  Bw.prototype.writeVarIntBn = function (bn) {
    let buf = Bw.varIntBufBn(bn)
    this.write(buf)
    return this
  }

  Bw.varIntBufNum = function (n) {
    let buf
    if (n < 253) {
      buf = new Buffer(1)
      buf.writeUInt8(n, 0)
    } else if (n < 0x10000) {
      buf = new Buffer(1 + 2)
      buf.writeUInt8(253, 0)
      buf.writeUInt16LE(n, 1)
    } else if (n < 0x100000000) {
      buf = new Buffer(1 + 4)
      buf.writeUInt8(254, 0)
      buf.writeUInt32LE(n, 1)
    } else {
      buf = new Buffer(1 + 8)
      buf.writeUInt8(255, 0)
      buf.writeInt32LE(n & -1, 1)
      buf.writeUInt32LE(Math.floor(n / 0x100000000), 5)
    }
    return buf
  }

  Bw.varIntBufBn = function (bn) {
    let buf
    let n = bn.toNumber()
    if (n < 253) {
      buf = new Buffer(1)
      buf.writeUInt8(n, 0)
    } else if (n < 0x10000) {
      buf = new Buffer(1 + 2)
      buf.writeUInt8(253, 0)
      buf.writeUInt16LE(n, 1)
    } else if (n < 0x100000000) {
      buf = new Buffer(1 + 4)
      buf.writeUInt8(254, 0)
      buf.writeUInt32LE(n, 1)
    } else {
      let bw = new Bw()
      bw.writeUInt8(255)
      bw.writeUInt64LEBn(bn)
      buf = bw.toBuffer()
    }
    return buf
  }

  return Bw
}

inject = require('injecter')(inject, dependencies)
let Bw = inject()
module.exports = Bw
