/**
 * Big Number
 * ==========
 *
 * Since javascript numbers are only precise up to 53 bits, and bitcoin is
 * based on cryptography that uses 256 bit numbers, we must use a big number
 * library. The library we use at the moment is Fedor Indutny's bn.js library.
 * Since big numbers are extremely useful, we provide some very basic wrappers
 * for his big number class and expose it. The wrappers merely allow you to do,
 * say, bn.cmp(num) instead of just bn.cmp(bn), which is nice. The primary way
 * to use this is:
 * const bn = Bn(str) // str is base 10
 * const bn = Bn(num)
 * const bn = Bn().fromBuffer(buf)
 * const bn = Bn().fromSm(buf); // sign+magnitude format, first bit is sign
 *
 * For little endian, pass in an options value:
 * const bn = Bn().fromBuffer(buf, {endian: 'little'})
 * const bn = Bn().fromSm(buf, {endian: 'little'})
 *
 * Getting output:
 * const str = Bn().toString() // produces base 10 string
 * const buf = Bn().toBuffer() // produces buffer representation
 * const buf = Bn().toBuffer({size: 32}) //produced 32 byte buffer
 */
'use strict'

import _Bn from 'bn.js'

function Bn (n, base, ...rest) {
  if (!(this instanceof Bn)) {
    return new Bn(n, base, ...rest)
  }
  _Bn.call(this, n, base, ...rest)
}

Object.keys(_Bn).forEach(function (key) {
  Bn[key] = _Bn[key]
})
Bn.prototype = Object.create(_Bn.prototype)
Bn.prototype.constructor = Bn

function reverseBuf (buf) {
  const buf2 = Buffer.alloc(buf.length)
  for (let i = 0; i < buf.length; i++) {
    buf2[i] = buf[buf.length - 1 - i]
  }
  return buf2
}

Bn.prototype.fromHex = function (hex, opts) {
  return this.fromBuffer(Buffer.from(hex, 'hex'), opts)
}

Bn.prototype.toHex = function (opts) {
  return this.toBuffer(opts).toString('hex')
}

Bn.prototype.toJSON = function () {
  return this.toString()
}

Bn.prototype.fromJSON = function (str) {
  const bn = Bn(str)
  bn.copy(this)
  return this
}

Bn.prototype.fromNumber = function (n) {
  const bn = Bn(n)
  bn.copy(this)
  return this
}

Bn.prototype.toNumber = function () {
  return parseInt(this.toString(10), 10)
}

Bn.prototype.fromString = function (str, base) {
  const bn = Bn(str, base)
  bn.copy(this)
  return this
}

Bn.fromBuffer = function (buf, opts = { endian: 'big' }) {
  if (opts.endian === 'little') {
    buf = reverseBuf(buf)
  }
  const hex = buf.toString('hex')
  const bn = new Bn(hex, 16)
  return bn
}

Bn.prototype.fromBuffer = function (buf, opts) {
  const bn = Bn.fromBuffer(buf, opts)
  bn.copy(this)

  return this
}

Bn.prototype.toBuffer = function (opts = { size: undefined, endian: 'big' }) {
  let buf
  if (opts.size) {
    const hex = this.toString(16, 2)
    const natlen = hex.length / 2
    buf = Buffer.from(hex, 'hex')

    if (natlen === opts.size) {
      // pass
    } else if (natlen > opts.size) {
      buf = buf.slice(natlen - buf.length, buf.length)
    } else if (natlen < opts.size) {
      const rbuf = Buffer.alloc(opts.size)
      for (let i = 0; i < buf.length; i++) {
        rbuf[rbuf.length - 1 - i] = buf[buf.length - 1 - i]
      }
      for (let i = 0; i < opts.size - natlen; i++) {
        rbuf[i] = 0
      }
      buf = rbuf
    }
  } else {
    const hex = this.toString(16, 2)
    buf = Buffer.from(hex, 'hex')
  }

  if (opts.endian === 'little') {
    buf = reverseBuf(buf)
  }
  const longzero = Buffer.from([0])
  if (Buffer.compare(buf, longzero) === 0) {
    return Buffer.from([])
  }
  return buf
}

Bn.prototype.toFastBuffer = Bn.prototype.toBuffer

Bn.fromFastBuffer = Bn.fromBuffer
Bn.prototype.fromFastBuffer = Bn.prototype.fromBuffer

/**
   * Signed magnitude buffer. Most significant bit represents sign (0 = positive,
   * 1 = negative).
   */
