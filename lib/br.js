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

import { Bn } from './bn'

class Br {
  constructor (buf) {
    this.fromObject({ buf })
  }

  fromObject (obj) {
    this.buf = obj.buf || this.buf || undefined
    this.pos = obj.pos || this.pos || 0
    return this
  }

  eof () {
    return this.pos >= this.buf.length
  }

  read (len = this.buf.length) {
    const buf = this.buf.slice(this.pos, this.pos + len)
    this.pos = this.pos + len
    return buf
  }

  readReverse (len = this.buf.length) {
    const buf = this.buf.slice(this.pos, this.pos + len)
    this.pos = this.pos + len
    const buf2 = Buffer.alloc(buf.length)
    for (let i = 0; i < buf2.length; i++) {
      buf2[i] = buf[buf.length - 1 - i]
    }
    return buf2
  }

  readUInt8 () {
    const val = this.buf.readUInt8(this.pos)
    this.pos = this.pos + 1
    return val
  }

  readInt8 () {
    const val = this.buf.readInt8(this.pos)
    this.pos = this.pos + 1
    return val
  }

  readUInt16BE () {
    const val = this.buf.readUInt16BE(this.pos)
    this.pos = this.pos + 2
    return val
  }

  readInt16BE () {
    const val = this.buf.readInt16BE(this.pos)
    this.pos = this.pos + 2
    return val
  }

  readUInt16LE () {
    const val = this.buf.readUInt16LE(this.pos)
    this.pos = this.pos + 2
    return val
  }

  readInt16LE () {
    const val = this.buf.readInt16LE(this.pos)
    this.pos = this.pos + 2
    return val
  }

  readUInt32BE () {
    const val = this.buf.readUInt32BE(this.pos)
    this.pos = this.pos + 4
    return val
  }

  readInt32BE () {
    const val = this.buf.readInt32BE(this.pos)
    this.pos = this.pos + 4
    return val
  }

  readUInt32LE () {
    const val = this.buf.readUInt32LE(this.pos)
    this.pos = this.pos + 4
    return val
  }

  readInt32LE () {
    const val = this.buf.readInt32LE(this.pos)
    this.pos = this.pos + 4
    return val
  }

  readUInt64BEBn () {
    const buf = this.buf.slice(this.pos, this.pos + 8)
    const bn = new Bn().fromBuffer(buf)
    this.pos = this.pos + 8
    return bn
  }

  readUInt64LEBn () {
    const buf = this.readReverse(8)
    const bn = new Bn().fromBuffer(buf)
    return bn
  }

  readVarIntNum () {
    const first = this.readUInt8()
    let bn, n
    switch (first) {
      case 0xfd:
        return this.readUInt16LE()
      case 0xfe:
        return this.readUInt32LE()
      case 0xff:
        bn = this.readUInt64LEBn()
        n = bn.toNumber()
        if (n <= Math.pow(2, 53)) {
          return n
        } else {
          throw new Error(
            'number too large to retain precision - use readVarIntBn'
          )
        }
      default:
        return first
    }
  }

  readVarIntBuf () {
    const first = this.buf.readUInt8(this.pos)
    switch (first) {
      case 0xfd:
        return this.read(1 + 2)
      case 0xfe:
        return this.read(1 + 4)
      case 0xff:
        return this.read(1 + 8)
      default:
        return this.read(1)
    }
  }

  readVarIntBn () {
    const first = this.readUInt8()
    switch (first) {
      case 0xfd:
        return new Bn(this.readUInt16LE())
      case 0xfe:
        return new Bn(this.readUInt32LE())
      case 0xff:
        return this.readUInt64LEBn()
      default:
        return new Bn(first)
    }
  }
}

export { Br }
