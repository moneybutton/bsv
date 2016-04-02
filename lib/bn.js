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
 * let bn = BN(str) // str is base 10
 * let bn = BN(num)
 * let bn = BN().fromBuffer(buf)
 * let bn = BN().fromSM(buf); // sign+magnitude format, first bit is sign
 *
 * For little endian, pass in an options value:
 * let bn = BN().fromBuffer(buf, {endian: 'little'})
 * let bn = BN().fromSM(buf, {endian: 'little'})
 *
 * Getting output:
 * let str = BN().toString() // produces base 10 string
 * let buf = BN().toBuffer() // produces buffer representation
 * let buf = BN().toBuffer({size: 32}) //produced 32 byte buffer
 */
'use strict'
let dependencies = {
  _BN: require('bn.js')
}

let inject = function (deps) {
  let _BN = deps._BN

  function BN (n, base) {
    if (!(this instanceof BN)) {
      return new BN(n, base)
    }
    _BN.apply(this, arguments)
  }

  Object.keys(_BN).forEach(function (key) {
    BN[key] = _BN[key]
  })
  BN.prototype = Object.create(_BN.prototype)
  BN.prototype.constructor = BN

  function reversebuf (buf) {
    let buf2 = new Buffer(buf.length)
    for (let i = 0; i < buf.length; i++) {
      buf2[i] = buf[buf.length - 1 - i]
    }
    return buf2
  }

  BN.prototype.fromHex = function (hex, opts) {
    return this.fromBuffer(new Buffer(hex, 'hex'), opts)
  }

  BN.prototype.toHex = function (opts) {
    return this.toBuffer(opts).toString('hex')
  }

  BN.prototype.toJSON = function () {
    return this.toString()
  }

  BN.prototype.fromJSON = function (str) {
    let bn = BN(str)
    bn.copy(this)
    return this
  }

  BN.prototype.fromNumber = function (n) {
    let bn = BN(n)
    bn.copy(this)
    return this
  }

  BN.prototype.toNumber = function () {
    return parseInt(this['toString'](10), 10)
  }

  BN.prototype.fromString = function (str, base) {
    let bn = BN(str, base)
    bn.copy(this)
    return this
  }

  BN.fromBuffer = function (buf, opts) {
    if (opts !== undefined && opts.endian === 'little') {
      buf = reversebuf(buf)
    }
    let hex = buf.toString('hex')
    let bn = new BN(hex, 16)
    return bn
  }

  BN.prototype.fromBuffer = function (buf, opts) {
    let bn = BN.fromBuffer(buf, opts)
    bn.copy(this)

    return this
  }

  BN.prototype.toBuffer = function (opts) {
    let buf
    if (opts && opts.size) {
      let hex = this.toString(16, 2)
      let natlen = hex.length / 2
      buf = new Buffer(hex, 'hex')

      if (natlen === opts.size) {
        // pass
      } else if (natlen > opts.size) {
        buf = buf.slice(natlen - buf.length, buf.length)
      } else if (natlen < opts.size) {
        let rbuf = new Buffer(opts.size)
        for (let i = 0; i < buf.length; i++) {
          rbuf[rbuf.length - 1 - i] = buf[buf.length - 1 - i]
        }
        for (let i = 0; i < opts.size - natlen; i++) {
          rbuf[i] = 0
        }
        buf = rbuf
      }
    } else {
      let hex = this.toString(16, 2)
      buf = new Buffer(hex, 'hex')
    }

    if (opts !== undefined && opts.endian === 'little') {
      buf = reversebuf(buf)
    }
    let longzero = new Buffer([0])
    if (Buffer.compare(buf, longzero) === 0) {
      return new Buffer([])
    }
    return buf
  }

  /**
   * Signed magnitude buffer. Most significant bit represents sign (0 = positive,
   * 1 = negative).
   */
  BN.prototype.fromSM = function (buf, opts) {
    if (buf.length === 0) {
      this.fromBuffer(new Buffer([0]))
    }

    let endian = 'big'
    if (opts) {
      endian = opts.endian
    }

    if (endian === 'little') {
      buf = reversebuf(buf)
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

  BN.prototype.toSM = function (opts) {
    let endian = 'big'
    if (opts) {
      endian = opts.endian
    }

    let buf
    if (this.cmp(0) === -1) {
      buf = this.neg().toBuffer()
      if (buf[0] & 0x80) {
        buf = Buffer.concat([new Buffer([0x80]), buf])
      } else {
        buf[0] = buf[0] | 0x80
      }
    } else {
      buf = this.toBuffer()
      if (buf[0] & 0x80) {
        buf = Buffer.concat([new Buffer([0x00]), buf])
      }
    }

    if (buf.length === 1 & buf[0] === 0) {
      buf = new Buffer([])
    }

    if (endian === 'little') {
      buf = reversebuf(buf)
    }

    return buf
  }

  /**
   * Produce a BN from the "bits" value in a blockheader. Analagous to Bitcoin
   * Core's uint256 SetCompact method. bits is assumed to be UInt32.
   */
  BN.prototype.fromBits = function (bits, opts) {
    // To performed bitwise operations in javascript, we need to convert to a
    // signed 32 bit value.
    let buf = new Buffer(4)
    buf.writeUInt32BE(bits, 0)
    bits = buf.readInt32BE(0)
    if (opts && opts.strict && (bits & 0x00800000)) {
      throw new Error('negative bit set')
    }
    let nsize = bits >> 24
    let nword = bits & 0x007fffff
    buf = new Buffer(4)
    buf.writeInt32BE(nword)
    if (nsize <= 3) {
      buf = buf.slice(1, nsize + 1)
    } else {
      let fill = new Buffer(nsize - 3)
      fill.fill(0)
      buf = Buffer.concat([buf, fill])
    }
    this.fromBuffer(buf)
    if (bits & 0x00800000) {
      BN(0).sub(this).copy(this)
    }
    return this
  }

  /**
   * Convert BN to the "bits" value in a blockheader. Analagous to Bitcoin
   * Core's uint256 GetCompact method. bits is a UInt32.
   */
  BN.prototype.toBits = function () {
    let buf
    if (this.lt(0)) {
      buf = this.neg().toBuffer()
    } else {
      buf = this.toBuffer()
    }
    let nsize = buf.length
    let nword
    if (nsize > 3) {
      nword = Buffer.concat([new Buffer([0]), buf.slice(0, 3)]).readUInt32BE(0)
    } else if (nsize <= 3) {
      let blank = new Buffer(3 - nsize + 1)
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
    let bits = (nsize << 24) | nword
    // convert bits to UInt32 before returning
    buf = new Buffer(4)
    buf.writeInt32BE(bits, 0)
    return buf.readUInt32BE(0)
  }

  // This is analogous to the constructor for CScriptNum in bitcoind. Many ops
  // in bitcoind's script interpreter use CScriptNum, which is not really a
  // proper bignum. Instead, an error is thrown if trying to input a number
  // bigger than 4 bytes. We copy that behavior here. There is one exception -
  // in CHECKLOCKTIMEVERIFY, the numbers are allowed to be up to 5 bytes long.
  // We allow for setting that variable here for use in CHECKLOCKTIMEVERIFY.
  BN.prototype.fromScriptNumBuffer = function (buf, fRequireMinimal, nMaxNumSize) {
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
    return this.fromSM(buf, {endian: 'little'})
  }

  // The corollary to the above, with the notable exception that we do not throw
  // an error if the output is larger than four bytes. (Which can happen if
  // performing a numerical operation that results in an overflow to more than 4
  // bytes).
  BN.prototype.toScriptNumBuffer = function (buf) {
    return this.toSM({endian: 'little'})
  }

  BN.prototype.neg = function () {
    let _neg = _BN.prototype.neg.call(this)
    let neg = Object.create(BN.prototype)
    _neg.copy(neg)
    return neg
  }

  BN.prototype.add = function (bn) {
    let _bn = _BN.prototype.add.call(this, bn)
    bn = Object.create(BN.prototype)
    _bn.copy(bn)
    return bn
  }

  BN.prototype.sub = function (bn) {
    let _bn = _BN.prototype.sub.call(this, bn)
    bn = Object.create(BN.prototype)
    _bn.copy(bn)
    return bn
  }

  BN.prototype.mul = function (bn) {
    let _bn = _BN.prototype.mul.call(this, bn)
    bn = Object.create(BN.prototype)
    _bn.copy(bn)
    return bn
  }

  /**
   * to be used if this is positive.
   */
  BN.prototype.mod = function (bn) {
    let _bn = _BN.prototype.mod.call(this, bn)
    bn = Object.create(BN.prototype)
    _bn.copy(bn)
    return bn
  }

  /**
   * to be used if this is negative.
   */
  BN.prototype.umod = function (bn) {
    let _bn = _BN.prototype.umod.call(this, bn)
    bn = Object.create(BN.prototype)
    _bn.copy(bn)
    return bn
  }

  BN.prototype.invm = function (bn) {
    let _bn = _BN.prototype.invm.call(this, bn)
    bn = Object.create(BN.prototype)
    _bn.copy(bn)
    return bn
  }

  BN.prototype.div = function (bn) {
    let _bn = _BN.prototype.div.call(this, bn)
    bn = Object.create(BN.prototype)
    _bn.copy(bn)
    return bn
  }

  BN.prototype.cmp = function (bn) {
    return _BN.prototype.cmp.call(this, bn)
  }

  /**
   * All the standard big number operations operate on other big numbers. e.g.,
   * bn1.add(bn2). But it is frequenly valuble to add numbers or strings, e.g.
   * bn.add(5) or bn.add('5'). The decorator wraps all methods where this would
   * be convenient and makes that possible.
   */
  function decorate (name) {
    BN.prototype['_' + name] = BN.prototype[name]
    let f = function (b) {
      if (typeof b === 'string') {
        b = new BN(b)
      } else if (typeof b === 'number') {
        b = new BN(b.toString())
      }
      return this['_' + name](b)
    }
    BN.prototype[name] = f
  }

  BN.prototype.eq = function (b) {
    return this.cmp(b) === 0
  }

  BN.prototype.neq = function (b) {
    return this.cmp(b) !== 0
  }

  BN.prototype.gt = function (b) {
    return this.cmp(b) > 0
  }

  BN.prototype.geq = function (b) {
    return this.cmp(b) >= 0
  }

  BN.prototype.lt = function (b) {
    return this.cmp(b) < 0
  }

  BN.prototype.leq = function (b) {
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

  return BN
}

inject = require('./injector')(inject, dependencies)
let BN = inject()
module.exports = BN