Bn.prototype.fromSm = function (buf, opts = { endian: 'big' }) {
  if (buf.length === 0) {
    this.fromBuffer(Buffer.from([0]))
  }

  const endian = opts.endian
  if (endian === 'little') {
    buf = reverseBuf(buf)
  }

  if (buf[0] & 0x80) {
    buf[0] = buf[0] & 0x7f
    this.fromBuffer(buf)
    this.neg().copy(this)
  } else {
    this.fromBuffer(buf)
  }
  return this
}

Bn.prototype.toSm = function (opts = { endian: 'big' }) {
  const endian = opts.endian

  let buf
  if (this.cmp(0) === -1) {
    buf = this.neg().toBuffer()
    if (buf[0] & 0x80) {
      buf = Buffer.concat([Buffer.from([0x80]), buf])
    } else {
      buf[0] = buf[0] | 0x80
    }
  } else {
    buf = this.toBuffer()
    if (buf[0] & 0x80) {
      buf = Buffer.concat([Buffer.from([0x00]), buf])
    }
  }

  if ((buf.length === 1) & (buf[0] === 0)) {
    buf = Buffer.from([])
  }

  if (endian === 'little') {
    buf = reverseBuf(buf)
  }

  return buf
}

/**
   * Produce a Bn from the "bits" value in a blockheader. Analagous to Bitcoin
   * Core's uint256 SetCompact method. bits is assumed to be UInt32.
   */
Bn.prototype.fromBits = function (bits, opts = { strict: false }) {
  // To performed bitwise operations in javascript, we need to convert to a
  // signed 32 bit value.
  let buf = Buffer.alloc(4)
  buf.writeUInt32BE(bits, 0)
  bits = buf.readInt32BE(0)
  if (opts.strict && bits & 0x00800000) {
    throw new Error('negative bit set')
  }
  const nsize = bits >> 24
  const nword = bits & 0x007fffff
  buf = Buffer.alloc(4)
  buf.writeInt32BE(nword)
  if (nsize <= 3) {
    buf = buf.slice(1, nsize + 1)
  } else {
    const fill = Buffer.alloc(nsize - 3)
    fill.fill(0)
    buf = Buffer.concat([buf, fill])
  }
  this.fromBuffer(buf)
  if (bits & 0x00800000) {
    Bn(0)
      .sub(this)
      .copy(this)
  }
  return this
}

/**
   * Convert Bn to the "bits" value in a blockheader. Analagous to Bitcoin
   * Core's uint256 GetCompact method. bits is a UInt32.
   */
Bn.prototype.toBits = function () {
  let buf
  if (this.lt(0)) {
    buf = this.neg().toBuffer()
  } else {
    buf = this.toBuffer()
  }
  let nsize = buf.length
  let nword
  if (nsize > 3) {
    nword = Buffer.concat([Buffer.from([0]), buf.slice(0, 3)]).readUInt32BE(0)
  } else if (nsize <= 3) {
    const blank = Buffer.alloc(3 - nsize + 1)
    blank.fill(0)
    nword = Buffer.concat([blank, buf.slice(0, nsize)]).readUInt32BE(0)
  }
  if (nword & 0x00800000) {
    // The most significant bit denotes sign. Do not want unless number is
    // actually negative.
    nword >>= 8
    nsize++
  }
  if (this.lt(0)) {
    nword |= 0x00800000
  }
  const bits = (nsize << 24) | nword
  // convert bits to UInt32 before returning
  buf = Buffer.alloc(4)
  buf.writeInt32BE(bits, 0)
  return buf.readUInt32BE(0)
}

// This is analogous to the constructor for CScriptNum in bitcoind. Many ops
// in bitcoind's script interpreter use CScriptNum, which is not really a
// proper bignum. Instead, an error is thrown if trying to input a number
// bigger than 4 bytes. We copy that behavior here. There is one exception -
// in CHECKLOCKTIMEVERIFY, the numbers are allowed to be up to 5 bytes long.
// We allow for setting that variable here for use in CHECKLOCKTIMEVERIFY.
Bn.prototype.fromScriptNumBuffer = function (
  buf,
  fRequireMinimal,
  nMaxNumSize
) {
  if (nMaxNumSize === undefined) {
    nMaxNumSize = 4
  }
  if (buf.length > nMaxNumSize) {
    throw new Error('script number overflow')
  }
  if (fRequireMinimal && buf.length > 0) {
    // Check that the number is encoded with the minimum possible
    // number of bytes.
    //
    // If the most-significant-byte - excluding the sign bit - is zero
    // then we're not minimal. Note how this test also rejects the
    // negative-zero encoding, 0x80.
    if ((buf[buf.length - 1] & 0x7f) === 0) {
      // One exception: if there's more than one byte and the most
      // significant bit of the second-most-significant-byte is set
      // it would conflict with the sign bit. An example of this case
      // is +-255, which encode to 0xff00 and 0xff80 respectively.
      // (big-endian).
      if (buf.length <= 1 || (buf[buf.length - 2] & 0x80) === 0) {
        throw new Error('non-minimally encoded script number')
      }
    }
  }
  return this.fromSm(buf, { endian: 'little' })
}

