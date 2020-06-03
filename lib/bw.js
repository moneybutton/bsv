/**
 * Buffer Writer
 * =============
 *
 * This is the writing complement of the Br. You can easily write
 * VarInts and other basic number types. The way to use it is: buf =
 * new Bw().write(buf1).write(buf2).toBuffer()
 */
'use strict'

class Bw {
  constructor (bufs) {
    this.fromObject({ bufs })
  }

  fromObject (obj) {
    this.bufs = obj.bufs || this.bufs || []
    return this
  }

  getLength () {
    let len = 0
    for (const i in this.bufs) {
      const buf = this.bufs[i]
      len = len + buf.length
    }
    return len
  }

  toBuffer () {
    return Buffer.concat(this.bufs)
  }

  write (buf) {
    this.bufs.push(buf)
    return this
  }

  writeReverse (buf) {
    const buf2 = Buffer.alloc(buf.length)
    for (let i = 0; i < buf2.length; i++) {
      buf2[i] = buf[buf.length - 1 - i]
    }
    this.bufs.push(buf2)
    return this
  }

  writeUInt8 (n) {
    const buf = Buffer.alloc(1)
    buf.writeUInt8(n, 0)
    this.write(buf)
    return this
  }

  writeInt8 (n) {
    const buf = Buffer.alloc(1)
    buf.writeInt8(n, 0)
    this.write(buf)
    return this
  }

  writeUInt16BE (n) {
    const buf = Buffer.alloc(2)
    buf.writeUInt16BE(n, 0)
    this.write(buf)
    return this
  }

  writeInt16BE (n) {
    const buf = Buffer.alloc(2)
    buf.writeInt16BE(n, 0)
    this.write(buf)
    return this
  }

  writeUInt16LE (n) {
    const buf = Buffer.alloc(2)
    buf.writeUInt16LE(n, 0)
    this.write(buf)
    return this
  }

  writeInt16LE (n) {
    const buf = Buffer.alloc(2)
    buf.writeInt16LE(n, 0)
    this.write(buf)
    return this
  }

  writeUInt32BE (n) {
    const buf = Buffer.alloc(4)
    buf.writeUInt32BE(n, 0)
    this.write(buf)
    return this
  }

  writeInt32BE (n) {
    const buf = Buffer.alloc(4)
    buf.writeInt32BE(n, 0)
    this.write(buf)
    return this
  }

  writeUInt32LE (n) {
    const buf = Buffer.alloc(4)
    buf.writeUInt32LE(n, 0)
    this.write(buf)
    return this
  }

  writeInt32LE (n) {
    const buf = Buffer.alloc(4)
    buf.writeInt32LE(n, 0)
    this.write(buf)
    return this
  }

  writeUInt64BEBn (bn) {
    const buf = bn.toBuffer({ size: 8 })
    this.write(buf)
    return this
  }

  writeUInt64LEBn (bn) {
    const buf = bn.toBuffer({ size: 8 })
    this.writeReverse(buf)
    return this
  }

  writeVarIntNum (n) {
    const buf = Bw.varIntBufNum(n)
    this.write(buf)
    return this
  }

  writeVarIntBn (bn) {
    const buf = Bw.varIntBufBn(bn)
    this.write(buf)
    return this
  }

  static varIntBufNum (n) {
    let buf
    if (n < 253) {
      buf = Buffer.alloc(1)
      buf.writeUInt8(n, 0)
    } else if (n < 0x10000) {
      buf = Buffer.alloc(1 + 2)
      buf.writeUInt8(253, 0)
      buf.writeUInt16LE(n, 1)
    } else if (n < 0x100000000) {
      buf = Buffer.alloc(1 + 4)
      buf.writeUInt8(254, 0)
      buf.writeUInt32LE(n, 1)
    } else {
      buf = Buffer.alloc(1 + 8)
      buf.writeUInt8(255, 0)
      buf.writeInt32LE(n & -1, 1)
      buf.writeUInt32LE(Math.floor(n / 0x100000000), 5)
    }
    return buf
  }

  static varIntBufBn (bn) {
    let buf
    const n = bn.toNumber()
    if (n < 253) {
      buf = Buffer.alloc(1)
      buf.writeUInt8(n, 0)
    } else if (n < 0x10000) {
      buf = Buffer.alloc(1 + 2)
      buf.writeUInt8(253, 0)
      buf.writeUInt16LE(n, 1)
    } else if (n < 0x100000000) {
      buf = Buffer.alloc(1 + 4)
      buf.writeUInt8(254, 0)
      buf.writeUInt32LE(n, 1)
    } else {
      const bw = new Bw()
      bw.writeUInt8(255)
      bw.writeUInt64LEBn(bn)
      buf = bw.toBuffer()
    }
    return buf
  }
}

export { Bw }
