/**
 * Buffer Reader
 * =============
 *
 * This is a convenience class for reading VarInts and other basic types from a
 * buffer. This class is most useful for reading VarInts, and also for signed
 * or unsigned integers of various types. It can also read a buffer in reverse
 * order, which is useful in bitcoin which uses little endian numbers a lot so
 * you find that you must reverse things. You probably want to use it like:
 * varInt = new Br(buf).readnew VarInt()
 */
'use strict'
let dependencies = {
  Bn: require('./bn')
}

let inject = function (deps) {
  let Bn = deps.Bn

  function Br (buf) {
    if (!(this instanceof Br)) {
      return new Br(buf)
    }
    if (Buffer.isBuffer(buf)) {
      this.fromObject({buf})
    } else if (buf) {
      let obj = buf
      this.fromObject(obj)
    }
  }

  Br.prototype.fromObject = function (obj) {
    this.buf = obj.buf || this.buf || undefined
    this.pos = obj.pos || this.pos || 0
    return this
  }

  Br.prototype.eof = function () {
    return this.pos >= this.buf.length
  }

  Br.prototype.read = function (len) {
    if (len === undefined) {
      len = this.buf.length
    }
    let buf = this.buf.slice(this.pos, this.pos + len)
    this.pos = this.pos + len
    return buf
  }

  Br.prototype.readReverse = function (len) {
    if (len === undefined) {
      len = this.buf.length
    }
    let buf = this.buf.slice(this.pos, this.pos + len)
    this.pos = this.pos + len
    let buf2 = new Buffer(buf.length)
    for (let i = 0; i < buf2.length; i++) {
      buf2[i] = buf[buf.length - 1 - i]
    }
    return buf2
  }

  Br.prototype.readUInt8 = function () {
    let val = this.buf.readUInt8(this.pos)
    this.pos = this.pos + 1
    return val
  }

  Br.prototype.readInt8 = function () {
    let val = this.buf.readInt8(this.pos)
    this.pos = this.pos + 1
    return val
  }

  Br.prototype.readUInt16BE = function () {
    let val = this.buf.readUInt16BE(this.pos)
    this.pos = this.pos + 2
    return val
  }

  Br.prototype.readInt16BE = function () {
    let val = this.buf.readInt16BE(this.pos)
    this.pos = this.pos + 2
    return val
  }

  Br.prototype.readUInt16LE = function () {
    let val = this.buf.readUInt16LE(this.pos)
    this.pos = this.pos + 2
    return val
  }

  Br.prototype.readInt16LE = function () {
    let val = this.buf.readInt16LE(this.pos)
    this.pos = this.pos + 2
    return val
  }

  Br.prototype.readUInt32BE = function () {
    let val = this.buf.readUInt32BE(this.pos)
    this.pos = this.pos + 4
    return val
  }

  Br.prototype.readInt32BE = function () {
    let val = this.buf.readInt32BE(this.pos)
    this.pos = this.pos + 4
    return val
  }

  Br.prototype.readUInt32LE = function () {
    let val = this.buf.readUInt32LE(this.pos)
    this.pos = this.pos + 4
    return val
  }

  Br.prototype.readInt32LE = function () {
    let val = this.buf.readInt32LE(this.pos)
    this.pos = this.pos + 4
    return val
  }

  Br.prototype.readUInt64BEBn = function () {
    let buf = this.buf.slice(this.pos, this.pos + 8)
    let bn = new Bn().fromBuffer(buf)
    this.pos = this.pos + 8
    return bn
  }

  Br.prototype.readUInt64LEBn = function () {
    let buf = this.readReverse(8)
    let bn = new Bn().fromBuffer(buf)
    return bn
  }

  Br.prototype.readVarIntNum = function () {
    let first = this.readUInt8()
    let bn, n
    switch (first) {
      case 0xFD:
        return this.readUInt16LE()
      case 0xFE:
        return this.readUInt32LE()
      case 0xFF:
        bn = this.readUInt64LEBn()
        n = bn.toNumber()
        if (n <= Math.pow(2, 53)) {
          return n
        } else {
          throw new Error('number too large to retain precision - use readVarIntBn')
        }
      default:
        return first
    }
  }

  Br.prototype.readVarIntBuf = function () {
    let first = this.buf.readUInt8(this.pos)
    switch (first) {
      case 0xFD:
        return this.read(1 + 2)
      case 0xFE:
        return this.read(1 + 4)
      case 0xFF:
        return this.read(1 + 8)
      default:
        return this.read(1)
    }
  }

  Br.prototype.readVarIntBn = function () {
    let first = this.readUInt8()
    switch (first) {
      case 0xFD:
        return new Bn(this.readUInt16LE())
      case 0xFE:
        return new Bn(this.readUInt32LE())
      case 0xFF:
        return this.readUInt64LEBn()
      default:
        return new Bn(first)
    }
  }

  return Br
}

inject = require('injecter')(inject, dependencies)
let Br = inject()
module.exports = Br