// The corollary to the above, with the notable exception that we do not throw
// an error if the output is larger than four bytes. (Which can happen if
// performing a numerical operation that results in an overflow to more than 4
// bytes).
Bn.prototype.toScriptNumBuffer = function (buf) {
  return this.toSm({ endian: 'little' })
}

Bn.prototype.neg = function () {
  const _neg = _Bn.prototype.neg.call(this)
  const neg = Object.create(Bn.prototype)
  _neg.copy(neg)
  return neg
}

Bn.prototype.add = function (bn) {
  const _bn = _Bn.prototype.add.call(this, bn)
  bn = Object.create(Bn.prototype)
  _bn.copy(bn)
  return bn
}

Bn.prototype.sub = function (bn) {
  const _bn = _Bn.prototype.sub.call(this, bn)
  bn = Object.create(Bn.prototype)
  _bn.copy(bn)
  return bn
}

Bn.prototype.mul = function (bn) {
  const _bn = _Bn.prototype.mul.call(this, bn)
  bn = Object.create(Bn.prototype)
  _bn.copy(bn)
  return bn
}

/**
   * to be used if this is positive.
   */
Bn.prototype.mod = function (bn) {
  const _bn = _Bn.prototype.mod.call(this, bn)
  bn = Object.create(Bn.prototype)
  _bn.copy(bn)
  return bn
}

/**
   * to be used if this is negative.
   */
Bn.prototype.umod = function (bn) {
  const _bn = _Bn.prototype.umod.call(this, bn)
  bn = Object.create(Bn.prototype)
  _bn.copy(bn)
  return bn
}

Bn.prototype.invm = function (bn) {
  const _bn = _Bn.prototype.invm.call(this, bn)
  bn = Object.create(Bn.prototype)
  _bn.copy(bn)
  return bn
}

Bn.prototype.div = function (bn) {
  const _bn = _Bn.prototype.div.call(this, bn)
  bn = Object.create(Bn.prototype)
  _bn.copy(bn)
  return bn
}

Bn.prototype.ushln = function (bits) {
  const _bn = _Bn.prototype.ushln.call(this, bits)
  const bn = Object.create(Bn.prototype)
  _bn.copy(bn)
  return bn
}

Bn.prototype.ushrn = function (bits) {
  const _bn = _Bn.prototype.ushrn.call(this, bits)
  const bn = Object.create(Bn.prototype)
  _bn.copy(bn)
  return bn
}

Bn.prototype.cmp = function (bn) {
  return _Bn.prototype.cmp.call(this, bn)
}

/**
   * All the standard big number operations operate on other big numbers. e.g.,
   * bn1.add(bn2). But it is frequenly valuble to add numbers or strings, e.g.
   * bn.add(5) or bn.add('5'). The decorator wraps all methods where this would
   * be convenient and makes that possible.
   */
function decorate (name) {
  Bn.prototype['_' + name] = Bn.prototype[name]
  const f = function (b) {
    if (typeof b === 'string') {
      b = new Bn(b)
    } else if (typeof b === 'number') {
      b = new Bn(b.toString())
    }
    return this['_' + name](b)
  }
  Bn.prototype[name] = f
}

Bn.prototype.eq = function (b) {
  return this.cmp(b) === 0
}

Bn.prototype.neq = function (b) {
  return this.cmp(b) !== 0
}

Bn.prototype.gt = function (b) {
  return this.cmp(b) > 0
}

Bn.prototype.geq = function (b) {
  return this.cmp(b) >= 0
}

Bn.prototype.lt = function (b) {
  return this.cmp(b) < 0
}

Bn.prototype.leq = function (b) {
  return this.cmp(b) <= 0
}

decorate('add')
decorate('sub')
decorate('mul')
decorate('mod')
decorate('invm')
decorate('div')
decorate('cmp')
decorate('gt')
decorate('geq')
decorate('lt')
decorate('leq')

export { Bn }
