function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var _Aes = _interopDefault(require('aes'));
var _Bn = _interopDefault(require('bn.js'));
var bs58 = _interopDefault(require('bs58'));
var elliptic = _interopDefault(require('bitcoin-elliptic'));
var hashjs = _interopDefault(require('hash.js'));
var pbkdf2 = _interopDefault(require('pbkdf2'));
var isHex = _interopDefault(require('is-hex'));
var randomBytes = _interopDefault(require('randombytes'));

var version = "2.0.8";

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

function Bn(n, base, ...rest) {
  if (!(this instanceof Bn)) {
    return new Bn(n, base, ...rest);
  }

  _Bn.call(this, n, base, ...rest);
}

Object.keys(_Bn).forEach(function (key) {
  Bn[key] = _Bn[key];
});
Bn.prototype = Object.create(_Bn.prototype);
Bn.prototype.constructor = Bn;

function reverseBuf(buf) {
  const buf2 = Buffer.alloc(buf.length);

  for (let i = 0; i < buf.length; i++) {
    buf2[i] = buf[buf.length - 1 - i];
  }

  return buf2;
}

Bn.prototype.fromHex = function (hex, opts) {
  return this.fromBuffer(Buffer.from(hex, 'hex'), opts);
};

Bn.prototype.toHex = function (opts) {
  return this.toBuffer(opts).toString('hex');
};

Bn.prototype.toJSON = function () {
  return this.toString();
};

Bn.prototype.fromJSON = function (str) {
  const bn = Bn(str);
  bn.copy(this);
  return this;
};

Bn.prototype.fromNumber = function (n) {
  const bn = Bn(n);
  bn.copy(this);
  return this;
};

Bn.prototype.toNumber = function () {
  return parseInt(this.toString(10), 10);
};

Bn.prototype.fromString = function (str, base) {
  const bn = Bn(str, base);
  bn.copy(this);
  return this;
};

Bn.fromBuffer = function (buf, opts = {
  endian: 'big'
}) {
  if (opts.endian === 'little') {
    buf = reverseBuf(buf);
  }

  const hex = buf.toString('hex');
  const bn = new Bn(hex, 16);
  return bn;
};

Bn.prototype.fromBuffer = function (buf, opts) {
  const bn = Bn.fromBuffer(buf, opts);
  bn.copy(this);
  return this;
};

Bn.prototype.toBuffer = function (opts = {
  size: undefined,
  endian: 'big'
}) {
  let buf;

  if (opts.size) {
    const hex = this.toString(16, 2);
    const natlen = hex.length / 2;
    buf = Buffer.from(hex, 'hex');

    if (natlen === opts.size) ; else if (natlen > opts.size) {
      buf = buf.slice(natlen - buf.length, buf.length);
    } else if (natlen < opts.size) {
      const rbuf = Buffer.alloc(opts.size);

      for (let i = 0; i < buf.length; i++) {
        rbuf[rbuf.length - 1 - i] = buf[buf.length - 1 - i];
      }

      for (let i = 0; i < opts.size - natlen; i++) {
        rbuf[i] = 0;
      }

      buf = rbuf;
    }
  } else {
    const hex = this.toString(16, 2);
    buf = Buffer.from(hex, 'hex');
  }

  if (opts.endian === 'little') {
    buf = reverseBuf(buf);
  }

  const longzero = Buffer.from([0]);

  if (Buffer.compare(buf, longzero) === 0) {
    return Buffer.from([]);
  }

  return buf;
};

Bn.prototype.toFastBuffer = Bn.prototype.toBuffer;
Bn.fromFastBuffer = Bn.fromBuffer;
Bn.prototype.fromFastBuffer = Bn.prototype.fromBuffer;
/**
   * Signed magnitude buffer. Most significant bit represents sign (0 = positive,
   * 1 = negative).
   */

Bn.prototype.fromSm = function (buf, opts = {
  endian: 'big'
}) {
  if (buf.length === 0) {
    this.fromBuffer(Buffer.from([0]));
  }

  const endian = opts.endian;

  if (endian === 'little') {
    buf = reverseBuf(buf);
  }

  if (buf[0] & 0x80) {
    buf[0] = buf[0] & 0x7f;
    this.fromBuffer(buf);
    this.neg().copy(this);
  } else {
    this.fromBuffer(buf);
  }

  return this;
};

Bn.prototype.toSm = function (opts = {
  endian: 'big'
}) {
  const endian = opts.endian;
  let buf;

  if (this.cmp(0) === -1) {
    buf = this.neg().toBuffer();

    if (buf[0] & 0x80) {
      buf = Buffer.concat([Buffer.from([0x80]), buf]);
    } else {
      buf[0] = buf[0] | 0x80;
    }
  } else {
    buf = this.toBuffer();

    if (buf[0] & 0x80) {
      buf = Buffer.concat([Buffer.from([0x00]), buf]);
    }
  }

  if (buf.length === 1 & buf[0] === 0) {
    buf = Buffer.from([]);
  }

  if (endian === 'little') {
    buf = reverseBuf(buf);
  }

  return buf;
};
/**
   * Produce a Bn from the "bits" value in a blockheader. Analagous to Bitcoin
   * Core's uint256 SetCompact method. bits is assumed to be UInt32.
   */


Bn.prototype.fromBits = function (bits, opts = {
  strict: false
}) {
  // To performed bitwise operations in javascript, we need to convert to a
  // signed 32 bit value.
  let buf = Buffer.alloc(4);
  buf.writeUInt32BE(bits, 0);
  bits = buf.readInt32BE(0);

  if (opts.strict && bits & 0x00800000) {
    throw new Error('negative bit set');
  }

  const nsize = bits >> 24;
  const nword = bits & 0x007fffff;
  buf = Buffer.alloc(4);
  buf.writeInt32BE(nword);

  if (nsize <= 3) {
    buf = buf.slice(1, nsize + 1);
  } else {
    const fill = Buffer.alloc(nsize - 3);
    fill.fill(0);
    buf = Buffer.concat([buf, fill]);
  }

  this.fromBuffer(buf);

  if (bits & 0x00800000) {
    Bn(0).sub(this).copy(this);
  }

  return this;
};
/**
   * Convert Bn to the "bits" value in a blockheader. Analagous to Bitcoin
   * Core's uint256 GetCompact method. bits is a UInt32.
   */


Bn.prototype.toBits = function () {
  let buf;

  if (this.lt(0)) {
    buf = this.neg().toBuffer();
  } else {
    buf = this.toBuffer();
  }

  let nsize = buf.length;
  let nword;

  if (nsize > 3) {
    nword = Buffer.concat([Buffer.from([0]), buf.slice(0, 3)]).readUInt32BE(0);
  } else if (nsize <= 3) {
    const blank = Buffer.alloc(3 - nsize + 1);
    blank.fill(0);
    nword = Buffer.concat([blank, buf.slice(0, nsize)]).readUInt32BE(0);
  }

  if (nword & 0x00800000) {
    // The most significant bit denotes sign. Do not want unless number is
    // actually negative.
    nword >>= 8;
    nsize++;
  }

  if (this.lt(0)) {
    nword |= 0x00800000;
  }

  const bits = nsize << 24 | nword; // convert bits to UInt32 before returning

  buf = Buffer.alloc(4);
  buf.writeInt32BE(bits, 0);
  return buf.readUInt32BE(0);
}; // This is analogous to the constructor for CScriptNum in bitcoind. Many ops
// in bitcoind's script interpreter use CScriptNum, which is not really a
// proper bignum. Instead, an error is thrown if trying to input a number
// bigger than 4 bytes. We copy that behavior here. There is one exception -
// in CHECKLOCKTIMEVERIFY, the numbers are allowed to be up to 5 bytes long.
// We allow for setting that variable here for use in CHECKLOCKTIMEVERIFY.


Bn.prototype.fromScriptNumBuffer = function (buf, fRequireMinimal, nMaxNumSize) {
  if (nMaxNumSize === undefined) {
    nMaxNumSize = 4;
  }

  if (buf.length > nMaxNumSize) {
    throw new Error('script number overflow');
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
        throw new Error('non-minimally encoded script number');
      }
    }
  }

  return this.fromSm(buf, {
    endian: 'little'
  });
}; // The corollary to the above, with the notable exception that we do not throw
// an error if the output is larger than four bytes. (Which can happen if
// performing a numerical operation that results in an overflow to more than 4
// bytes).


Bn.prototype.toScriptNumBuffer = function (buf) {
  return this.toSm({
    endian: 'little'
  });
};

Bn.prototype.neg = function () {
  const _neg = _Bn.prototype.neg.call(this);

  const neg = Object.create(Bn.prototype);

  _neg.copy(neg);

  return neg;
};

Bn.prototype.add = function (bn) {
  const _bn = _Bn.prototype.add.call(this, bn);

  bn = Object.create(Bn.prototype);

  _bn.copy(bn);

  return bn;
};

Bn.prototype.sub = function (bn) {
  const _bn = _Bn.prototype.sub.call(this, bn);

  bn = Object.create(Bn.prototype);

  _bn.copy(bn);

  return bn;
};

Bn.prototype.mul = function (bn) {
  const _bn = _Bn.prototype.mul.call(this, bn);

  bn = Object.create(Bn.prototype);

  _bn.copy(bn);

  return bn;
};
/**
   * to be used if this is positive.
   */


Bn.prototype.mod = function (bn) {
  const _bn = _Bn.prototype.mod.call(this, bn);

  bn = Object.create(Bn.prototype);

  _bn.copy(bn);

  return bn;
};
/**
   * to be used if this is negative.
   */


Bn.prototype.umod = function (bn) {
  const _bn = _Bn.prototype.umod.call(this, bn);

  bn = Object.create(Bn.prototype);

  _bn.copy(bn);

  return bn;
};

Bn.prototype.invm = function (bn) {
  const _bn = _Bn.prototype.invm.call(this, bn);

  bn = Object.create(Bn.prototype);

  _bn.copy(bn);

  return bn;
};

Bn.prototype.div = function (bn) {
  const _bn = _Bn.prototype.div.call(this, bn);

  bn = Object.create(Bn.prototype);

  _bn.copy(bn);

  return bn;
};

Bn.prototype.ushln = function (bits) {
  const _bn = _Bn.prototype.ushln.call(this, bits);

  const bn = Object.create(Bn.prototype);

  _bn.copy(bn);

  return bn;
};

Bn.prototype.ushrn = function (bits) {
  const _bn = _Bn.prototype.ushrn.call(this, bits);

  const bn = Object.create(Bn.prototype);

  _bn.copy(bn);

  return bn;
};

Bn.prototype.cmp = function (bn) {
  return _Bn.prototype.cmp.call(this, bn);
};
/**
   * All the standard big number operations operate on other big numbers. e.g.,
   * bn1.add(bn2). But it is frequenly valuble to add numbers or strings, e.g.
   * bn.add(5) or bn.add('5'). The decorator wraps all methods where this would
   * be convenient and makes that possible.
   */


function decorate(name) {
  Bn.prototype['_' + name] = Bn.prototype[name];

  const f = function (b) {
    if (typeof b === 'string') {
      b = new Bn(b);
    } else if (typeof b === 'number') {
      b = new Bn(b.toString());
    }

    return this['_' + name](b);
  };

  Bn.prototype[name] = f;
}

Bn.prototype.eq = function (b) {
  return this.cmp(b) === 0;
};

Bn.prototype.neq = function (b) {
  return this.cmp(b) !== 0;
};

Bn.prototype.gt = function (b) {
  return this.cmp(b) > 0;
};

Bn.prototype.geq = function (b) {
  return this.cmp(b) >= 0;
};

Bn.prototype.lt = function (b) {
  return this.cmp(b) < 0;
};

Bn.prototype.leq = function (b) {
  return this.cmp(b) <= 0;
};

decorate('add');
decorate('sub');
decorate('mul');
decorate('mod');
decorate('invm');
decorate('div');
decorate('cmp');
decorate('gt');
decorate('geq');
decorate('lt');
decorate('leq');

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

class Br {
  constructor(buf) {
    this.fromObject({
      buf
    });
  }

  fromObject(obj) {
    this.buf = obj.buf || this.buf || undefined;
    this.pos = obj.pos || this.pos || 0;
    return this;
  }

  eof() {
    return this.pos >= this.buf.length;
  }

  read(len = this.buf.length) {
    const buf = this.buf.slice(this.pos, this.pos + len);
    this.pos = this.pos + len;
    return buf;
  }

  readReverse(len = this.buf.length) {
    const buf = this.buf.slice(this.pos, this.pos + len);
    this.pos = this.pos + len;
    const buf2 = Buffer.alloc(buf.length);

    for (let i = 0; i < buf2.length; i++) {
      buf2[i] = buf[buf.length - 1 - i];
    }

    return buf2;
  }

  readUInt8() {
    const val = this.buf.readUInt8(this.pos);
    this.pos = this.pos + 1;
    return val;
  }

  readInt8() {
    const val = this.buf.readInt8(this.pos);
    this.pos = this.pos + 1;
    return val;
  }

  readUInt16BE() {
    const val = this.buf.readUInt16BE(this.pos);
    this.pos = this.pos + 2;
    return val;
  }

  readInt16BE() {
    const val = this.buf.readInt16BE(this.pos);
    this.pos = this.pos + 2;
    return val;
  }

  readUInt16LE() {
    const val = this.buf.readUInt16LE(this.pos);
    this.pos = this.pos + 2;
    return val;
  }

  readInt16LE() {
    const val = this.buf.readInt16LE(this.pos);
    this.pos = this.pos + 2;
    return val;
  }

  readUInt32BE() {
    const val = this.buf.readUInt32BE(this.pos);
    this.pos = this.pos + 4;
    return val;
  }

  readInt32BE() {
    const val = this.buf.readInt32BE(this.pos);
    this.pos = this.pos + 4;
    return val;
  }

  readUInt32LE() {
    const val = this.buf.readUInt32LE(this.pos);
    this.pos = this.pos + 4;
    return val;
  }

  readInt32LE() {
    const val = this.buf.readInt32LE(this.pos);
    this.pos = this.pos + 4;
    return val;
  }

  readUInt64BEBn() {
    const buf = this.buf.slice(this.pos, this.pos + 8);
    const bn = new Bn().fromBuffer(buf);
    this.pos = this.pos + 8;
    return bn;
  }

  readUInt64LEBn() {
    const buf = this.readReverse(8);
    const bn = new Bn().fromBuffer(buf);
    return bn;
  }

  readVarIntNum() {
    const first = this.readUInt8();
    let bn, n;

    switch (first) {
      case 0xfd:
        return this.readUInt16LE();

      case 0xfe:
        return this.readUInt32LE();

      case 0xff:
        bn = this.readUInt64LEBn();
        n = bn.toNumber();

        if (n <= Math.pow(2, 53)) {
          return n;
        } else {
          throw new Error('number too large to retain precision - use readVarIntBn');
        }

      default:
        return first;
    }
  }

  readVarIntBuf() {
    const first = this.buf.readUInt8(this.pos);

    switch (first) {
      case 0xfd:
        return this.read(1 + 2);

      case 0xfe:
        return this.read(1 + 4);

      case 0xff:
        return this.read(1 + 8);

      default:
        return this.read(1);
    }
  }

  readVarIntBn() {
    const first = this.readUInt8();

    switch (first) {
      case 0xfd:
        return new Bn(this.readUInt16LE());

      case 0xfe:
        return new Bn(this.readUInt32LE());

      case 0xff:
        return this.readUInt64LEBn();

      default:
        return new Bn(first);
    }
  }

}

/**
 * Buffer Writer
 * =============
 *
 * This is the writing complement of the Br. You can easily write
 * VarInts and other basic number types. The way to use it is: buf =
 * new Bw().write(buf1).write(buf2).toBuffer()
 */

class Bw {
  constructor(bufs) {
    this.fromObject({
      bufs
    });
  }

  fromObject(obj) {
    this.bufs = obj.bufs || this.bufs || [];
    return this;
  }

  getLength() {
    let len = 0;

    for (const i in this.bufs) {
      const buf = this.bufs[i];
      len = len + buf.length;
    }

    return len;
  }

  toBuffer() {
    return Buffer.concat(this.bufs);
  }

  write(buf) {
    this.bufs.push(buf);
    return this;
  }

  writeReverse(buf) {
    const buf2 = Buffer.alloc(buf.length);

    for (let i = 0; i < buf2.length; i++) {
      buf2[i] = buf[buf.length - 1 - i];
    }

    this.bufs.push(buf2);
    return this;
  }

  writeUInt8(n) {
    const buf = Buffer.alloc(1);
    buf.writeUInt8(n, 0);
    this.write(buf);
    return this;
  }

  writeInt8(n) {
    const buf = Buffer.alloc(1);
    buf.writeInt8(n, 0);
    this.write(buf);
    return this;
  }

  writeUInt16BE(n) {
    const buf = Buffer.alloc(2);
    buf.writeUInt16BE(n, 0);
    this.write(buf);
    return this;
  }

  writeInt16BE(n) {
    const buf = Buffer.alloc(2);
    buf.writeInt16BE(n, 0);
    this.write(buf);
    return this;
  }

  writeUInt16LE(n) {
    const buf = Buffer.alloc(2);
    buf.writeUInt16LE(n, 0);
    this.write(buf);
    return this;
  }

  writeInt16LE(n) {
    const buf = Buffer.alloc(2);
    buf.writeInt16LE(n, 0);
    this.write(buf);
    return this;
  }

  writeUInt32BE(n) {
    const buf = Buffer.alloc(4);
    buf.writeUInt32BE(n, 0);
    this.write(buf);
    return this;
  }

  writeInt32BE(n) {
    const buf = Buffer.alloc(4);
    buf.writeInt32BE(n, 0);
    this.write(buf);
    return this;
  }

  writeUInt32LE(n) {
    const buf = Buffer.alloc(4);
    buf.writeUInt32LE(n, 0);
    this.write(buf);
    return this;
  }

  writeInt32LE(n) {
    const buf = Buffer.alloc(4);
    buf.writeInt32LE(n, 0);
    this.write(buf);
    return this;
  }

  writeUInt64BEBn(bn) {
    const buf = bn.toBuffer({
      size: 8
    });
    this.write(buf);
    return this;
  }

  writeUInt64LEBn(bn) {
    const buf = bn.toBuffer({
      size: 8
    });
    this.writeReverse(buf);
    return this;
  }

  writeVarIntNum(n) {
    const buf = Bw.varIntBufNum(n);
    this.write(buf);
    return this;
  }

  writeVarIntBn(bn) {
    const buf = Bw.varIntBufBn(bn);
    this.write(buf);
    return this;
  }

  static varIntBufNum(n) {
    let buf;

    if (n < 253) {
      buf = Buffer.alloc(1);
      buf.writeUInt8(n, 0);
    } else if (n < 0x10000) {
      buf = Buffer.alloc(1 + 2);
      buf.writeUInt8(253, 0);
      buf.writeUInt16LE(n, 1);
    } else if (n < 0x100000000) {
      buf = Buffer.alloc(1 + 4);
      buf.writeUInt8(254, 0);
      buf.writeUInt32LE(n, 1);
    } else {
      buf = Buffer.alloc(1 + 8);
      buf.writeUInt8(255, 0);
      buf.writeInt32LE(n & -1, 1);
      buf.writeUInt32LE(Math.floor(n / 0x100000000), 5);
    }

    return buf;
  }

  static varIntBufBn(bn) {
    let buf;
    const n = bn.toNumber();

    if (n < 253) {
      buf = Buffer.alloc(1);
      buf.writeUInt8(n, 0);
    } else if (n < 0x10000) {
      buf = Buffer.alloc(1 + 2);
      buf.writeUInt8(253, 0);
      buf.writeUInt16LE(n, 1);
    } else if (n < 0x100000000) {
      buf = Buffer.alloc(1 + 4);
      buf.writeUInt8(254, 0);
      buf.writeUInt32LE(n, 1);
    } else {
      const bw = new Bw();
      bw.writeUInt8(255);
      bw.writeUInt64LEBn(bn);
      buf = bw.toBuffer();
    }

    return buf;
  }

}

/**
 * Structure
 * =========
 *
 * A convenient structure to extend objects from that comes with very common
 * boiler plate instance methods:
 * - fromObject
 * - fromBr
 * - toBw
 * - fromBuffer
 * - fromFastBuffer
 * - toBuffer
 * - toFastBuffer
 * - fromHex
 * - toHex
 * - fromString
 * - toString
 * - fromJSON
 * - toJSON
 * - cloneByBuffer
 * - cloneByFastBuffer
 * - cloneByHex
 * - cloneByString
 * - cloneByJSON
 *
 * As well as static methods for:
 * - fromObject
 * - fromBr
 * - fromBuffer
 * - fromFastBuffer
 * - fromHex
 * - fromString
 * - fromJSON
 *
 * The "expect" method also facilitates deserializing a sequence of buffers
 * into an object.
 */

class Struct {
  constructor(obj) {
    this.fromObject(obj);
  }

  fromObject(obj) {
    if (!obj) {
      return this;
    }

    for (const key of Object.keys(obj)) {
      if (obj[key] !== undefined) {
        this[key] = obj[key];
      }
    }

    return this;
  }

  static fromObject(obj) {
    return new this().fromObject(obj);
  }

  fromBr(br) {
    if (!(br instanceof Br)) {
      throw new Error('br must be a buffer reader');
    }

    throw new Error('not implemented');
  }

  static fromBr(br) {
    return new this().fromBr(br);
  }

  asyncFromBr(br) {
    if (!(br instanceof Br)) {
      throw new Error('br must be a buffer reader');
    }

    throw new Error('not implemented');
  }

  static asyncFromBr(br) {
    return new this().asyncFromBr(br);
  }

  toBw(bw) {
    throw new Error('not implemented');
  }

  asyncToBw(bw) {
    throw new Error('not implemented');
  }
  /**
     * It is very often the case that you want to create a bitcoin object from a
     * stream of small buffers rather than from a buffer of the correct length.
     * For instance, if streaming from the network or disk. The genFromBuffers
     * method is a generator which produces an iterator. Use .next(buf) to pass
     * in a small buffer. The iterator will end when it has received enough data
     * to produce the object. In some cases it is able to yield the number of
     * bytes it is expecting, but that is not always known.
     */


  *genFromBuffers() {
    throw new Error('not implemented');
  }
  /**
     * A convenience method used by from the genFromBuffers* generators.
     * Basically lets you expect a certain number of bytes (len) and keeps
     * yielding until you give it enough. It yields the expected amount
     * remaining, and returns an object containing a buffer of the expected
     * length, and, if any, the remainder buffer.
     */


  *expect(len, startbuf) {
    let buf = startbuf;
    const bw = new Bw();
    let gotlen = 0;

    if (startbuf) {
      bw.write(startbuf);
      gotlen += startbuf.length;
    }

    while (gotlen < len) {
      const remainderlen = len - gotlen;
      buf = yield remainderlen;

      if (!buf) {
        continue;
      }

      bw.write(buf);
      gotlen += buf.length;
    }

    buf = bw.toBuffer();
    const overlen = gotlen - len;
    const remainderbuf = buf.slice(buf.length - overlen, buf.length);
    buf = buf.slice(0, buf.length - overlen);
    return {
      buf: buf,
      remainderbuf: remainderbuf
    };
  }
  /**
     * Convert a buffer into an object, i.e. deserialize the object.
     */


  fromBuffer(buf, ...rest) {
    if (!Buffer.isBuffer(buf)) {
      throw new Error('buf must be a buffer');
    }

    const br = new Br(buf);
    return this.fromBr(br, ...rest);
  }

  static fromBuffer(...rest) {
    return new this().fromBuffer(...rest);
  }

  asyncFromBuffer(buf, ...rest) {
    if (!Buffer.isBuffer(buf)) {
      throw new Error('buf must be a buffer');
    }

    const br = new Br(buf);
    return this.asyncFromBr(br, ...rest);
  }

  static asyncFromBuffer(buf, ...rest) {
    return new this().asyncFromBuffer(buf, ...rest);
  }
  /**
     * The complement of toFastBuffer - see description for toFastBuffer
     */


  fromFastBuffer(buf, ...rest) {
    if (buf.length === 0) {
      return this;
    } else {
      return this.fromBuffer(buf, ...rest);
    }
  }

  static fromFastBuffer(...rest) {
    return new this().fromFastBuffer(...rest);
  }
  /**
     * Convert the object into a buffer, i.e. serialize the object. This method
     * may block the main thread.
     */


  toBuffer(...rest) {
    return this.toBw(...rest).toBuffer();
  }

  asyncToBuffer(...rest) {
    return this.asyncToBw(...rest).then(bw => bw.toBuffer());
  }
  /**
     * Sometimes the toBuffer method has cryptography and blocks the main thread,
     * and we need a non-blocking way to serialize an object. That is what
     * toFastBuffer is. Of course it defaults to just using toBuffer if an object
     * hasn't implemented it. If your regular toBuffer method blocks, like with
     * Bip32, then you should implement this method to be non-blocking. This
     * method is used to send objects to the workers. i.e., for converting a
     * Bip32 object to a string, we need to encode it as a buffer in a
     * non-blocking manner with toFastBuffer, send it to a worker, then the
     * worker converts it to a string, which is a blocking operation.
     *
     * It is very common to want to convert a blank object to a zero length
     * buffer, so we can transport a blank object to a worker. So that behavior
     * is included by default.
     */


  toFastBuffer(...rest) {
    if (Object.keys(this).length === 0) {
      return Buffer.alloc(0);
    } else {
      return this.toBuffer(...rest);
    }
  }

  fromHex(hex, ...rest) {
    if (!isHex(hex)) {
      throw new Error('invalid hex string');
    }

    const buf = Buffer.from(hex, 'hex');
    return this.fromBuffer(buf, ...rest);
  }

  static fromHex(hex, ...rest) {
    return new this().fromHex(hex, ...rest);
  }

  asyncFromHex(hex, ...rest) {
    if (!isHex(hex)) {
      throw new Error('invalid hex string');
    }

    const buf = Buffer.from(hex, 'hex');
    return this.asyncFromBuffer(buf, ...rest);
  }

  static asyncFromHex(hex, ...rest) {
    return new this().asyncFromHex(hex, ...rest);
  }

  fromFastHex(hex, ...rest) {
    if (!isHex(hex)) {
      throw new Error('invalid hex string');
    }

    const buf = Buffer.from(hex, 'hex');
    return this.fromFastBuffer(buf, ...rest);
  }

  static fromFastHex(hex, ...rest) {
    return new this().fromFastHex(hex, ...rest);
  }

  toHex(...rest) {
    return this.toBuffer(...rest).toString('hex');
  }

  asyncToHex(...rest) {
    return this.asyncToBuffer(...rest).then(buf => buf.toString('hex'));
  }

  toFastHex(...rest) {
    return this.toFastBuffer(...rest).toString('hex');
  }

  fromString(str, ...rest) {
    if (typeof str !== 'string') {
      throw new Error('str must be a string');
    }

    return this.fromHex(str, ...rest);
  }

  static fromString(str, ...rest) {
    return new this().fromString(str, ...rest);
  }

  asyncFromString(str, ...rest) {
    if (typeof str !== 'string') {
      throw new Error('str must be a string');
    }

    return this.asyncFromHex(str, ...rest);
  }

  static asyncFromString(str, ...rest) {
    return new this().asyncFromString(str, ...rest);
  }

  toString(...rest) {
    return this.toHex(...rest);
  }

  asyncToString(...rest) {
    return this.asyncToHex(...rest);
  }

  fromJSON(json) {
    throw new Error('not implemented');
  }

  static fromJSON(json, ...rest) {
    return new this().fromJSON(json, ...rest);
  }

  asyncFromJSON(json, ...rest) {
    throw new Error('not implemented');
  }

  static asyncFromJSON(json, ...rest) {
    return new this().asyncFromJSON(json, ...rest);
  }

  toJSON() {
    var json = {};

    for (var val in this) {
      // arrays
      if (Array.isArray(this[val])) {
        const arr = [];

        for (var i in this[val]) {
          if (typeof this[val][i].toJSON === 'function') {
            arr.push(this[val][i].toJSON());
          } else {
            arr.push(JSON.stringify(this[val][i]));
          }
        }

        json[val] = arr; // objects
      } else if (this[val] === null) {
        json[val] = this[val];
      } else if (typeof this[val] === 'object' && typeof this[val].toJSON === 'function') {
        json[val] = this[val].toJSON(); // booleans, numbers, and strings
      } else if (typeof this[val] === 'boolean' || typeof this[val] === 'number' || typeof this[val] === 'string') {
        json[val] = this[val]; // buffers
      } else if (Buffer.isBuffer(this[val])) {
        json[val] = this[val].toString('hex'); // map
      } else if (this[val] instanceof Map) {
        json[val] = JSON.stringify(this[val]); // throw an error for objects that do not implement toJSON
      } else if (typeof this[val] === 'object') {
        throw new Error('not implemented');
      }
    }

    return json; // throw new Error('not implemented')
  }

  asyncToJSON() {
    throw new Error('not implemented');
  }

  clone() {
    // TODO: Should this be more intelligent about picking which clone method
    // to default to?
    return this.cloneByJSON();
  }

  cloneByBuffer() {
    return new this.constructor().fromBuffer(this.toBuffer());
  }

  cloneByFastBuffer() {
    return new this.constructor().fromFastBuffer(this.toFastBuffer());
  }

  cloneByHex() {
    return new this.constructor().fromHex(this.toHex());
  }

  cloneByString() {
    return new this.constructor().fromString(this.toString());
  }

  cloneByJSON() {
    return new this.constructor().fromJSON(this.toJSON());
  }

}

/**
 * Base58 Encoding
 * ===============
 *
 * Base58 (no check)
 */

class Base58 extends Struct {
  constructor(buf) {
    super({
      buf
    });
  }

  fromHex(hex) {
    return this.fromBuffer(Buffer.from(hex, 'hex'));
  }

  toHex() {
    return this.toBuffer().toString('hex');
  }

  static encode(buf) {
    if (!Buffer.isBuffer(buf)) {
      throw new Error('Input should be a buffer');
    }

    return bs58.encode(buf);
  }

  static decode(str) {
    if (typeof str !== 'string') {
      throw new Error('Input should be a string');
    }

    return Buffer.from(bs58.decode(str));
  }

  fromBuffer(buf) {
    this.buf = buf;
    return this;
  }

  fromString(str) {
    const buf = Base58.decode(str);
    this.buf = buf;
    return this;
  }

  toBuffer() {
    return this.buf;
  }

  toString() {
    return Base58.encode(this.buf);
  }

}

/**
 * Constant-Time Buffer Compare
 * ============================
 *
 * A constant-time comparison function. This should be used in any security
 * sensitive code where leaking timing information may lead to lessened
 * security. Note that if the buffers are not equal in length, this function
 * loops for the longest buffer, which may not be necessary. Usually this
 * function should be used for buffers that would otherwise be equal length,
 * such as a hash, particularly Hmacs.
 *
 * The algorithm here, which is XORs each byte (or, if undefined, 0) with the
 * corresponding other byte, and then ORs that with a running total (d), is
 * adapted from here:
 *
 * https://groups.google.com/forum/#!topic/keyczar-discuss/VXHsoJSLKhM
 */

const cmp = (buf1, buf2) => {
  if (!Buffer.isBuffer(buf1) || !Buffer.isBuffer(buf2)) {
    throw new Error('buf1 and buf2 must be buffers');
  }

  if (buf1.length !== buf2.length) {
    return false;
  }

  let d = 0;

  for (let i = 0; i < buf1.length; i++) {
    const x = buf1[i];
    const y = buf2[i];
    d |= x ^ y;
  }

  return d === 0;
};

/**
 * WorkersResult
 * =============
 *
 * A response sent back from a worker to the main thread. Contains the "result"
 * of the computation in the form of a buffer, resbuf. If the actual result is
 * an object with a .toFastBuffer method, the object is converted to a buffer
 * using that method. Otherwise it is JSON serialized into a buffer. The result
 * can also be an error, in which case the isError flag is set.
 */

class WorkersResult extends Struct {
  constructor(resbuf, isError, id) {
    super({
      resbuf,
      isError,
      id
    });
  }

  fromResult(result, id) {
    if (result.toFastBuffer) {
      this.resbuf = result.toFastBuffer();
    } else if (Buffer.isBuffer(result)) {
      this.resbuf = result;
    } else {
      this.resbuf = Buffer.from(JSON.stringify(result));
    }

    this.isError = false;
    this.id = id;
    return this;
  }

  static fromResult(result, id) {
    return new this().fromResult(result, id);
  }

  fromError(error, id) {
    this.resbuf = Buffer.from(JSON.stringify(error.message));
    this.isError = true;
    this.id = id;
    return this;
  }

  toBw(bw) {
    if (!bw) {
      bw = new Bw();
    }

    bw.writeVarIntNum(this.resbuf.length);
    bw.write(this.resbuf);
    bw.writeUInt8(Number(this.isError));
    bw.writeVarIntNum(this.id);
    return bw;
  }

  fromBr(br) {
    const resbuflen = br.readVarIntNum();
    this.resbuf = br.read(resbuflen);
    this.isError = Boolean(br.readUInt8());
    this.id = br.readVarIntNum();
    return this;
  }

}

/**
 * Workers
 * =======
 *
 * Workers manages either processes (in node) or threads (in a browser). The
 * workers are intended to handle CPU-heavy tasks that block IO. This class is
 * a little unusual in that it must use different interfaces whether in node or
 * in the browser. In node, we use node's build-in child_process fork to create
 * new workers we can communicate with. In the browser, we use web workers.
 * Unfortunately, node and web browsers do not have a common interface for
 * workers. There is a node module called webworker-threads for node that
 * mimics the browser's web workers, but unfortunately it does not support
 * require(), and thus isn't very useful in our case. Therefore we fall back to
 * process forks.
 *
 * You probably don't need to use this class directly. Use Work, which will
 * automatically spawn new workers if needed.
 */
let globalWorkers;

class Workers {
  constructor(nativeWorkers = [], lastid = 0, incompconsteRes = [], promisemap = new Map()) {
    this.nativeWorkers = nativeWorkers;
    this.lastid = lastid;
    this.incompconsteRes = incompconsteRes;
    this.promisemap = promisemap;
  }

  asyncObjectMethod(obj, methodname, args, id = this.lastid + 1) {
    if (!args) {
      throw new Error('must specify args');
    }

    const result = obj[methodname](...args);
    const workersResult = new WorkersResult().fromResult(result, id);
    return workersResult;
  }

  static asyncObjectMethod(obj, methodname, args, id) {
    if (!globalWorkers) {
      globalWorkers = new Workers();
    }

    return globalWorkers.asyncObjectMethod(obj, methodname, args, id);
  }

  asyncClassMethod(classObj, methodname, args, id = this.lastid + 1) {
    if (!args) {
      throw new Error('must specify args');
    }

    const result = classObj[methodname](...args);
    const workersResult = new WorkersResult().fromResult(result, id);
    return workersResult;
  }

  static asyncClassMethod(classObj, methodname, args, id) {
    if (!globalWorkers) {
      globalWorkers = new Workers();
    }

    return globalWorkers.asyncClassMethod(classObj, methodname, args, id);
  }

  static endGlobalWorkers() {
    if (globalWorkers && !process.browser) {
      globalWorkers = undefined;
    }
  }

}

/**
 * Hash
 * ====
 *
 * Some hash functions are used through out bitcoin. We expose them here as a
 * convenience.
 */

class Hash {}

Hash.sha1 = function (buf) {
  if (!Buffer.isBuffer(buf)) {
    throw new Error('sha1 hash must be of a buffer');
  }

  const Sha1 = hashjs.sha1;
  const hash = new Sha1().update(buf).digest();
  return Buffer.from(hash);
};

Hash.sha1.blockSize = 512;

Hash.asyncSha1 = async function (buf) {
  const args = [buf];
  const workersResult = await Workers.asyncClassMethod(Hash, 'sha1', args);
  return workersResult.resbuf;
};

Hash.sha256 = function (buf) {
  if (!Buffer.isBuffer(buf)) {
    throw new Error('sha256 hash must be of a buffer');
  }

  const Sha256 = hashjs.sha256;
  const hash = new Sha256().update(buf).digest();
  return Buffer.from(hash);
};

Hash.sha256.blockSize = 512;

Hash.asyncSha256 = async function (buf) {
  const args = [buf];
  const workersResult = await Workers.asyncClassMethod(Hash, 'sha256', args);
  return workersResult.resbuf;
};

Hash.sha256Sha256 = function (buf) {
  try {
    return Hash.sha256(Hash.sha256(buf));
  } catch (e) {
    throw new Error('sha256Sha256 hash must be of a buffer: ' + e);
  }
};

Hash.asyncSha256Sha256 = async function (buf) {
  const args = [buf];
  const workersResult = await Workers.asyncClassMethod(Hash, 'sha256Sha256', args);
  return workersResult.resbuf;
};

Hash.ripemd160 = function (buf) {
  if (!Buffer.isBuffer(buf)) {
    throw new Error('ripemd160 hash must be of a buffer');
  }

  const Ripemd160 = hashjs.ripemd160;
  const hash = new Ripemd160().update(buf).digest();
  return Buffer.from(hash);
};

Hash.asyncRipemd160 = async function (buf) {
  const args = [buf];
  const workersResult = await Workers.asyncClassMethod(Hash, 'ripemd160', args);
  return workersResult.resbuf;
};

Hash.sha256Ripemd160 = function (buf) {
  try {
    return Hash.ripemd160(Hash.sha256(buf));
  } catch (e) {
    throw new Error('sha256Ripemd160 hash must be of a buffer: ' + e);
  }
};

Hash.asyncSha256Ripemd160 = async function (buf) {
  const args = [buf];
  const workersResult = await Workers.asyncClassMethod(Hash, 'sha256Ripemd160', args);
  return workersResult.resbuf;
};

Hash.sha512 = function (buf) {
  if (!Buffer.isBuffer(buf)) {
    throw new Error('sha512 hash must be of a buffer');
  }

  const Sha512 = hashjs.sha512;
  const hash = new Sha512().update(buf).digest();
  return Buffer.from(hash);
};

Hash.asyncSha512 = async function (buf) {
  const args = [buf];
  const workersResult = await Workers.asyncClassMethod(Hash, 'sha512', args);
  return workersResult.resbuf;
};

Hash.sha512.blockSize = 1024;

Hash.hmac = function (hashFStr, data, key) {
  if (hashFStr !== 'sha1' && hashFStr !== 'sha256' && hashFStr !== 'sha512') {
    throw new Error('invalid choice of hash function');
  }

  const hashf = Hash[hashFStr];

  if (!Buffer.isBuffer(data) || !Buffer.isBuffer(key)) {
    throw new Error('data and key must be buffers');
  } // http://en.wikipedia.org/wiki/Hash-based_message_authentication_code
  // http://tools.ietf.org/html/rfc4868#section-2


  const blockSize = hashf.blockSize / 8;

  if (key.length > blockSize) {
    key = hashf(key);
  }

  if (key.length < blockSize) {
    const fill = Buffer.alloc(blockSize);
    fill.fill(0, key.length);
    key.copy(fill);
    key = fill;
  }

  const oKeyPad = Buffer.alloc(blockSize);
  const iKeyPad = Buffer.alloc(blockSize);

  for (let i = 0; i < blockSize; i++) {
    oKeyPad[i] = 0x5c ^ key[i];
    iKeyPad[i] = 0x36 ^ key[i];
  }

  return hashf(Buffer.concat([oKeyPad, hashf(Buffer.concat([iKeyPad, data]))]));
};

Hash.sha1Hmac = function (data, key) {
  return Hash.hmac('sha1', data, key);
};

Hash.asyncSha1Hmac = async function (data, key) {
  const args = [data, key];
  const workersResult = await Workers.asyncClassMethod(Hash, 'sha1Hmac', args);
  return workersResult.resbuf;
};

Hash.sha1Hmac.bitsize = 160;

Hash.sha256Hmac = function (data, key) {
  return Hash.hmac('sha256', data, key);
};

Hash.asyncSha256Hmac = async function (data, key) {
  const args = [data, key];
  const workersResult = await Workers.asyncClassMethod(Hash, 'sha256Hmac', args);
  return workersResult.resbuf;
};

Hash.sha256Hmac.bitsize = 256;

Hash.sha512Hmac = function (data, key) {
  return Hash.hmac('sha512', data, key);
};

Hash.asyncSha512Hmac = async function (data, key) {
  const args = [data, key];
  const workersResult = await Workers.asyncClassMethod(Hash, 'sha512Hmac', args);
  return workersResult.resbuf;
};

Hash.sha512Hmac.bitsize = 512;

/**
 * Base58 Check Encoding
 * =====================
 *
 * Base58 check encoding. The usual way to use it is
 * new Base58Check(buf).toString() or new Base58Check(str).toBuffer().
 */

class Base58Check extends Struct {
  constructor(buf) {
    super({
      buf
    });
  }

  fromHex(hex) {
    return this.fromBuffer(Buffer.from(hex, 'hex'));
  }

  toHex() {
    return this.toBuffer().toString('hex');
  }

  static decode(s) {
    if (typeof s !== 'string') {
      throw new Error('Input must be a string');
    }

    const buf = Base58.decode(s);

    if (buf.length < 4) {
      throw new Error('Input string too short');
    }

    const data = buf.slice(0, -4);
    const csum = buf.slice(-4);
    const hash = Hash.sha256Sha256(data);
    const hash4 = hash.slice(0, 4);

    if (!cmp(csum, hash4)) {
      throw new Error('Checksum mismatch');
    }

    return data;
  }

  static encode(buf) {
    if (!Buffer.isBuffer(buf)) {
      throw new Error('Input must be a buffer');
    }

    const checkedBuf = Buffer.alloc(buf.length + 4);
    const hash = Hash.sha256Sha256(buf);
    buf.copy(checkedBuf);
    hash.copy(checkedBuf, buf.length);
    return Base58.encode(checkedBuf);
  }

  fromBuffer(buf) {
    this.buf = buf;
    return this;
  }

  fromString(str) {
    const buf = Base58Check.decode(str);
    this.buf = buf;
    return this;
  }

  toBuffer() {
    return this.buf;
  }

  toString() {
    return Base58Check.encode(this.buf);
  }

}

class Config {
  constructor(values) {
    this.keyDefined = key => key in values;

    this.getValue = key => values[key];
  }

  get(key) {
    if (this.keyDefined(key)) {
      return this.getValue(key);
    } else {
      throw new Error(`Unknown configuration: ${key}`);
    }
  }

}

class ConfigBuilder {
  constructor() {
    this.variables = {};
  }

  build() {
    return new Config(this.variables);
  }

  addValue(key, value) {
    if (value === undefined) {
      throw new Error(`Failed to add "${key}" property. The value cannot be undefined`);
    }

    if (key in this.variables) {
      throw new Error(`"${key}" already has a value defined.`);
    }

    this.variables[key] = value;
    return this;
  }

  addValueWithDefault(key, value, defaultValue) {
    if (defaultValue === undefined) {
      throw new Error(`Failed to add "${key}" property. Default value cannot be undefined`);
    }

    return this.addValue(key, value === undefined ? defaultValue : value);
  }

}

const config = new ConfigBuilder().addValue('NETWORK', process.env.NETWORK || 'mainnet').build();

/**
 * Constants
 * =========
 *
 * Constants used to distinguish mainnet from testnet.
 */
const Constants = {};
Constants.Mainnet = {
  MaxSize: 0x02000000,
  // MAX_SIZE
  Port: 8333,
  Address: {
    pubKeyHash: 0x00,
    payToScriptHash: 0x05
  },
  Bip32: {
    pubKey: 0x0488b21e,
    privKey: 0x0488ade4
  },
  Block: {
    maxNBits: 0x1d00ffff,
    magicNum: 0xe3e1f3e8
  },
  Msg: {
    magicNum: 0xe3e1f3e8,
    versionBytesNum: 70015 // as of Bitcoin SV v1.0.5

  },
  PrivKey: {
    versionByteNum: 0x80
  },
  TxBuilder: {
    dust: 546,
    // number of satoshis that an output can't be less than
    feePerKbNum: 0.00000500e8
  },
  Workers: {
    // Cannot be 5 seconds. This is actually too low for low end devices. We
    // have found by experimenting with Chrome developer tools that 60 seconds
    // works on low end mobile.
    timeout: 60000
  }
};
Constants.Testnet = Object.assign({}, Constants.Mainnet, {
  Port: 18333,
  Address: {
    pubKeyHash: 0x6f,
    payToScriptHash: 0xc4
  },
  Bip32: {
    pubKey: 0x043587cf,
    privKey: 0x04358394
  },
  Block: {
    maxNBits: 0x1d00ffff,
    magicNum: 0xf4e5f3f4
  },
  Msg: {
    magicNum: 0xf4e5f3f4,
    versionBytesNum: 70015 // as of Bitcoin SV v1.0.5

  },
  PrivKey: {
    versionByteNum: 0xef
  }
});
Constants.Regtest = Object.assign({}, Constants.Mainnet, {
  Port: 18444,
  Address: {
    pubKeyHash: 0x6f,
    payToScriptHash: 0xc4
  },
  Bip32: {
    pubKey: 0x043587cf,
    privKey: 0x04358394
  },
  Block: {
    maxNBits: 0x207fffff,
    magicNum: 0xdab5bffa
  },
  Msg: {
    magicNum: 0xdab5bffa,
    versionBytesNum: 70015 // as of Bitcoin SV v1.0.5

  },
  PrivKey: {
    versionByteNum: 0xef
  }
});
Constants.STN = Object.assign({}, Constants.Mainnet, {
  Port: 9333,
  Address: {
    pubKeyHash: 0x6f,
    payToScriptHash: 0xc4
  },
  Bip32: {
    pubKey: 0x043587cf,
    privKey: 0x04358394
  },
  Block: {
    maxNBits: 0x1d00ffff,
    magicNum: 0xfbcec4f9
  },
  Msg: {
    magicNum: 0xfbcec4f9,
    versionBytesNum: 70015 // as of Bitcoin SV v1.0.5

  },
  PrivKey: {
    versionByteNum: 0xef
  }
});
/**
 * Yours Bitcoin can be globally configured to mainnet or testnet. Via the
 * inject pattern, you always have access to the other network at any time.
 * However, it is very convenient to be able to change the default
 * configuration. The default is mainnet, which can be changed to testnet.
 */
// Constants.Default = Object.assign({}, Constants.Mainnet)

if (config.get('NETWORK') === 'testnet') {
  Constants.Default = Object.assign({}, Constants.Testnet);
} else if (config.get('NETWORK') === 'mainnet') {
  Constants.Default = Object.assign({}, Constants.Mainnet);
} else if (config.get('NETWORK') === 'regtest') {
  Constants.Default = Object.assign({}, Constants.Regtest);
} else if (config.get('NETWORK') === 'stn') {
  Constants.Default = Object.assign({}, Constants.STN);
} else {
  throw new Error(`must set network in environment variable - mainnet, testnet, regtest or stn?, received ${config.get('NETWORK')}`);
}

const getConstants = magicNum => {
  if (Constants.Mainnet.Msg.magicNum === magicNum) {
    return Constants.Mainnet;
  } else if (Constants.Testnet.Msg.magicNum === magicNum) {
    return Constants.Testnet;
  } else if (Constants.Regtest.Msg.magicNum === magicNum) {
    return Constants.Regtest;
  } else if (Constants.STN.Msg.magicNum === magicNum) {
    return Constants.STN;
  } else {
    return Constants.Default;
  }
};

/*
 * OpCode
 * ======
 *
 * An opCode is one of the operations in the bitcoin scripting language. Each
 * operation is just a number from 0-255, and it has a corresponding string,
 * e.g. "OP_RETURN", which comes from the name of that constant in the bitcoind
 * source code. The way you probably want to use this is with
 * new OpCode(str).toNumber() or new OpCode(num).toString()
 */
const map = {
  // push value
  OP_FALSE: 0x00,
  OP_0: 0x00,
  OP_PUSHDATA1: 0x4c,
  OP_PUSHDATA2: 0x4d,
  OP_PUSHDATA4: 0x4e,
  OP_1NEGATE: 0x4f,
  OP_RESERVED: 0x50,
  OP_TRUE: 0x51,
  OP_1: 0x51,
  OP_2: 0x52,
  OP_3: 0x53,
  OP_4: 0x54,
  OP_5: 0x55,
  OP_6: 0x56,
  OP_7: 0x57,
  OP_8: 0x58,
  OP_9: 0x59,
  OP_10: 0x5a,
  OP_11: 0x5b,
  OP_12: 0x5c,
  OP_13: 0x5d,
  OP_14: 0x5e,
  OP_15: 0x5f,
  OP_16: 0x60,
  // control
  OP_NOP: 0x61,
  OP_VER: 0x62,
  OP_IF: 0x63,
  OP_NOTIF: 0x64,
  OP_VERIF: 0x65,
  OP_VERNOTIF: 0x66,
  OP_ELSE: 0x67,
  OP_ENDIF: 0x68,
  OP_VERIFY: 0x69,
  OP_RETURN: 0x6a,
  // stack ops
  OP_TOALTSTACK: 0x6b,
  OP_FROMALTSTACK: 0x6c,
  OP_2DROP: 0x6d,
  OP_2DUP: 0x6e,
  OP_3DUP: 0x6f,
  OP_2OVER: 0x70,
  OP_2ROT: 0x71,
  OP_2SWAP: 0x72,
  OP_IFDUP: 0x73,
  OP_DEPTH: 0x74,
  OP_DROP: 0x75,
  OP_DUP: 0x76,
  OP_NIP: 0x77,
  OP_OVER: 0x78,
  OP_PICK: 0x79,
  OP_ROLL: 0x7a,
  OP_ROT: 0x7b,
  OP_SWAP: 0x7c,
  OP_TUCK: 0x7d,
  // data manipulation ops
  OP_CAT: 0x7e,
  OP_SUBSTR: 0x7f,
  // Replaced in BSV
  OP_SPLIT: 0x7f,
  OP_LEFT: 0x80,
  // Replaced in BSV
  OP_NUM2BIN: 0x80,
  OP_RIGHT: 0x81,
  // Replaced in BSV
  OP_BIN2NUM: 0x81,
  OP_SIZE: 0x82,
  // bit logic
  OP_INVERT: 0x83,
  OP_AND: 0x84,
  OP_OR: 0x85,
  OP_XOR: 0x86,
  OP_EQUAL: 0x87,
  OP_EQUALVERIFY: 0x88,
  OP_RESERVED1: 0x89,
  OP_RESERVED2: 0x8a,
  // numeric
  OP_1ADD: 0x8b,
  OP_1SUB: 0x8c,
  OP_2MUL: 0x8d,
  OP_2DIV: 0x8e,
  OP_NEGATE: 0x8f,
  OP_ABS: 0x90,
  OP_NOT: 0x91,
  OP_0NOTEQUAL: 0x92,
  OP_ADD: 0x93,
  OP_SUB: 0x94,
  OP_MUL: 0x95,
  OP_DIV: 0x96,
  OP_MOD: 0x97,
  OP_LSHIFT: 0x98,
  OP_RSHIFT: 0x99,
  OP_BOOLAND: 0x9a,
  OP_BOOLOR: 0x9b,
  OP_NUMEQUAL: 0x9c,
  OP_NUMEQUALVERIFY: 0x9d,
  OP_NUMNOTEQUAL: 0x9e,
  OP_LESSTHAN: 0x9f,
  OP_GREATERTHAN: 0xa0,
  OP_LESSTHANOREQUAL: 0xa1,
  OP_GREATERTHANOREQUAL: 0xa2,
  OP_MIN: 0xa3,
  OP_MAX: 0xa4,
  OP_WITHIN: 0xa5,
  // crypto
  OP_RIPEMD160: 0xa6,
  OP_SHA1: 0xa7,
  OP_SHA256: 0xa8,
  OP_HASH160: 0xa9,
  OP_HASH256: 0xaa,
  OP_CODESEPARATOR: 0xab,
  OP_CHECKSIG: 0xac,
  OP_CHECKSIGVERIFY: 0xad,
  OP_CHECKMULTISIG: 0xae,
  OP_CHECKMULTISIGVERIFY: 0xaf,
  // expansion
  OP_NOP1: 0xb0,
  OP_NOP2: 0xb1,
  OP_CHECKLOCKTIMEVERIFY: 0xb1,
  OP_NOP3: 0xb2,
  OP_CHECKSEQUENCEVERIFY: 0xb2,
  OP_NOP4: 0xb3,
  OP_NOP5: 0xb4,
  OP_NOP6: 0xb5,
  OP_NOP7: 0xb6,
  OP_NOP8: 0xb7,
  OP_NOP9: 0xb8,
  OP_NOP10: 0xb9,
  // template matching params
  OP_SMALLDATA: 0xf9,
  OP_SMALLINTEGER: 0xfa,
  OP_PUBKEYS: 0xfb,
  OP_PUBKEYHASH: 0xfd,
  OP_PUBKEY: 0xfe,
  OP_INVALIDOPCODE: 0xff
};

class OpCode extends Struct {
  constructor(num) {
    super({
      num
    });
  }

  fromNumber(num) {
    this.num = num;
    return this;
  }

  static fromNumber(num) {
    return new this().fromNumber(num);
  }

  toNumber() {
    return this.num;
  }

  fromString(str) {
    const num = map[str];

    if (num === undefined) {
      throw new Error('Invalid opCodeStr');
    }

    this.num = num;
    return this;
  }

  static fromString(str) {
    return new this().fromString(str);
  }

  toString() {
    const str = OpCode.str[this.num];

    if (str === undefined) {
      if (this.num > 0 && this.num < OpCode.OP_PUSHDATA1) {
        return this.num.toString();
      }

      throw new Error('OpCode does not have a string representation');
    }

    return str;
  }

}

OpCode.str = {};

for (const opCodeStr in map) {
  OpCode[opCodeStr] = map[opCodeStr];

  if (Object.prototype.hasOwnProperty.call(map, opCodeStr)) {
    OpCode.str[map[opCodeStr]] = opCodeStr;
  }
}

/**
 * Point (on secp256k1)
 * ====================
 *
 * A point is a point on the secp256k1 curve which is the elliptic curve used
 * by bitcoin. This code is a wrapper for Fedor Indutny's Point class from his
 * elliptic library. This code adds a few minor conveniences, but is mostly the
 * same. Since Fedor's code returns points and big numbers that are instances
 * of his point and big number classes, we have to wrap all the methods such as
 * getX() to return the Yours Bitcoin point and big number types.
 */
const ec = elliptic.curves.secp256k1;

const _point = ec.curve.point();

const _Point = _point.constructor;

class Point extends _Point {
  constructor(x, y, isRed) {
    super(ec.curve, x, y, isRed);
  }

  static fromX(isOdd, x) {
    const _point = ec.curve.pointFromX(x, isOdd);

    const point = Object.create(Point.prototype);
    return point.copyFrom(_point);
  }

  copyFrom(point) {
    if (!(point instanceof _Point)) {
      throw new Error('point should be an external point');
    }

    Object.keys(point).forEach(function (key) {
      this[key] = point[key];
    }.bind(this));
    return this;
  }

  add(p) {
    p = _Point.prototype.add.call(this, p);
    const point = Object.create(Point.prototype);
    return point.copyFrom(p);
  }

  mul(bn) {
    if (!bn.lt(Point.getN())) {
      throw new Error('point mul out of range');
    }

    const p = _Point.prototype.mul.call(this, bn);

    const point = Object.create(Point.prototype);
    return point.copyFrom(p);
  }

  mulAdd(bn1, point, bn2) {
    const p = _Point.prototype.mulAdd.call(this, bn1, point, bn2);

    point = Object.create(Point.prototype);
    return point.copyFrom(p);
  }

  getX() {
    const _x = _Point.prototype.getX.call(this);

    const x = Object.create(Bn.prototype);

    _x.copy(x);

    return x;
  }

  getY() {
    const _y = _Point.prototype.getY.call(this);

    const y = Object.create(Bn.prototype);

    _y.copy(y);

    return y;
  }

  fromX(isOdd, x) {
    const point = Point.fromX(isOdd, x);
    return this.copyFrom(point);
  }

  toJSON() {
    return {
      x: this.getX().toString(),
      y: this.getY().toString()
    };
  }

  fromJSON(json) {
    const x = new Bn().fromString(json.x);
    const y = new Bn().fromString(json.y);
    const point = new Point(x, y);
    return this.copyFrom(point);
  }

  toString() {
    return JSON.stringify(this.toJSON());
  }

  fromString(str) {
    const json = JSON.parse(str);
    const p = new Point().fromJSON(json);
    return this.copyFrom(p);
  }

  static getG() {
    const _g = ec.curve.g;
    const g = Object.create(Point.prototype);
    return g.copyFrom(_g);
  }

  static getN() {
    return new Bn(ec.curve.n.toArray());
  } // https://www.iacr.org/archive/pkc2003/25670211/25670211.pdf


  validate() {
    const p2 = Point.fromX(this.getY().isOdd(), this.getX());

    if (!(p2.getY().cmp(this.getY()) === 0)) {
      throw new Error('Invalid y value of public key');
    }

    if (!(this.getX().gt(-1) && this.getX().lt(Point.getN())) || !(this.getY().gt(-1) && this.getY().lt(Point.getN()))) {
      throw new Error('Point does not lie on the curve');
    }

    return this;
  }

}

/**
 * Public Key
 * ==========
 *
 * A public key corresponds to a private key. If you have a private key, you
 * can find the corresponding public key with new PubKey().fromPrivKey(privKey).
 */

class PubKey extends Struct {
  constructor(point, compressed) {
    super({
      point,
      compressed
    });
  }

  fromJSON(json) {
    this.fromFastHex(json);
    return this;
  }

  toJSON() {
    return this.toFastHex();
  }

  fromPrivKey(privKey) {
    this.fromObject({
      point: Point.getG().mul(privKey.bn),
      compressed: privKey.compressed
    });
    return this;
  }

  static fromPrivKey(privKey) {
    return new this().fromPrivKey(privKey);
  }

  async asyncFromPrivKey(privKey) {
    const workersResult = await Workers.asyncObjectMethod(this, 'fromPrivKey', [privKey]);
    return this.fromFastBuffer(workersResult.resbuf);
  }

  static asyncFromPrivKey(privKey) {
    return new this().asyncFromPrivKey(privKey);
  }

  fromBuffer(buf, strict) {
    return this.fromDer(buf, strict);
  }

  async asyncFromBuffer(buf, strict) {
    const args = [buf, strict];
    const workersResult = await Workers.asyncObjectMethod(this, 'fromBuffer', args);
    return this.fromFastBuffer(workersResult.resbuf);
  }

  fromFastBuffer(buf) {
    if (buf.length === 0) {
      return this;
    }

    const compressed = Boolean(buf[0]);
    buf = buf.slice(1);
    this.fromDer(buf);
    this.compressed = compressed;
    return this;
  }
  /**
     * In order to mimic the non-strict style of OpenSSL, set strict = false. For
     * information and what prefixes 0x06 and 0x07 mean, in addition to the normal
     * compressed and uncompressed public keys, see the message by Peter Wuille
     * where he discovered these "hybrid pubKeys" on the mailing list:
     * http://sourceforge.net/p/bitcoin/mailman/message/29416133/
     */


  fromDer(buf, strict) {
    if (strict === undefined) {
      strict = true;
    } else {
      strict = false;
    }

    if (buf[0] === 0x04 || !strict && (buf[0] === 0x06 || buf[0] === 0x07)) {
      const xbuf = buf.slice(1, 33);
      const ybuf = buf.slice(33, 65);

      if (xbuf.length !== 32 || ybuf.length !== 32 || buf.length !== 65) {
        throw new Error('LEngth of x and y must be 32 bytes');
      }

      const x = new Bn(xbuf);
      const y = new Bn(ybuf);
      this.point = new Point(x, y);
      this.compressed = false;
    } else if (buf[0] === 0x03) {
      const xbuf = buf.slice(1);
      const x = new Bn(xbuf);
      this.fromX(true, x);
      this.compressed = true;
    } else if (buf[0] === 0x02) {
      const xbuf = buf.slice(1);
      const x = new Bn(xbuf);
      this.fromX(false, x);
      this.compressed = true;
    } else {
      throw new Error('Invalid DER format pubKey');
    }

    return this;
  }

  static fromDer(buf, strict) {
    return new this().fromDer(buf, strict);
  }

  fromString(str) {
    this.fromDer(Buffer.from(str, 'hex'));
    return this;
  }

  fromX(odd, x) {
    if (typeof odd !== 'boolean') {
      throw new Error('Must specify whether y is odd or not (true or false)');
    }

    this.point = Point.fromX(odd, x);
    return this;
  }

  static fromX(odd, x) {
    return new this().fromX(odd, x);
  }

  toBuffer() {
    const compressed = this.compressed === undefined ? true : this.compressed;
    return this.toDer(compressed);
  }

  toFastBuffer() {
    if (!this.point) {
      return Buffer.alloc(0);
    }

    const bw = new Bw();
    const compressed = this.compressed === undefined ? true : Boolean(this.compressed);
    bw.writeUInt8(Number(compressed));
    bw.write(this.toDer(false));
    return bw.toBuffer();
  }

  toDer(compressed) {
    compressed = compressed === undefined ? this.compressed : compressed;

    if (typeof compressed !== 'boolean') {
      throw new Error('Must specify whether the public key is compressed or not (true or false)');
    }

    const x = this.point.getX();
    const y = this.point.getY();
    const xbuf = x.toBuffer({
      size: 32
    });
    const ybuf = y.toBuffer({
      size: 32
    });
    let prefix;

    if (!compressed) {
      prefix = Buffer.from([0x04]);
      return Buffer.concat([prefix, xbuf, ybuf]);
    } else {
      const odd = ybuf[ybuf.length - 1] % 2;

      if (odd) {
        prefix = Buffer.from([0x03]);
      } else {
        prefix = Buffer.from([0x02]);
      }

      return Buffer.concat([prefix, xbuf]);
    }
  }

  toString() {
    const compressed = this.compressed === undefined ? true : this.compressed;
    return this.toDer(compressed).toString('hex');
  }
  /**
     * Translated from bitcoind's IsCompressedOrUncompressedPubKey
     */


  static isCompressedOrUncompressed(buf) {
    if (buf.length < 33) {
      //  Non-canonical public key: too short
      return false;
    }

    if (buf[0] === 0x04) {
      if (buf.length !== 65) {
        //  Non-canonical public key: invalid length for uncompressed key
        return false;
      }
    } else if (buf[0] === 0x02 || buf[0] === 0x03) {
      if (buf.length !== 33) {
        //  Non-canonical public key: invalid length for compressed key
        return false;
      }
    } else {
      //  Non-canonical public key: neither compressed nor uncompressed
      return false;
    }

    return true;
  } // https://www.iacr.org/archive/pkc2003/25670211/25670211.pdf


  validate() {
    if (this.point.isInfinity()) {
      throw new Error('point: Point cannot be equal to Infinity');
    }

    if (this.point.eq(new Point(new Bn(0), new Bn(0)))) {
      throw new Error('point: Point cannot be equal to 0, 0');
    }

    this.point.validate();
    return this;
  }

}

/**
 * Random Number Generator
 * =======================
 *
 * Random numbers are important in bitcoin primarily for generating private
 * keys. It is also important for creating signatures if you are using a random
 * value of k, but Yours Bitcoin defaults to using deterministic k. That means
 * computing a random private key, or a random seed for use in Bip39 or Bip32,
 * is the primary use of the random number generator.  Note that the simplicity
 * of this class is extremely carefully considered. It is easy to audit that
 * this code runs node's randomBytes function. It is also easy to audit that
 * the randomBytes method is correctly interpreted as
 * window.crypto.getRandomValues when this code is browserified by browserify,
 * and thus also works correctly in the browser. We deliberately do not do
 * anything else to this random number in order to minimize possible errors in
 * this absolutely critical code.
 */

class Random {}

Random.getRandomBuffer = function (size) {
  return randomBytes(size);
};

/**
 * Private Key
 * ===========
 *
 * A private key is used for signing transactions (or messages). The primary
 * way to use this is new PrivKey().fromRandom(), or new PrivKey().fromBuffer(buf).
 */

class PrivKey extends Struct {
  constructor(bn, compressed, constants = null) {
    super({
      bn,
      compressed
    });
    constants = constants || Constants.Default.PrivKey;
    this.Constants = constants;
  }

  fromJSON(json) {
    this.fromHex(json);
    return this;
  }

  toJSON() {
    return this.toHex();
  }

  fromRandom() {
    let privBuf, bn, condition;

    do {
      privBuf = Random.getRandomBuffer(32);
      bn = new Bn().fromBuffer(privBuf);
      condition = bn.lt(Point.getN());
    } while (!condition);

    this.fromObject({
      bn: bn,
      compressed: true
    });
    return this;
  }

  static fromRandom() {
    return new this().fromRandom();
  }

  toBuffer() {
    let compressed = this.compressed;

    if (compressed === undefined) {
      compressed = true;
    }

    const privBuf = this.bn.toBuffer({
      size: 32
    });
    let buf;

    if (compressed) {
      buf = Buffer.concat([Buffer.from([this.Constants.versionByteNum]), privBuf, Buffer.from([0x01])]);
    } else {
      buf = Buffer.concat([Buffer.from([this.Constants.versionByteNum]), privBuf]);
    }

    return buf;
  }

  fromBuffer(buf) {
    if (buf.length === 1 + 32 + 1 && buf[1 + 32 + 1 - 1] === 1) {
      this.compressed = true;
    } else if (buf.length === 1 + 32) {
      this.compressed = false;
    } else {
      throw new Error('Length of privKey buffer must be 33 (uncompressed pubKey) or 34 (compressed pubKey)');
    }

    if (buf[0] !== this.Constants.versionByteNum) {
      throw new Error('Invalid versionByteNum byte');
    }

    return this.fromBn(new Bn().fromBuffer(buf.slice(1, 1 + 32)));
  }

  toBn() {
    return this.bn;
  }

  fromBn(bn) {
    this.bn = bn;
    return this;
  }

  static fromBn(bn) {
    return new this().fromBn(bn);
  }

  validate() {
    if (!this.bn.lt(Point.getN())) {
      throw new Error('Number must be less than N');
    }

    if (typeof this.compressed !== 'boolean') {
      throw new Error('Must specify whether the corresponding public key is compressed or not (true or false)');
    }

    return this;
  }
  /**
     * Output the private key a Wallet Import Format (Wif) string.
     */


  toWif() {
    return Base58Check.encode(this.toBuffer());
  }
  /**
     * Input the private key from a Wallet Import Format (Wif) string.
     */


  fromWif(str) {
    return this.fromBuffer(Base58Check.decode(str));
  }

  static fromWif(str) {
    return new this().fromWif(str);
  }

  toString() {
    return this.toWif();
  }

  fromString(str) {
    return this.fromWif(str);
  }

}

PrivKey.Mainnet = class extends PrivKey {
  constructor(bn, compressed) {
    super(bn, compressed, Constants.Mainnet.PrivKey);
  }

};
PrivKey.Testnet = class extends PrivKey {
  constructor(bn, compressed) {
    super(bn, compressed, Constants.Testnet.PrivKey);
  }

};

/**
 * Signature
 * =========
 *
 * A signature is the thing you make when you want to sign a transaction, or
 * the thing you want to verify if you want to ensure that someone signed a
 * transaction. It has an r and s value, which are the cryptographic big
 * numbers that define a signature. And since this is a bitcoin library, it
 * also has nHashType, which is the way to hash a transaction and is used in
 * the binary format of a signature when it is in a transaction. We also
 * support a public key recover value, recovery, allowing one to compute the
 * public key from a signature. The "compressed" value is also necessary to
 * accurately compute the public key from a signature.
 *
 * There are a few different formats of a signature in bitcoin. One is DER, the
 * other is the TxFormat which is the same as DER but with the nHashType byte
 * appended, and the final one is Compact, which is used by Bitcoin Signed
 * Message (Bsm).
 */
/**
   * r, s: big numbers constiting a cryptographic signature
   * nHashType: found at the end of a signature in a transaction
   * recovery: public key recovery number
   * compressed: whether the recovered pubKey is compressed
   */

class Sig extends Struct {
  constructor(r, s, nHashType, recovery, compressed) {
    super({
      r,
      s,
      nHashType,
      recovery,
      compressed
    });
  }

  fromBuffer(buf) {
    try {
      return this.fromDer(buf, true);
    } catch (e) {}

    try {
      return this.fromCompact(buf);
    } catch (e) {}

    return this.fromTxFormat(buf);
  }

  toBuffer() {
    if (this.nHashType !== undefined) {
      return this.toTxFormat();
    } else if (this.recovery !== undefined) {
      return this.toCompact();
    }

    return this.toDer();
  } // The format used by "message"


  fromCompact(buf) {
    let compressed = true;
    let recovery = buf.slice(0, 1)[0] - 27 - 4;

    if (recovery < 0) {
      compressed = false;
      recovery = recovery + 4;
    }

    if (!(recovery === 0 || recovery === 1 || recovery === 2 || recovery === 3)) {
      throw new Error('i must be 0, 1, 2, or 3');
    }

    this.compressed = compressed;
    this.recovery = recovery;
    const rsbuf = buf.slice(1);
    this.fromRS(rsbuf);
    return this;
  }

  static fromCompact(buf) {
    return new this().fromCompact(buf);
  }

  fromRS(rsbuf) {
    const b2 = rsbuf.slice(0, 32);
    const b3 = rsbuf.slice(32, 64);

    if (b2.length !== 32) {
      throw new Error('r must be 32 bytes');
    }

    if (b3.length !== 32 || rsbuf.length > 64) {
      throw new Error('s must be 32 bytes');
    }

    this.r = new Bn().fromBuffer(b2);
    this.s = new Bn().fromBuffer(b3);
    return this;
  }

  static fromRS(rsbuf) {
    return new this().fromRS(rsbuf);
  } // The format used in a tx, except without the nHashType at the end


  fromDer(buf, strict) {
    const obj = Sig.parseDer(buf, strict);
    this.r = obj.r;
    this.s = obj.s;
    return this;
  }

  static fromDer(buf, strict) {
    return new this().fromDer(buf, strict);
  } // The format used in a tx


  fromTxFormat(buf) {
    if (buf.length === 0) {
      // allow setting a "blank" signature
      this.r = new Bn(1);
      this.s = new Bn(1);
      this.nHashType = 1;
      return this;
    }

    const nHashType = buf.readUInt8(buf.length - 1);
    const derbuf = buf.slice(0, buf.length - 1);
    this.fromDer(derbuf, false);
    this.nHashType = nHashType;
    return this;
  }

  static fromTxFormat(buf) {
    return new this().fromTxFormat(buf);
  }

  fromString(str) {
    return this.fromHex(str);
  }
  /**
     * In order to mimic the non-strict DER encoding of OpenSSL, set strict = false.
     */


  static parseDer(buf, strict) {
    if (strict === undefined) {
      strict = true;
    }

    if (!Buffer.isBuffer(buf)) {
      throw new Error('DER formatted signature should be a buffer');
    }

    const header = buf[0];

    if (header !== 0x30) {
      throw new Error('Header byte should be 0x30');
    }

    let length = buf[1];
    const buflength = buf.slice(2).length;

    if (strict && length !== buflength) {
      throw new Error('LEngth byte should length of what follows');
    } else {
      length = length < buflength ? length : buflength;
    }

    const rheader = buf[2 + 0];

    if (rheader !== 0x02) {
      throw new Error('Integer byte for r should be 0x02');
    }

    const rlength = buf[2 + 1];
    const rbuf = buf.slice(2 + 2, 2 + 2 + rlength);
    const r = new Bn().fromBuffer(rbuf);
    const rneg = buf[2 + 1 + 1] === 0x00;

    if (rlength !== rbuf.length) {
      throw new Error('LEngth of r incorrect');
    }

    const sheader = buf[2 + 2 + rlength + 0];

    if (sheader !== 0x02) {
      throw new Error('Integer byte for s should be 0x02');
    }

    const slength = buf[2 + 2 + rlength + 1];
    const sbuf = buf.slice(2 + 2 + rlength + 2, 2 + 2 + rlength + 2 + slength);
    const s = new Bn().fromBuffer(sbuf);
    const sneg = buf[2 + 2 + rlength + 2 + 2] === 0x00;

    if (slength !== sbuf.length) {
      throw new Error('LEngth of s incorrect');
    }

    const sumlength = 2 + 2 + rlength + 2 + slength;

    if (length !== sumlength - 2) {
      throw new Error('LEngth of signature incorrect');
    }

    const obj = {
      header: header,
      length: length,
      rheader: rheader,
      rlength: rlength,
      rneg: rneg,
      rbuf: rbuf,
      r: r,
      sheader: sheader,
      slength: slength,
      sneg: sneg,
      sbuf: sbuf,
      s: s
    };
    return obj;
  }
  /**
     * This function is translated from bitcoind's IsDERSignature and is used in
     * the script interpreter.  This "DER" format actually includes an extra byte,
     * the nHashType, at the end. It is really the tx format, not DER format.
     *
     * A canonical signature exists of: [30] [total len] [02] [len R] [R] [02] [len S] [S] [hashtype]
     * Where R and S are not negative (their first byte has its highest bit not set), and not
     * excessively padded (do not start with a 0 byte, unless an otherwise negative number follows,
     * in which case a single 0 byte is necessary and even required).
     *
     * See https://bitcointalk.org/index.php?topic=8392.msg127623#msg127623
     */


  static IsTxDer(buf) {
    if (buf.length < 9) {
      //  Non-canonical signature: too short
      return false;
    }

    if (buf.length > 73) {
      // Non-canonical signature: too long
      return false;
    }

    if (buf[0] !== 0x30) {
      //  Non-canonical signature: wrong type
      return false;
    }

    if (buf[1] !== buf.length - 3) {
      //  Non-canonical signature: wrong length marker
      return false;
    }

    const nLEnR = buf[3];

    if (5 + nLEnR >= buf.length) {
      //  Non-canonical signature: S length misplaced
      return false;
    }

    const nLEnS = buf[5 + nLEnR];

    if (nLEnR + nLEnS + 7 !== buf.length) {
      //  Non-canonical signature: R+S length mismatch
      return false;
    }

    const R = buf.slice(4);

    if (buf[4 - 2] !== 0x02) {
      //  Non-canonical signature: R value type mismatch
      return false;
    }

    if (nLEnR === 0) {
      //  Non-canonical signature: R length is zero
      return false;
    }

    if (R[0] & 0x80) {
      //  Non-canonical signature: R value negative
      return false;
    }

    if (nLEnR > 1 && R[0] === 0x00 && !(R[1] & 0x80)) {
      //  Non-canonical signature: R value excessively padded
      return false;
    }

    const S = buf.slice(6 + nLEnR);

    if (buf[6 + nLEnR - 2] !== 0x02) {
      //  Non-canonical signature: S value type mismatch
      return false;
    }

    if (nLEnS === 0) {
      //  Non-canonical signature: S length is zero
      return false;
    }

    if (S[0] & 0x80) {
      //  Non-canonical signature: S value negative
      return false;
    }

    if (nLEnS > 1 && S[0] === 0x00 && !(S[1] & 0x80)) {
      //  Non-canonical signature: S value excessively padded
      return false;
    }

    return true;
  }
  /**
     * Compares to bitcoind's IsLowDERSignature
     * See also Ecdsa signature algorithm which enforces this.
     * See also Bip 62, "low S values in signatures"
     */


  hasLowS() {
    if (this.s.lt(1) || this.s.gt(Bn.fromBuffer(Buffer.from('7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A0', 'hex')))) {
      return false;
    }

    return true;
  }
  /**
     * Ensures the nHashType is exactly equal to one of the standard options or combinations thereof.
     * Translated from bitcoind's IsDefinedHashtypeSignature
     */


  hasDefinedHashType() {
    if (this.nHashType < Sig.SIGHASH_ALL || this.nHashType > Sig.SIGHASH_SINGLE) {
      return false;
    }

    return true;
  }

  toCompact(recovery, compressed) {
    recovery = typeof recovery === 'number' ? recovery : this.recovery;
    compressed = typeof compressed === 'boolean' ? compressed : this.compressed;

    if (!(recovery === 0 || recovery === 1 || recovery === 2 || recovery === 3)) {
      throw new Error('recovery must be equal to 0, 1, 2, or 3');
    }

    let val = recovery + 27 + 4;

    if (compressed === false) {
      val = val - 4;
    }

    const b1 = Buffer.from([val]);
    const b2 = this.r.toBuffer({
      size: 32
    });
    const b3 = this.s.toBuffer({
      size: 32
    });
    return Buffer.concat([b1, b2, b3]);
  }

  toRS() {
    return Buffer.concat([this.r.toBuffer({
      size: 32
    }), this.s.toBuffer({
      size: 32
    })]);
  }

  toDer() {
    const rnbuf = this.r.toBuffer();
    const snbuf = this.s.toBuffer();
    const rneg = rnbuf[0] & 0x80;
    const sneg = snbuf[0] & 0x80;
    const rbuf = rneg ? Buffer.concat([Buffer.from([0x00]), rnbuf]) : rnbuf;
    const sbuf = sneg ? Buffer.concat([Buffer.from([0x00]), snbuf]) : snbuf;
    const length = 2 + rbuf.length + 2 + sbuf.length;
    const rlength = rbuf.length;
    const slength = sbuf.length;
    const rheader = 0x02;
    const sheader = 0x02;
    const header = 0x30;
    const der = Buffer.concat([Buffer.from([header, length, rheader, rlength]), rbuf, Buffer.from([sheader, slength]), sbuf]);
    return der;
  }

  toTxFormat() {
    const derbuf = this.toDer();
    const buf = Buffer.alloc(1);
    buf.writeUInt8(this.nHashType, 0);
    return Buffer.concat([derbuf, buf]);
  }

  toString() {
    return this.toHex();
  }

}

Sig.SIGHASH_ALL = 0x00000001;
Sig.SIGHASH_NONE = 0x00000002;
Sig.SIGHASH_SINGLE = 0x00000003;
Sig.SIGHASH_FORKID = 0x00000040;
Sig.SIGHASH_ANYONECANPAY = 0x00000080;

/*
 * Script
 * ======
 *
 * Script is the scripting language built into bitcoin. The Script class lets
 * you create an instance of a script, e.g. for a scriptSig or a scriptPubKey.
 * It understands both the binary format, as well as two different string
 * formats. The default string format, to/fromString, is a custom format only
 * used by Yours Bitcoin because it is isomorphic to the binary format (or as
 * isomorphic as it can be ... since OP_0 and OP_FALSE have the same byte
 * value, and so do OP_1 and OP_TRUE). The bitcoind string format is also
 * support, but that format is not isomorphic (i.e., if you pull in a string
 * and then write it again, you are likely to get back a different string, even
 * if you don't use OP_0, OP_FALSE, OP_1, or OP_TRUE).
 */

class Script extends Struct {
  constructor(chunks = []) {
    super({
      chunks
    });
  }

  fromJSON(json) {
    return this.fromString(json);
  }

  toJSON() {
    return this.toString();
  }

  fromBuffer(buf) {
    this.chunks = [];
    const br = new Br(buf);

    while (!br.eof()) {
      const opCodeNum = br.readUInt8();
      let len = 0;
      let buf = Buffer.from([]);

      if (opCodeNum > 0 && opCodeNum < OpCode.OP_PUSHDATA1) {
        len = opCodeNum;
        this.chunks.push({
          buf: br.read(len),
          len: len,
          opCodeNum: opCodeNum
        });
      } else if (opCodeNum === OpCode.OP_PUSHDATA1) {
        try {
          len = br.readUInt8();
          buf = br.read(len);
        } catch (err) {
          br.read();
        }

        this.chunks.push({
          buf: buf,
          len: len,
          opCodeNum: opCodeNum
        });
      } else if (opCodeNum === OpCode.OP_PUSHDATA2) {
        try {
          len = br.readUInt16LE();
          buf = br.read(len);
        } catch (err) {
          br.read();
        }

        this.chunks.push({
          buf: buf,
          len: len,
          opCodeNum: opCodeNum
        });
      } else if (opCodeNum === OpCode.OP_PUSHDATA4) {
        try {
          len = br.readUInt32LE();
          buf = br.read(len);
        } catch (err) {
          br.read();
        }

        this.chunks.push({
          buf: buf,
          len: len,
          opCodeNum: opCodeNum
        });
      } else {
        this.chunks.push({
          opCodeNum: opCodeNum
        });
      }
    }

    return this;
  }

  toBuffer() {
    const bw = new Bw();

    for (let i = 0; i < this.chunks.length; i++) {
      const chunk = this.chunks[i];
      const opCodeNum = chunk.opCodeNum;
      bw.writeUInt8(opCodeNum);

      if (chunk.buf) {
        if (opCodeNum < OpCode.OP_PUSHDATA1) {
          bw.write(chunk.buf);
        } else if (opCodeNum === OpCode.OP_PUSHDATA1) {
          bw.writeUInt8(chunk.len);
          bw.write(chunk.buf);
        } else if (opCodeNum === OpCode.OP_PUSHDATA2) {
          bw.writeUInt16LE(chunk.len);
          bw.write(chunk.buf);
        } else if (opCodeNum === OpCode.OP_PUSHDATA4) {
          bw.writeUInt32LE(chunk.len);
          bw.write(chunk.buf);
        }
      }
    }

    return bw.toBuffer();
  }

  fromString(str) {
    this.chunks = [];

    if (str === '' || str === undefined) {
      return this;
    }

    const tokens = str.split(' ');
    let i = 0;

    while (i < tokens.length) {
      const token = tokens[i];
      let opCodeNum;

      try {
        const opCode = new OpCode().fromString(token);
        opCodeNum = opCode.toNumber();
      } catch (err) {}

      if (opCodeNum === undefined) {
        opCodeNum = parseInt(token, 10);

        if (opCodeNum > 0 && opCodeNum < OpCode.OP_PUSHDATA1) {
          this.chunks.push({
            buf: Buffer.from(tokens[i + 1].slice(2), 'hex'),
            len: opCodeNum,
            opCodeNum: opCodeNum
          });
          i = i + 2;
        } else if (opCodeNum === 0) {
          this.chunks.push({
            opCodeNum: 0
          });
          i = i + 1;
        } else {
          throw new Error('Invalid script');
        }
      } else if (opCodeNum === OpCode.OP_PUSHDATA1 || opCodeNum === OpCode.OP_PUSHDATA2 || opCodeNum === OpCode.OP_PUSHDATA4) {
        if (tokens[i + 2].slice(0, 2) !== '0x') {
          throw new Error('Pushdata data must start with 0x');
        }

        this.chunks.push({
          buf: Buffer.from(tokens[i + 2].slice(2), 'hex'),
          len: parseInt(tokens[i + 1], 10),
          opCodeNum: opCodeNum
        });
        i = i + 3;
      } else {
        this.chunks.push({
          opCodeNum: opCodeNum
        });
        i = i + 1;
      }
    }

    return this;
  }

  toString() {
    let str = '';

    for (let i = 0; i < this.chunks.length; i++) {
      const chunk = this.chunks[i];
      const opCodeNum = chunk.opCodeNum;

      if (!chunk.buf) {
        if (OpCode.str[opCodeNum] !== undefined) {
          str = str + ' ' + new OpCode(opCodeNum).toString();
        } else {
          str = str + ' ' + '0x' + opCodeNum.toString(16);
        }
      } else {
        if (opCodeNum === OpCode.OP_PUSHDATA1 || opCodeNum === OpCode.OP_PUSHDATA2 || opCodeNum === OpCode.OP_PUSHDATA4) {
          str = str + ' ' + new OpCode(opCodeNum).toString();
        }

        str = str + ' ' + chunk.len;
        str = str + ' ' + '0x' + chunk.buf.toString('hex');
      }
    }

    return str.substr(1);
  }
  /**
     * Input the script from the script string format used in bitcoind data tests
     */


  fromBitcoindString(str) {
    const bw = new Bw();
    const tokens = str.split(' ');
    let i;

    for (i = 0; i < tokens.length; i++) {
      const token = tokens[i];

      if (token === '') {
        continue;
      }

      if (token[0] === '0' && token[1] === 'x') {
        const hex = token.slice(2);
        bw.write(Buffer.from(hex, 'hex'));
      } else if (token[0] === "'") {
        const tstr = token.slice(1, token.length - 1);
        const cbuf = Buffer.from(tstr);
        const tbuf = new Script().writeBuffer(cbuf).toBuffer();
        bw.write(tbuf);
      } else if (OpCode['OP_' + token] !== undefined) {
        const opstr = 'OP_' + token;
        const opCodeNum = OpCode[opstr];
        bw.writeUInt8(opCodeNum);
      } else if (typeof OpCode[token] === 'number') {
        const opstr = token;
        const opCodeNum = OpCode[opstr];
        bw.writeUInt8(opCodeNum);
      } else if (!isNaN(parseInt(token, 10))) {
        const bn = new Bn(token);
        const script = new Script().writeBn(bn);
        const tbuf = script.toBuffer();
        bw.write(tbuf);
      } else {
        throw new Error('Could not determine type of script value');
      }
    }

    const buf = bw.toBuffer();
    return this.fromBuffer(buf);
  }

  static fromBitcoindString(str) {
    return new this().fromBitcoindString(str);
  }
  /**
     * Output the script to the script string format used in bitcoind data tests.
     */


  toBitcoindString() {
    let str = '';

    for (let i = 0; i < this.chunks.length; i++) {
      const chunk = this.chunks[i];

      if (chunk.buf) {
        const buf = new Script([chunk]).toBuffer();
        const hex = buf.toString('hex');
        str = str + ' ' + '0x' + hex;
      } else if (OpCode.str[chunk.opCodeNum] !== undefined) {
        const ostr = new OpCode(chunk.opCodeNum).toString();
        str = str + ' ' + ostr.slice(3); // remove OP_
      } else {
        str = str + ' ' + '0x' + chunk.opCodeNum.toString(16);
      }
    }

    return str.substr(1);
  }
  /**
     * Input the script from the script string format used in bitcoind data tests
     */


  fromAsmString(str) {
    this.chunks = [];
    const tokens = str.split(' ');
    let i = 0;

    while (i < tokens.length) {
      const token = tokens[i];
      let opCode, opCodeNum;

      try {
        opCode = OpCode.fromString(token);
        opCodeNum = opCode.toNumber();
      } catch (err) {
        opCode = undefined;
        opCodeNum = undefined;
      } // we start with two special cases, 0 and -1, which are handled specially in
      // toASM. see _chunkToString.


      if (token === '0') {
        opCodeNum = 0;
        this.chunks.push({
          opCodeNum: opCodeNum
        });
        i = i + 1;
      } else if (token === '-1') {
        opCodeNum = OpCode.OP_1NEGATE;
        this.chunks.push({
          opCodeNum: opCodeNum
        });
        i = i + 1;
      } else if (opCode === undefined) {
        const hex = tokens[i];
        const buf = Buffer.from(hex, 'hex');

        if (buf.toString('hex') !== hex) {
          throw new Error('invalid hex string in script');
        }

        const len = buf.length;

        if (len >= 0 && len < OpCode.OP_PUSHDATA1) {
          opCodeNum = len;
        } else if (len < Math.pow(2, 8)) {
          opCodeNum = OpCode.OP_PUSHDATA1;
        } else if (len < Math.pow(2, 16)) {
          opCodeNum = OpCode.OP_PUSHDATA2;
        } else if (len < Math.pow(2, 32)) {
          opCodeNum = OpCode.OP_PUSHDATA4;
        }

        this.chunks.push({
          buf: buf,
          len: buf.length,
          opCodeNum: opCodeNum
        });
        i = i + 1;
      } else {
        this.chunks.push({
          opCodeNum: opCodeNum
        });
        i = i + 1;
      }
    }

    return this;
  }

  static fromAsmString(str) {
    return new this().fromAsmString(str);
  }
  /**
     * Output the script to the script string format used in bitcoind data tests.
     */


  toAsmString() {
    var str = '';

    for (var i = 0; i < this.chunks.length; i++) {
      var chunk = this.chunks[i];
      str += this._chunkToString(chunk);
    }

    return str.substr(1);
  }

  _chunkToString(chunk, type) {
    var opCodeNum = chunk.opCodeNum;
    var str = '';

    if (!chunk.buf) {
      // no data chunk
      if (typeof OpCode.str[opCodeNum] !== 'undefined') {
        // A few cases where the opcode name differs from reverseMap
        // aside from 1 to 16 data pushes.
        if (opCodeNum === 0) {
          // OP_0 -> 0
          str = str + ' 0';
        } else if (opCodeNum === 79) {
          // OP_1NEGATE -> 1
          str = str + ' -1';
        } else {
          str = str + ' ' + new OpCode(opCodeNum).toString();
        }
      } else {
        var numstr = opCodeNum.toString(16);

        if (numstr.length % 2 !== 0) {
          numstr = '0' + numstr;
        }

        str = str + ' ' + numstr;
      }
    } else {
      // data chunk
      if (chunk.len > 0) {
        str = str + ' ' + chunk.buf.toString('hex');
      }
    }

    return str;
  }

  fromOpReturnData(dataBuf) {
    this.writeOpCode(OpCode.OP_RETURN);
    this.writeBuffer(dataBuf);
    return this;
  }

  static fromOpReturnData(dataBuf) {
    return new this().fromOpReturnData(dataBuf);
  }

  fromSafeData(dataBuf) {
    this.writeOpCode(OpCode.OP_FALSE);
    this.writeOpCode(OpCode.OP_RETURN);
    this.writeBuffer(dataBuf);
    return this;
  }

  static fromSafeData(dataBuf) {
    return new this().fromSafeData(dataBuf);
  }

  fromSafeDataArray(dataBufs) {
    this.writeOpCode(OpCode.OP_FALSE);
    this.writeOpCode(OpCode.OP_RETURN);

    for (const i in dataBufs) {
      const dataBuf = dataBufs[i];
      this.writeBuffer(dataBuf);
    }

    return this;
  }

  static fromSafeDataArray(dataBufs) {
    return new this().fromSafeDataArray(dataBufs);
  }

  getData() {
    if (this.isSafeDataOut()) {
      const chunks = this.chunks.slice(2);
      const buffers = chunks.map(chunk => chunk.buf);
      return buffers;
    }

    if (this.isOpReturn()) {
      const chunks = this.chunks.slice(1);
      const buffers = chunks.map(chunk => chunk.buf);
      return buffers;
    }

    throw new Error('Unrecognized script type to get data from');
  }
  /**
     * Turn script into a standard pubKeyHash output script
     */


  fromPubKeyHash(hashBuf) {
    if (hashBuf.length !== 20) {
      throw new Error('hashBuf must be a 20 byte buffer');
    }

    this.writeOpCode(OpCode.OP_DUP);
    this.writeOpCode(OpCode.OP_HASH160);
    this.writeBuffer(hashBuf);
    this.writeOpCode(OpCode.OP_EQUALVERIFY);
    this.writeOpCode(OpCode.OP_CHECKSIG);
    return this;
  }

  static fromPubKeyHash(hashBuf) {
    return new this().fromPubKeyHash(hashBuf);
  }

  static sortPubKeys(pubKeys) {
    return pubKeys.slice().sort((pubKey1, pubKey2) => {
      const buf1 = pubKey1.toBuffer();
      const buf2 = pubKey2.toBuffer();
      const len = Math.max(buf1.length, buf2.length);

      for (let i = 0; i <= len; i++) {
        if (buf1[i] === undefined) {
          return -1; // shorter strings come first
        }

        if (buf2[i] === undefined) {
          return 1;
        }

        if (buf1[i] < buf2[i]) {
          return -1;
        }

        if (buf1[i] > buf2[i]) {
          return 1;
        } else {
          continue;
        }
      }
    });
  }
  /**
     * Generate a multisig output script from a list of public keys. sort
     * defaults to true. If sort is true, the pubKeys are sorted
     * lexicographically.
     */


  fromPubKeys(m, pubKeys, sort = true) {
    if (typeof m !== 'number') {
      throw new Error('m must be a number');
    }

    if (sort === true) {
      pubKeys = Script.sortPubKeys(pubKeys);
    }

    this.writeOpCode(m + OpCode.OP_1 - 1);

    for (const i in pubKeys) {
      this.writeBuffer(pubKeys[i].toBuffer());
    }

    this.writeOpCode(pubKeys.length + OpCode.OP_1 - 1);
    this.writeOpCode(OpCode.OP_CHECKMULTISIG);
    return this;
  }

  static fromPubKeys(m, pubKeys, sort) {
    return new this().fromPubKeys(m, pubKeys, sort);
  }

  removeCodeseparators() {
    const chunks = [];

    for (let i = 0; i < this.chunks.length; i++) {
      if (this.chunks[i].opCodeNum !== OpCode.OP_CODESEPARATOR) {
        chunks.push(this.chunks[i]);
      }
    }

    this.chunks = chunks;
    return this;
  }

  isPushOnly() {
    for (let i = 0; i < this.chunks.length; i++) {
      const chunk = this.chunks[i];
      const opCodeNum = chunk.opCodeNum;

      if (opCodeNum > OpCode.OP_16) {
        return false;
      }
    }

    return true;
  }

  isOpReturn() {
    if (this.chunks[0].opCodeNum === OpCode.OP_RETURN) {
      return true;
    } else {
      return false;
    }
  }

  isSafeDataOut() {
    if (this.chunks.length < 2) {
      return false;
    }

    if (this.chunks[0].opCodeNum !== OpCode.OP_FALSE) {
      return false;
    }

    var chunks = this.chunks.slice(1);
    var script2 = new Script(chunks);
    return script2.isOpReturn();
  }

  isPubKeyHashOut() {
    if (this.chunks[0] && this.chunks[0].opCodeNum === OpCode.OP_DUP && this.chunks[1] && this.chunks[1].opCodeNum === OpCode.OP_HASH160 && this.chunks[2].buf && this.chunks[3] && this.chunks[3].opCodeNum === OpCode.OP_EQUALVERIFY && this.chunks[4] && this.chunks[4].opCodeNum === OpCode.OP_CHECKSIG) {
      return true;
    } else {
      return false;
    }
  }
  /**
     * A pubKeyHash input should consist of two push operations. The first push
     * operation may be OP_0, which means the signature is missing, which is true
     * for some partially signed (and invalid) transactions.
     */


  isPubKeyHashIn() {
    if (this.chunks.length === 2 && (this.chunks[0].buf || this.chunks[0].opCodeNum === OpCode.OP_0) && (this.chunks[1].buf || this.chunks[0].opCodeNum === OpCode.OP_0)) {
      return true;
    } else {
      return false;
    }
  }

  isScriptHashOut() {
    const buf = this.toBuffer();
    return buf.length === 23 && buf[0] === OpCode.OP_HASH160 && buf[1] === 0x14 && buf[22] === OpCode.OP_EQUAL;
  }
  /**
     * Note that these are frequently indistinguishable from pubKeyHashin
     */


  isScriptHashIn() {
    if (!this.isPushOnly()) {
      return false;
    }

    try {
      new Script().fromBuffer(this.chunks[this.chunks.length - 1].buf);
    } catch (err) {
      return false;
    }

    return true;
  }

  isMultiSigOut() {
    const m = this.chunks[0].opCodeNum - OpCode.OP_1 + 1;

    if (!(m >= 1 && m <= 16)) {
      return false;
    }

    const pubKeychunks = this.chunks.slice(1, this.chunks.length - 2);

    if (!pubKeychunks.every(chunk => {
      try {
        const buf = chunk.buf;
        const pubKey = new PubKey().fromDer(buf);
        pubKey.validate();
        return true;
      } catch (err) {
        return false;
      }
    })) {
      return false;
    }

    const n = this.chunks[this.chunks.length - 2].opCodeNum - OpCode.OP_1 + 1;

    if (!(n >= m && n <= 16)) {
      return false;
    }

    if (this.chunks[1 + n + 1].opCodeNum !== OpCode.OP_CHECKMULTISIG) {
      return false;
    }

    return true;
  }

  isMultiSigIn() {
    if (this.chunks[0].opCodeNum !== OpCode.OP_0) {
      return false;
    }

    const remaining = this.chunks.slice(1);

    if (remaining.length < 1) {
      return false;
    }

    return remaining.every(chunk => Buffer.isBuffer(chunk.buf) && Sig.IsTxDer(chunk.buf));
  }
  /**
     * Analagous to bitcoind's FindAndDelete Find and deconste equivalent chunks,
     * typically used with push data chunks.  Note that this will find and deconste
     * not just the same data, but the same data with the same push data op as
     * produced by default. i.e., if a pushdata in a tx does not use the minimal
     * pushdata op, then when you try to remove the data it is pushing, it will not
     * be removed, because they do not use the same pushdata op.
     */


  findAndDelete(script) {
    const buf = script.toBuffer();

    for (let i = 0; i < this.chunks.length; i++) {
      const script2 = new Script([this.chunks[i]]);
      const buf2 = script2.toBuffer();

      if (cmp(buf, buf2)) {
        this.chunks.splice(i, 1);
      }
    }

    return this;
  }

  writeScript(script) {
    this.chunks = this.chunks.concat(script.chunks);
    return this;
  }

  static writeScript(script) {
    return new this().writeScript(script);
  }

  writeString(str) {
    const script = new Script().fromString(str);
    this.chunks = this.chunks.concat(script.chunks);
    return this;
  }

  static writeString(str) {
    return new this().writeString(str);
  }

  writeOpCode(opCodeNum) {
    this.chunks.push({
      opCodeNum
    });
    return this;
  }

  static writeOpCode(opCodeNum) {
    return new this().writeOpCode(opCodeNum);
  }

  setChunkOpCode(i, opCodeNum) {
    this.chunks[i] = {
      opCodeNum
    };
    return this;
  } // write a big number in the minimal way


  writeBn(bn) {
    if (bn.cmp(0) === OpCode.OP_0) {
      this.chunks.push({
        opCodeNum: OpCode.OP_0
      });
    } else if (bn.cmp(-1) === 0) {
      this.chunks.push({
        opCodeNum: OpCode.OP_1NEGATE
      });
    } else if (bn.cmp(1) >= 0 && bn.cmp(16) <= 0) {
      // see OP_1 - OP_16
      this.chunks.push({
        opCodeNum: bn.toNumber() + OpCode.OP_1 - 1
      });
    } else {
      const buf = bn.toSm({
        endian: 'little'
      });
      this.writeBuffer(buf);
    }

    return this;
  }

  static writeBn(bn) {
    return new this().writeBn(bn);
  }

  writeNumber(number) {
    this.writeBn(new Bn().fromNumber(number));
    return this;
  }

  static writeNumber(number) {
    return new this().writeNumber(number);
  }

  setChunkBn(i, bn) {
    this.chunks[i] = new Script().writeBn(bn).chunks[0];
    return this;
  } // note: this does not necessarily write buffers in the minimal way
  // to write numbers in the minimal way, see writeBn


  writeBuffer(buf) {
    let opCodeNum;
    const len = buf.length;

    if (buf.length > 0 && buf.length < OpCode.OP_PUSHDATA1) {
      opCodeNum = buf.length;
    } else if (buf.length === 0) {
      opCodeNum = OpCode.OP_0;
    } else if (buf.length < Math.pow(2, 8)) {
      opCodeNum = OpCode.OP_PUSHDATA1;
    } else if (buf.length < Math.pow(2, 16)) {
      opCodeNum = OpCode.OP_PUSHDATA2;
    } else if (buf.length < Math.pow(2, 32)) {
      opCodeNum = OpCode.OP_PUSHDATA4;
    } else {
      throw new Error("You can't push that much data");
    }

    this.chunks.push({
      buf: buf,
      len: len,
      opCodeNum: opCodeNum
    });
    return this;
  }

  static writeBuffer(buf) {
    return new this().writeBuffer(buf);
  }

  setChunkBuffer(i, buf) {
    this.chunks[i] = new Script().writeBuffer(buf).chunks[0];
    return this;
  } // make sure a push is the smallest way to push that particular data
  // comes from bitcoind's script interpreter CheckMinimalPush function


  checkMinimalPush(i) {
    const chunk = this.chunks[i];
    const buf = chunk.buf;
    const opCodeNum = chunk.opCodeNum;

    if (!buf) {
      return true;
    }

    if (buf.length === 0) {
      // Could have used OP_0.
      return opCodeNum === OpCode.OP_0;
    } else if (buf.length === 1 && buf[0] >= 1 && buf[0] <= 16) {
      // Could have used OP_1 .. OP_16.
      return opCodeNum === OpCode.OP_1 + (buf[0] - 1);
    } else if (buf.length === 1 && buf[0] === 0x81) {
      // Could have used OP_1NEGATE.
      return opCodeNum === OpCode.OP_1NEGATE;
    } else if (buf.length <= 75) {
      // Could have used a direct push (opCode indicating number of bytes pushed + those bytes).
      return opCodeNum === buf.length;
    } else if (buf.length <= 255) {
      // Could have used OP_PUSHDATA.
      return opCodeNum === OpCode.OP_PUSHDATA1;
    } else if (buf.length <= 65535) {
      // Could have used OP_PUSHDATA2.
      return opCodeNum === OpCode.OP_PUSHDATA2;
    }

    return true;
  }

}

/**
 * Bitcoin Address
 * ===============
 *
 * A bitcoin address. Normal use cases:
 * const address = new Address().fromPubKey(pubKey)
 * const address = new Address().fromString(string)
 * const string = address.toString()
 * const script = address.toTxOutScript()
 * const isValid = Address.isValid(string)
 *
 * Can also do testnet:
 * const address = Address.Testnet()
 *
 * Note that an Address and an Addr are two completely different things. An
 * Address is what you send bitcoin to. An Addr is an ip address and port that
 * you connect to over the internet.
 */

class Address extends Struct {
  constructor(versionByteNum, hashBuf, constants = null) {
    super({
      versionByteNum,
      hashBuf
    });
    constants = constants || Constants.Default.Address;
    this.Constants = constants;
  }

  fromBuffer(buf) {
    if (buf.length !== 1 + 20) {
      throw new Error('address buffers must be exactly 21 bytes');
    }

    if (buf[0] !== this.Constants.pubKeyHash) {
      throw new Error('address: invalid versionByteNum byte');
    }

    this.versionByteNum = buf[0];
    this.hashBuf = buf.slice(1);
    return this;
  }

  fromPubKeyHashBuf(hashBuf) {
    this.hashBuf = hashBuf;
    this.versionByteNum = this.Constants.pubKeyHash;
    return this;
  }

  static fromPubKeyHashBuf(hashBuf) {
    return new this().fromPubKeyHashBuf(hashBuf);
  }

  fromPubKey(pubKey) {
    const hashBuf = Hash.sha256Ripemd160(pubKey.toBuffer());
    return this.fromPubKeyHashBuf(hashBuf);
  }

  static fromPubKey(pubKey) {
    return new this().fromPubKey(pubKey);
  }

  async asyncFromPubKey(pubKey) {
    const args = [pubKey];
    const workersResult = await Workers.asyncObjectMethod(this, 'fromPubKey', args);
    return this.fromFastBuffer(workersResult.resbuf);
  }

  static asyncFromPubKey(pubKey) {
    return new this().asyncFromPubKey(pubKey);
  }

  fromPrivKey(privKey) {
    const pubKey = new PubKey().fromPrivKey(privKey);
    const hashBuf = Hash.sha256Ripemd160(pubKey.toBuffer());
    return this.fromPubKeyHashBuf(hashBuf);
  }

  static fromPrivKey(privKey) {
    return new this().fromPrivKey(privKey);
  }

  async asyncFromPrivKey(privKey) {
    const args = [privKey];
    const workersResult = await Workers.asyncObjectMethod(this, 'fromPrivKey', args);
    return this.fromFastBuffer(workersResult.resbuf);
  }

  static asyncFromPrivKey(privKey) {
    return new this().fromPrivKey(privKey);
  }

  fromRandom() {
    const randomPrivKey = new PrivKey().fromRandom();
    return this.fromPrivKey(randomPrivKey);
  }

  static fromRandom() {
    return new this().fromRandom();
  }

  async asyncFromRandom() {
    const args = [];
    const workersResult = await Workers.asyncObjectMethod(this, 'fromRandom', args);
    return this.fromFastBuffer(workersResult.resbuf);
  }

  static asyncFromRandom() {
    return new this().fromRandom();
  }

  fromString(str) {
    const buf = Base58Check.decode(str);
    return this.fromBuffer(buf);
  }

  async asyncFromString(str) {
    const args = [str];
    const workersResult = await Workers.asyncObjectMethod(this, 'fromString', args);
    return this.fromFastBuffer(workersResult.resbuf);
  }

  static asyncFromString(str) {
    return new this().asyncFromString(str);
  }

  static isValid(addrstr) {
    let address;

    try {
      address = new Address().fromString(addrstr);
    } catch (e) {
      return false;
    }

    return address.isValid();
  }

  isValid() {
    try {
      this.validate();
      return true;
    } catch (e) {
      return false;
    }
  }

  toTxOutScript() {
    const script = new Script();
    script.writeOpCode(OpCode.OP_DUP);
    script.writeOpCode(OpCode.OP_HASH160);
    script.writeBuffer(this.hashBuf);
    script.writeOpCode(OpCode.OP_EQUALVERIFY);
    script.writeOpCode(OpCode.OP_CHECKSIG);
    return script;
  }

  fromTxInScript(script) {
    const pubKeyHashBuf = Hash.sha256Ripemd160(script.chunks[1].buf || Buffer.from('00'.repeat(32), 'hex'));
    return this.fromPubKeyHashBuf(pubKeyHashBuf);
  }

  static fromTxInScript(script) {
    return new this().fromTxInScript(script);
  }

  fromTxOutScript(script) {
    return this.fromPubKeyHashBuf(script.chunks[2].buf);
  }

  static fromTxOutScript(script) {
    return new this().fromTxOutScript(script);
  }

  toBuffer() {
    const versionByteBuf = Buffer.from([this.versionByteNum]);
    const buf = Buffer.concat([versionByteBuf, this.hashBuf]);
    return buf;
  }

  toJSON() {
    const json = {};

    if (this.hashBuf) {
      json.hashBuf = this.hashBuf.toString('hex');
    }

    if (typeof this.versionByteNum !== 'undefined') {
      json.versionByteNum = this.versionByteNum;
    }

    return json;
  }

  fromJSON(json) {
    if (json.hashBuf) {
      this.hashBuf = Buffer.from(json.hashBuf, 'hex');
    }

    if (typeof json.versionByteNum !== 'undefined') {
      this.versionByteNum = json.versionByteNum;
    }

    return this;
  }

  toString() {
    return Base58Check.encode(this.toBuffer());
  }

  async asyncToString() {
    const args = [];
    const workersResult = await Workers.asyncObjectMethod(this, 'toString', args);
    return JSON.parse(workersResult.resbuf.toString());
  }

  validate() {
    if (!Buffer.isBuffer(this.hashBuf) || this.hashBuf.length !== 20) {
      throw new Error('hashBuf must be a buffer of 20 bytes');
    }

    if (this.versionByteNum !== this.Constants.pubKeyHash) {
      throw new Error('invalid versionByteNum');
    }

    return this;
  }

}

Address.Mainnet = class extends Address {
  constructor(versionByteNum, hashBuf) {
    super(versionByteNum, hashBuf, Constants.Mainnet.Address);
  }

};
Address.Testnet = class extends Address {
  constructor(versionByteNum, hashBuf) {
    super(versionByteNum, hashBuf, Constants.Testnet.Address);
  }

};

/**
 * Bip32: HD Wallets
 * =================
 *
 * Bip32 is hierarchical deterministic wallets. The standard way to use this is:
 * const bip32 = new Bip32().fromRandom()
 * const bip32 = new Bip32().fromSeed(buf)
 * const bip32 = new Bip32().fromString(string)
 * const xprv = bip32.toString()
 * const xpub = bip32.toPublic().toString()
 *
 * This code was originally copied from here:
 *
 * https://github.com/sarchar/brainwallet.github.com
 *
 * It has faced mostly cosmetic alterations since it was copied.
 */

class Bip32 extends Struct {
  constructor(versionBytesNum, depth, parentFingerPrint, childIndex, chainCode, privKey, pubKey, constants = null, PrivKey$1 = PrivKey) {
    super({
      versionBytesNum,
      depth,
      parentFingerPrint,
      childIndex,
      chainCode,
      privKey,
      pubKey
    });
    constants = constants || Constants.Default.Bip32;
    this.Constants = constants;
    this.PrivKey = PrivKey$1;
  }

  fromRandom() {
    this.versionBytesNum = this.Constants.privKey;
    this.depth = 0x00;
    this.parentFingerPrint = Buffer.from([0, 0, 0, 0]);
    this.childIndex = 0;
    this.chainCode = Random.getRandomBuffer(32);
    this.privKey = new this.PrivKey().fromRandom();
    this.pubKey = new PubKey().fromPrivKey(this.privKey);
    return this;
  }

  static fromRandom() {
    return new this().fromRandom();
  }

  fromString(str) {
    return this.fromBuffer(Base58Check.decode(str));
  }
  /**
   * Use workers to convert a bip32 string into a bip32 object without
   * blocking.
   */


  async asyncFromString(str) {
    const args = [str];
    const workersResult = await Workers.asyncObjectMethod(this, 'fromString', args);
    return this.fromFastBuffer(workersResult.resbuf);
  }

  fromSeed(bytes) {
    if (!Buffer.isBuffer(bytes)) {
      throw new Error('bytes must be a buffer');
    }

    if (bytes.length < 128 / 8) {
      throw new Error('Need more than 128 bits of entropy');
    }

    if (bytes.length > 512 / 8) {
      throw new Error('More than 512 bits of entropy is nonstandard');
    }

    const hash = Hash.sha512Hmac(bytes, Buffer.from('Bitcoin seed'));
    this.depth = 0x00;
    this.parentFingerPrint = Buffer.from([0, 0, 0, 0]);
    this.childIndex = 0;
    this.chainCode = hash.slice(32, 64);
    this.versionBytesNum = this.Constants.privKey;
    this.privKey = new this.PrivKey().fromBn(Bn().fromBuffer(hash.slice(0, 32)));
    this.pubKey = new PubKey().fromPrivKey(this.privKey);
    return this;
  }

  static fromSeed(bytes) {
    return new this().fromSeed(bytes);
  }

  async asyncFromSeed(bytes) {
    const workersResult = await Workers.asyncObjectMethod(this, 'fromSeed', [bytes]);
    return this.fromFastBuffer(workersResult.resbuf);
  }

  static asyncFromSeed(bytes) {
    return new this().asyncFromSeed(bytes);
  }

  fromBuffer(buf) {
    // Both pub and private extended keys are 78 buf
    if (buf.length !== 78) {
      throw new Error('incorrect bip32 data length');
    }

    this.versionBytesNum = buf.slice(0, 4).readUInt32BE(0);
    this.depth = buf.slice(4, 5).readUInt8(0);
    this.parentFingerPrint = buf.slice(5, 9);
    this.childIndex = buf.slice(9, 13).readUInt32BE(0);
    this.chainCode = buf.slice(13, 45);
    const keyBytes = buf.slice(45, 78);
    const isPrivate = this.versionBytesNum === this.Constants.privKey;
    const isPublic = this.versionBytesNum === this.Constants.pubKey;

    if (isPrivate && keyBytes[0] === 0) {
      this.privKey = new this.PrivKey().fromBn(Bn().fromBuffer(keyBytes.slice(1, 33)));
      this.pubKey = new PubKey().fromPrivKey(this.privKey);
    } else if (isPublic && (keyBytes[0] === 0x02 || keyBytes[0] === 0x03)) {
      this.pubKey = new PubKey().fromDer(keyBytes);
    } else {
      throw new Error('Invalid key');
    }

    return this;
  }
  /**
   * This is a faster version of .fromBuffer that reads in the output from
   * .toFastBuffer rather than from .toBuffer. .toFastBuffer outputs almost the
   * same thing as .toBuffer, except the public key is uncompressed. That makes
   * it larger, but also means that point multiplication doesn't have to be
   * used to derive the y value. So reading it in is faster. The only thing we
   * have to do is explicitely set the "compressed" value of public key to true
   * after reading it in. That is because although .toFastBuffer and
   * .fromFastBuffer transmit the public key in uncompressed form, we want it
   * to be set to compressed when stored in memory.
   */


  fromFastBuffer(buf) {
    if (buf.length === 0) {
      return this;
    }

    if (buf.length !== 78 && buf.length !== 78 + 33) {
      throw new Error('incorrect bip32 fastBuffer data length: ' + buf.length);
    }

    this.versionBytesNum = buf.slice(0, 4).readUInt32BE(0);
    this.depth = buf.slice(4, 5).readUInt8(0);
    this.parentFingerPrint = buf.slice(5, 9);
    this.childIndex = buf.slice(9, 13).readUInt32BE(0);
    this.chainCode = buf.slice(13, 45);
    const keyBytes = buf.slice(45, buf.length);
    const isPrivate = this.versionBytesNum === this.Constants.privKey;
    const isPublic = this.versionBytesNum === this.Constants.pubKey;

    if (isPrivate && keyBytes[0] === 0 && buf.length === 78) {
      this.privKey = new this.PrivKey().fromBn(Bn().fromBuffer(keyBytes.slice(1, 33)));
      this.pubKey = new PubKey().fromPrivKey(this.privKey);
    } else if (isPublic && buf.length === 78 + 33) {
      this.pubKey = new PubKey().fromFastBuffer(keyBytes);
      this.pubKey.compressed = true;
    } else {
      throw new Error('Invalid key');
    }

    return this;
  }

  derive(path) {
    const e = path.split('/');

    if (path === 'm') {
      return this;
    }

    let bip32 = this;

    for (const i in e) {
      const c = e[i];

      if (i === '0') {
        if (c !== 'm') throw new Error('invalid path');
        continue;
      }

      if (parseInt(c.replace("'", ''), 10).toString() !== c.replace("'", '')) {
        throw new Error('invalid path');
      }

      const usePrivate = c.length > 1 && c[c.length - 1] === "'";
      let childIndex = parseInt(usePrivate ? c.slice(0, c.length - 1) : c, 10) & 0x7fffffff;

      if (usePrivate) {
        childIndex += 0x80000000;
      }

      bip32 = bip32.deriveChild(childIndex);
    }

    return bip32;
  }

  async asyncDerive(path) {
    const workersResult = await Workers.asyncObjectMethod(this, 'derive', [path]);
    return new this.constructor().fromFastBuffer(workersResult.resbuf);
  }

  deriveChild(i) {
    if (typeof i !== 'number') {
      throw new Error('i must be a number');
    }

    let ib = [];
    ib.push(i >> 24 & 0xff);
    ib.push(i >> 16 & 0xff);
    ib.push(i >> 8 & 0xff);
    ib.push(i & 0xff);
    ib = Buffer.from(ib);
    const usePrivate = (i & 0x80000000) !== 0;
    const isPrivate = this.versionBytesNum === this.Constants.privKey;

    if (usePrivate && (!this.privKey || !isPrivate)) {
      throw new Error('Cannot do private key derivation without private key');
    }

    let ret = null;

    if (this.privKey) {
      let data = null;

      if (usePrivate) {
        data = Buffer.concat([Buffer.from([0]), this.privKey.bn.toBuffer({
          size: 32
        }), ib]);
      } else {
        data = Buffer.concat([this.pubKey.toBuffer({
          size: 32
        }), ib]);
      }

      const hash = Hash.sha512Hmac(data, this.chainCode);
      const il = Bn().fromBuffer(hash.slice(0, 32), {
        size: 32
      });
      const ir = hash.slice(32, 64); // ki = IL + kpar (mod n).

      const k = il.add(this.privKey.bn).mod(Point.getN());
      ret = new this.constructor();
      ret.chainCode = ir;
      ret.privKey = new this.PrivKey().fromBn(k);
      ret.pubKey = new PubKey().fromPrivKey(ret.privKey);
    } else {
      const data = Buffer.concat([this.pubKey.toBuffer(), ib]);
      const hash = Hash.sha512Hmac(data, this.chainCode);
      const il = Bn().fromBuffer(hash.slice(0, 32));
      const ir = hash.slice(32, 64); // Ki = (IL + kpar)*G = IL*G + Kpar

      const ilG = Point.getG().mul(il);
      const Kpar = this.pubKey.point;
      const Ki = ilG.add(Kpar);
      const newpub = new PubKey();
      newpub.point = Ki;
      ret = new this.constructor();
      ret.chainCode = ir;
      ret.pubKey = newpub;
    }

    ret.childIndex = i;
    const pubKeyhash = Hash.sha256Ripemd160(this.pubKey.toBuffer());
    ret.parentFingerPrint = pubKeyhash.slice(0, 4);
    ret.versionBytesNum = this.versionBytesNum;
    ret.depth = this.depth + 1;
    return ret;
  }

  toPublic() {
    const bip32 = new this.constructor().fromObject(this);
    bip32.versionBytesNum = this.Constants.pubKey;
    bip32.privKey = undefined;
    return bip32;
  }

  toBuffer() {
    const isPrivate = this.versionBytesNum === this.Constants.privKey;
    const isPublic = this.versionBytesNum === this.Constants.pubKey;

    if (isPrivate) {
      return new Bw().writeUInt32BE(this.versionBytesNum).writeUInt8(this.depth).write(this.parentFingerPrint).writeUInt32BE(this.childIndex).write(this.chainCode).writeUInt8(0).write(this.privKey.bn.toBuffer({
        size: 32
      })).toBuffer();
    } else if (isPublic) {
      if (this.pubKey.compressed === false) {
        throw new Error('cannot convert bip32 to buffer if pubKey is not compressed');
      }

      return new Bw().writeUInt32BE(this.versionBytesNum).writeUInt8(this.depth).write(this.parentFingerPrint).writeUInt32BE(this.childIndex).write(this.chainCode).write(this.pubKey.toBuffer()).toBuffer();
    } else {
      throw new Error('bip32: invalid versionBytesNum byte');
    }
  }
  /**
   * This is the "fast" analog of toBuffer. It is almost the same as toBuffer,
   * and in fact is actually not any faster. The only difference is that it
   * adds an uncompressed rather than compressed public key to the output. This
   * is so that .fromFastBufer can read in the public key without having to do
   * fancy, slow point multiplication to derive the y value of the public key.
   * Thus, although .toFastBuffer is not any faster, .fromFastBuffer is faster.
   */


  toFastBuffer() {
    if (!this.versionBytesNum) {
      return Buffer.alloc(0);
    }

    const isPrivate = this.versionBytesNum === this.Constants.privKey;
    const isPublic = this.versionBytesNum === this.Constants.pubKey;

    if (isPrivate) {
      return new Bw().writeUInt32BE(this.versionBytesNum).writeUInt8(this.depth).write(this.parentFingerPrint).writeUInt32BE(this.childIndex).write(this.chainCode).writeUInt8(0).write(this.privKey.bn.toBuffer({
        size: 32
      })).toBuffer();
    } else if (isPublic) {
      return new Bw().writeUInt32BE(this.versionBytesNum).writeUInt8(this.depth).write(this.parentFingerPrint).writeUInt32BE(this.childIndex).write(this.chainCode).write(this.pubKey.toFastBuffer()).toBuffer();
    } else {
      throw new Error('bip32: invalid versionBytesNum byte');
    }
  }

  toString() {
    return Base58Check.encode(this.toBuffer());
  }
  /**
   * Use workers to convert a bip32 object into a bip32 string without
   * blocking.
   */


  async asyncToString() {
    const workersResult = await Workers.asyncObjectMethod(this, 'toString', []);
    return JSON.parse(workersResult.resbuf.toString());
  }

  toJSON() {
    return this.toFastHex();
  }

  fromJSON(json) {
    return this.fromFastHex(json);
  }

  isPrivate() {
    return this.versionBytesNum === this.Constants.privKey;
  }

}

Bip32.Mainnet = class extends Bip32 {
  constructor(versionBytesNum, depth, parentFingerPrint, childIndex, chainCode, privKey, pubKey) {
    super(versionBytesNum, depth, parentFingerPrint, childIndex, chainCode, privKey, pubKey, Constants.Mainnet.Bip32, PrivKey.Mainnet);
  }

};
Bip32.Testnet = class extends Bip32 {
  constructor(versionBytesNum, depth, parentFingerPrint, childIndex, chainCode, privKey, pubKey) {
    super(versionBytesNum, depth, parentFingerPrint, childIndex, chainCode, privKey, pubKey, Constants.Testnet.Bip32, PrivKey.Testnet);
  }

};

const wordList = ['abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract', 'absurd', 'abuse', 'access', 'accident', 'account', 'accuse', 'achieve', 'acid', 'acoustic', 'acquire', 'across', 'act', 'action', 'actor', 'actress', 'actual', 'adapt', 'add', 'addict', 'address', 'adjust', 'admit', 'adult', 'advance', 'advice', 'aerobic', 'affair', 'afford', 'afraid', 'again', 'age', 'agent', 'agree', 'ahead', 'aim', 'air', 'airport', 'aisle', 'alarm', 'album', 'alcohol', 'alert', 'alien', 'all', 'alley', 'allow', 'almost', 'alone', 'alpha', 'already', 'also', 'alter', 'always', 'amateur', 'amazing', 'among', 'amount', 'amused', 'analyst', 'anchor', 'ancient', 'anger', 'angle', 'angry', 'animal', 'ankle', 'announce', 'annual', 'another', 'answer', 'antenna', 'antique', 'anxiety', 'any', 'apart', 'apology', 'appear', 'apple', 'approve', 'april', 'arch', 'arctic', 'area', 'arena', 'argue', 'arm', 'armed', 'armor', 'army', 'around', 'arrange', 'arrest', 'arrive', 'arrow', 'art', 'artefact', 'artist', 'artwork', 'ask', 'aspect', 'assault', 'asset', 'assist', 'assume', 'asthma', 'athlete', 'atom', 'attack', 'attend', 'attitude', 'attract', 'auction', 'audit', 'august', 'aunt', 'author', 'auto', 'autumn', 'average', 'avocado', 'avoid', 'awake', 'aware', 'away', 'awesome', 'awful', 'awkward', 'axis', 'baby', 'bachelor', 'bacon', 'badge', 'bag', 'balance', 'balcony', 'ball', 'bamboo', 'banana', 'banner', 'bar', 'barely', 'bargain', 'barrel', 'base', 'basic', 'basket', 'battle', 'beach', 'bean', 'beauty', 'because', 'become', 'beef', 'before', 'begin', 'behave', 'behind', 'believe', 'below', 'belt', 'bench', 'benefit', 'best', 'betray', 'better', 'between', 'beyond', 'bicycle', 'bid', 'bike', 'bind', 'biology', 'bird', 'birth', 'bitter', 'black', 'blade', 'blame', 'blanket', 'blast', 'bleak', 'bless', 'blind', 'blood', 'blossom', 'blouse', 'blue', 'blur', 'blush', 'board', 'boat', 'body', 'boil', 'bomb', 'bone', 'bonus', 'book', 'boost', 'border', 'boring', 'borrow', 'boss', 'bottom', 'bounce', 'box', 'boy', 'bracket', 'brain', 'brand', 'brass', 'brave', 'bread', 'breeze', 'brick', 'bridge', 'brief', 'bright', 'bring', 'brisk', 'broccoli', 'broken', 'bronze', 'broom', 'brother', 'brown', 'brush', 'bubble', 'buddy', 'budget', 'buffalo', 'build', 'bulb', 'bulk', 'bullet', 'bundle', 'bunker', 'burden', 'burger', 'burst', 'bus', 'business', 'busy', 'butter', 'buyer', 'buzz', 'cabbage', 'cabin', 'cable', 'cactus', 'cage', 'cake', 'call', 'calm', 'camera', 'camp', 'can', 'canal', 'cancel', 'candy', 'cannon', 'canoe', 'canvas', 'canyon', 'capable', 'capital', 'captain', 'car', 'carbon', 'card', 'cargo', 'carpet', 'carry', 'cart', 'case', 'cash', 'casino', 'castle', 'casual', 'cat', 'catalog', 'catch', 'category', 'cattle', 'caught', 'cause', 'caution', 'cave', 'ceiling', 'celery', 'cement', 'census', 'century', 'cereal', 'certain', 'chair', 'chalk', 'champion', 'change', 'chaos', 'chapter', 'charge', 'chase', 'chat', 'cheap', 'check', 'cheese', 'chef', 'cherry', 'chest', 'chicken', 'chief', 'child', 'chimney', 'choice', 'choose', 'chronic', 'chuckle', 'chunk', 'churn', 'cigar', 'cinnamon', 'circle', 'citizen', 'city', 'civil', 'claim', 'clap', 'clarify', 'claw', 'clay', 'clean', 'clerk', 'clever', 'click', 'client', 'cliff', 'climb', 'clinic', 'clip', 'clock', 'clog', 'close', 'cloth', 'cloud', 'clown', 'club', 'clump', 'cluster', 'clutch', 'coach', 'coast', 'coconut', 'code', 'coffee', 'coil', 'coin', 'collect', 'color', 'column', 'combine', 'come', 'comfort', 'comic', 'common', 'company', 'concert', 'conduct', 'confirm', 'congress', 'connect', 'consider', 'control', 'convince', 'cook', 'cool', 'copper', 'copy', 'coral', 'core', 'corn', 'correct', 'cost', 'cotton', 'couch', 'country', 'couple', 'course', 'cousin', 'cover', 'coyote', 'crack', 'cradle', 'craft', 'cram', 'crane', 'crash', 'crater', 'crawl', 'crazy', 'cream', 'credit', 'creek', 'crew', 'cricket', 'crime', 'crisp', 'critic', 'crop', 'cross', 'crouch', 'crowd', 'crucial', 'cruel', 'cruise', 'crumble', 'crunch', 'crush', 'cry', 'crystal', 'cube', 'culture', 'cup', 'cupboard', 'curious', 'current', 'curtain', 'curve', 'cushion', 'custom', 'cute', 'cycle', 'dad', 'damage', 'damp', 'dance', 'danger', 'daring', 'dash', 'daughter', 'dawn', 'day', 'deal', 'debate', 'debris', 'decade', 'december', 'decide', 'decline', 'decorate', 'decrease', 'deer', 'defense', 'define', 'defy', 'degree', 'delay', 'deliver', 'demand', 'demise', 'denial', 'dentist', 'deny', 'depart', 'depend', 'deposit', 'depth', 'deputy', 'derive', 'describe', 'desert', 'design', 'desk', 'despair', 'destroy', 'detail', 'detect', 'develop', 'device', 'devote', 'diagram', 'dial', 'diamond', 'diary', 'dice', 'diesel', 'diet', 'differ', 'digital', 'dignity', 'dilemma', 'dinner', 'dinosaur', 'direct', 'dirt', 'disagree', 'discover', 'disease', 'dish', 'dismiss', 'disorder', 'display', 'distance', 'divert', 'divide', 'divorce', 'dizzy', 'doctor', 'document', 'dog', 'doll', 'dolphin', 'domain', 'donate', 'donkey', 'donor', 'door', 'dose', 'double', 'dove', 'draft', 'dragon', 'drama', 'drastic', 'draw', 'dream', 'dress', 'drift', 'drill', 'drink', 'drip', 'drive', 'drop', 'drum', 'dry', 'duck', 'dumb', 'dune', 'during', 'dust', 'dutch', 'duty', 'dwarf', 'dynamic', 'eager', 'eagle', 'early', 'earn', 'earth', 'easily', 'east', 'easy', 'echo', 'ecology', 'economy', 'edge', 'edit', 'educate', 'effort', 'egg', 'eight', 'either', 'elbow', 'elder', 'electric', 'elegant', 'element', 'elephant', 'elevator', 'elite', 'else', 'embark', 'embody', 'embrace', 'emerge', 'emotion', 'employ', 'empower', 'empty', 'enable', 'enact', 'end', 'endless', 'endorse', 'enemy', 'energy', 'enforce', 'engage', 'engine', 'enhance', 'enjoy', 'enlist', 'enough', 'enrich', 'enroll', 'ensure', 'enter', 'entire', 'entry', 'envelope', 'episode', 'equal', 'equip', 'era', 'erase', 'erode', 'erosion', 'error', 'erupt', 'escape', 'essay', 'essence', 'estate', 'eternal', 'ethics', 'evidence', 'evil', 'evoke', 'evolve', 'exact', 'example', 'excess', 'exchange', 'excite', 'exclude', 'excuse', 'execute', 'exercise', 'exhaust', 'exhibit', 'exile', 'exist', 'exit', 'exotic', 'expand', 'expect', 'expire', 'explain', 'expose', 'express', 'extend', 'extra', 'eye', 'eyebrow', 'fabric', 'face', 'faculty', 'fade', 'faint', 'faith', 'fall', 'false', 'fame', 'family', 'famous', 'fan', 'fancy', 'fantasy', 'farm', 'fashion', 'fat', 'fatal', 'father', 'fatigue', 'fault', 'favorite', 'feature', 'february', 'federal', 'fee', 'feed', 'feel', 'female', 'fence', 'festival', 'fetch', 'fever', 'few', 'fiber', 'fiction', 'field', 'figure', 'file', 'film', 'filter', 'final', 'find', 'fine', 'finger', 'finish', 'fire', 'firm', 'first', 'fiscal', 'fish', 'fit', 'fitness', 'fix', 'flag', 'flame', 'flash', 'flat', 'flavor', 'flee', 'flight', 'flip', 'float', 'flock', 'floor', 'flower', 'fluid', 'flush', 'fly', 'foam', 'focus', 'fog', 'foil', 'fold', 'follow', 'food', 'foot', 'force', 'forest', 'forget', 'fork', 'fortune', 'forum', 'forward', 'fossil', 'foster', 'found', 'fox', 'fragile', 'frame', 'frequent', 'fresh', 'friend', 'fringe', 'frog', 'front', 'frost', 'frown', 'frozen', 'fruit', 'fuel', 'fun', 'funny', 'furnace', 'fury', 'future', 'gadget', 'gain', 'galaxy', 'gallery', 'game', 'gap', 'garage', 'garbage', 'garden', 'garlic', 'garment', 'gas', 'gasp', 'gate', 'gather', 'gauge', 'gaze', 'general', 'genius', 'genre', 'gentle', 'genuine', 'gesture', 'ghost', 'giant', 'gift', 'giggle', 'ginger', 'giraffe', 'girl', 'give', 'glad', 'glance', 'glare', 'glass', 'glide', 'glimpse', 'globe', 'gloom', 'glory', 'glove', 'glow', 'glue', 'goat', 'goddess', 'gold', 'good', 'goose', 'gorilla', 'gospel', 'gossip', 'govern', 'gown', 'grab', 'grace', 'grain', 'grant', 'grape', 'grass', 'gravity', 'great', 'green', 'grid', 'grief', 'grit', 'grocery', 'group', 'grow', 'grunt', 'guard', 'guess', 'guide', 'guilt', 'guitar', 'gun', 'gym', 'habit', 'hair', 'half', 'hammer', 'hamster', 'hand', 'happy', 'harbor', 'hard', 'harsh', 'harvest', 'hat', 'have', 'hawk', 'hazard', 'head', 'health', 'heart', 'heavy', 'hedgehog', 'height', 'hello', 'helmet', 'help', 'hen', 'hero', 'hidden', 'high', 'hill', 'hint', 'hip', 'hire', 'history', 'hobby', 'hockey', 'hold', 'hole', 'holiday', 'hollow', 'home', 'honey', 'hood', 'hope', 'horn', 'horror', 'horse', 'hospital', 'host', 'hotel', 'hour', 'hover', 'hub', 'huge', 'human', 'humble', 'humor', 'hundred', 'hungry', 'hunt', 'hurdle', 'hurry', 'hurt', 'husband', 'hybrid', 'ice', 'icon', 'idea', 'identify', 'idle', 'ignore', 'ill', 'illegal', 'illness', 'image', 'imitate', 'immense', 'immune', 'impact', 'impose', 'improve', 'impulse', 'inch', 'include', 'income', 'increase', 'index', 'indicate', 'indoor', 'industry', 'infant', 'inflict', 'inform', 'inhale', 'inherit', 'initial', 'inject', 'injury', 'inmate', 'inner', 'innocent', 'input', 'inquiry', 'insane', 'insect', 'inside', 'inspire', 'install', 'intact', 'interest', 'into', 'invest', 'invite', 'involve', 'iron', 'island', 'isolate', 'issue', 'item', 'ivory', 'jacket', 'jaguar', 'jar', 'jazz', 'jealous', 'jeans', 'jelly', 'jewel', 'job', 'join', 'joke', 'journey', 'joy', 'judge', 'juice', 'jump', 'jungle', 'junior', 'junk', 'just', 'kangaroo', 'keen', 'keep', 'ketchup', 'key', 'kick', 'kid', 'kidney', 'kind', 'kingdom', 'kiss', 'kit', 'kitchen', 'kite', 'kitten', 'kiwi', 'knee', 'knife', 'knock', 'know', 'lab', 'label', 'labor', 'ladder', 'lady', 'lake', 'lamp', 'language', 'laptop', 'large', 'later', 'latin', 'laugh', 'laundry', 'lava', 'law', 'lawn', 'lawsuit', 'layer', 'lazy', 'leader', 'leaf', 'learn', 'leave', 'lecture', 'left', 'leg', 'legal', 'legend', 'leisure', 'lemon', 'lend', 'length', 'lens', 'leopard', 'lesson', 'letter', 'level', 'liar', 'liberty', 'library', 'license', 'life', 'lift', 'light', 'like', 'limb', 'limit', 'link', 'lion', 'liquid', 'list', 'little', 'live', 'lizard', 'load', 'loan', 'lobster', 'local', 'lock', 'logic', 'lonely', 'long', 'loop', 'lottery', 'loud', 'lounge', 'love', 'loyal', 'lucky', 'luggage', 'lumber', 'lunar', 'lunch', 'luxury', 'lyrics', 'machine', 'mad', 'magic', 'magnet', 'maid', 'mail', 'main', 'major', 'make', 'mammal', 'man', 'manage', 'mandate', 'mango', 'mansion', 'manual', 'maple', 'marble', 'march', 'margin', 'marine', 'market', 'marriage', 'mask', 'mass', 'master', 'match', 'material', 'math', 'matrix', 'matter', 'maximum', 'maze', 'meadow', 'mean', 'measure', 'meat', 'mechanic', 'medal', 'media', 'melody', 'melt', 'member', 'memory', 'mention', 'menu', 'mercy', 'merge', 'merit', 'merry', 'mesh', 'message', 'metal', 'method', 'middle', 'midnight', 'milk', 'million', 'mimic', 'mind', 'minimum', 'minor', 'minute', 'miracle', 'mirror', 'misery', 'miss', 'mistake', 'mix', 'mixed', 'mixture', 'mobile', 'model', 'modify', 'mom', 'moment', 'monitor', 'monkey', 'monster', 'month', 'moon', 'moral', 'more', 'morning', 'mosquito', 'mother', 'motion', 'motor', 'mountain', 'mouse', 'move', 'movie', 'much', 'muffin', 'mule', 'multiply', 'muscle', 'museum', 'mushroom', 'music', 'must', 'mutual', 'myself', 'mystery', 'myth', 'naive', 'name', 'napkin', 'narrow', 'nasty', 'nation', 'nature', 'near', 'neck', 'need', 'negative', 'neglect', 'neither', 'nephew', 'nerve', 'nest', 'net', 'network', 'neutral', 'never', 'news', 'next', 'nice', 'night', 'noble', 'noise', 'nominee', 'noodle', 'normal', 'north', 'nose', 'notable', 'note', 'nothing', 'notice', 'novel', 'now', 'nuclear', 'number', 'nurse', 'nut', 'oak', 'obey', 'object', 'oblige', 'obscure', 'observe', 'obtain', 'obvious', 'occur', 'ocean', 'october', 'odor', 'off', 'offer', 'office', 'often', 'oil', 'okay', 'old', 'olive', 'olympic', 'omit', 'once', 'one', 'onion', 'online', 'only', 'open', 'opera', 'opinion', 'oppose', 'option', 'orange', 'orbit', 'orchard', 'order', 'ordinary', 'organ', 'orient', 'original', 'orphan', 'ostrich', 'other', 'outdoor', 'outer', 'output', 'outside', 'oval', 'oven', 'over', 'own', 'owner', 'oxygen', 'oyster', 'ozone', 'pact', 'paddle', 'page', 'pair', 'palace', 'palm', 'panda', 'panel', 'panic', 'panther', 'paper', 'parade', 'parent', 'park', 'parrot', 'party', 'pass', 'patch', 'path', 'patient', 'patrol', 'pattern', 'pause', 'pave', 'payment', 'peace', 'peanut', 'pear', 'peasant', 'pelican', 'pen', 'penalty', 'pencil', 'people', 'pepper', 'perfect', 'permit', 'person', 'pet', 'phone', 'photo', 'phrase', 'physical', 'piano', 'picnic', 'picture', 'piece', 'pig', 'pigeon', 'pill', 'pilot', 'pink', 'pioneer', 'pipe', 'pistol', 'pitch', 'pizza', 'place', 'planet', 'plastic', 'plate', 'play', 'please', 'pledge', 'pluck', 'plug', 'plunge', 'poem', 'poet', 'point', 'polar', 'pole', 'police', 'pond', 'pony', 'pool', 'popular', 'portion', 'position', 'possible', 'post', 'potato', 'pottery', 'poverty', 'powder', 'power', 'practice', 'praise', 'predict', 'prefer', 'prepare', 'present', 'pretty', 'prevent', 'price', 'pride', 'primary', 'print', 'priority', 'prison', 'private', 'prize', 'problem', 'process', 'produce', 'profit', 'program', 'project', 'promote', 'proof', 'property', 'prosper', 'protect', 'proud', 'provide', 'public', 'pudding', 'pull', 'pulp', 'pulse', 'pumpkin', 'punch', 'pupil', 'puppy', 'purchase', 'purity', 'purpose', 'purse', 'push', 'put', 'puzzle', 'pyramid', 'quality', 'quantum', 'quarter', 'question', 'quick', 'quit', 'quiz', 'quote', 'rabbit', 'raccoon', 'race', 'rack', 'radar', 'radio', 'rail', 'rain', 'raise', 'rally', 'ramp', 'ranch', 'random', 'range', 'rapid', 'rare', 'rate', 'rather', 'raven', 'raw', 'razor', 'ready', 'real', 'reason', 'rebel', 'rebuild', 'recall', 'receive', 'recipe', 'record', 'recycle', 'reduce', 'reflect', 'reform', 'refuse', 'region', 'regret', 'regular', 'reject', 'relax', 'release', 'relief', 'rely', 'remain', 'remember', 'remind', 'remove', 'render', 'renew', 'rent', 'reopen', 'repair', 'repeat', 'replace', 'report', 'require', 'rescue', 'resemble', 'resist', 'resource', 'response', 'result', 'retire', 'retreat', 'return', 'reunion', 'reveal', 'review', 'reward', 'rhythm', 'rib', 'ribbon', 'rice', 'rich', 'ride', 'ridge', 'rifle', 'right', 'rigid', 'ring', 'riot', 'ripple', 'risk', 'ritual', 'rival', 'river', 'road', 'roast', 'robot', 'robust', 'rocket', 'romance', 'roof', 'rookie', 'room', 'rose', 'rotate', 'rough', 'round', 'route', 'royal', 'rubber', 'rude', 'rug', 'rule', 'run', 'runway', 'rural', 'sad', 'saddle', 'sadness', 'safe', 'sail', 'salad', 'salmon', 'salon', 'salt', 'salute', 'same', 'sample', 'sand', 'satisfy', 'satoshi', 'sauce', 'sausage', 'save', 'say', 'scale', 'scan', 'scare', 'scatter', 'scene', 'scheme', 'school', 'science', 'scissors', 'scorpion', 'scout', 'scrap', 'screen', 'script', 'scrub', 'sea', 'search', 'season', 'seat', 'second', 'secret', 'section', 'security', 'seed', 'seek', 'segment', 'select', 'sell', 'seminar', 'senior', 'sense', 'sentence', 'series', 'service', 'session', 'settle', 'setup', 'seven', 'shadow', 'shaft', 'shallow', 'share', 'shed', 'shell', 'sheriff', 'shield', 'shift', 'shine', 'ship', 'shiver', 'shock', 'shoe', 'shoot', 'shop', 'short', 'shoulder', 'shove', 'shrimp', 'shrug', 'shuffle', 'shy', 'sibling', 'sick', 'side', 'siege', 'sight', 'sign', 'silent', 'silk', 'silly', 'silver', 'similar', 'simple', 'since', 'sing', 'siren', 'sister', 'situate', 'six', 'size', 'skate', 'sketch', 'ski', 'skill', 'skin', 'skirt', 'skull', 'slab', 'slam', 'sleep', 'slender', 'slice', 'slide', 'slight', 'slim', 'slogan', 'slot', 'slow', 'slush', 'small', 'smart', 'smile', 'smoke', 'smooth', 'snack', 'snake', 'snap', 'sniff', 'snow', 'soap', 'soccer', 'social', 'sock', 'soda', 'soft', 'solar', 'soldier', 'solid', 'solution', 'solve', 'someone', 'song', 'soon', 'sorry', 'sort', 'soul', 'sound', 'soup', 'source', 'south', 'space', 'spare', 'spatial', 'spawn', 'speak', 'special', 'speed', 'spell', 'spend', 'sphere', 'spice', 'spider', 'spike', 'spin', 'spirit', 'split', 'spoil', 'sponsor', 'spoon', 'sport', 'spot', 'spray', 'spread', 'spring', 'spy', 'square', 'squeeze', 'squirrel', 'stable', 'stadium', 'staff', 'stage', 'stairs', 'stamp', 'stand', 'start', 'state', 'stay', 'steak', 'steel', 'stem', 'step', 'stereo', 'stick', 'still', 'sting', 'stock', 'stomach', 'stone', 'stool', 'story', 'stove', 'strategy', 'street', 'strike', 'strong', 'struggle', 'student', 'stuff', 'stumble', 'style', 'subject', 'submit', 'subway', 'success', 'such', 'sudden', 'suffer', 'sugar', 'suggest', 'suit', 'summer', 'sun', 'sunny', 'sunset', 'super', 'supply', 'supreme', 'sure', 'surface', 'surge', 'surprise', 'surround', 'survey', 'suspect', 'sustain', 'swallow', 'swamp', 'swap', 'swarm', 'swear', 'sweet', 'swift', 'swim', 'swing', 'switch', 'sword', 'symbol', 'symptom', 'syrup', 'system', 'table', 'tackle', 'tag', 'tail', 'talent', 'talk', 'tank', 'tape', 'target', 'task', 'taste', 'tattoo', 'taxi', 'teach', 'team', 'tell', 'ten', 'tenant', 'tennis', 'tent', 'term', 'test', 'text', 'thank', 'that', 'theme', 'then', 'theory', 'there', 'they', 'thing', 'this', 'thought', 'three', 'thrive', 'throw', 'thumb', 'thunder', 'ticket', 'tide', 'tiger', 'tilt', 'timber', 'time', 'tiny', 'tip', 'tired', 'tissue', 'title', 'toast', 'tobacco', 'today', 'toddler', 'toe', 'together', 'toilet', 'token', 'tomato', 'tomorrow', 'tone', 'tongue', 'tonight', 'tool', 'tooth', 'top', 'topic', 'topple', 'torch', 'tornado', 'tortoise', 'toss', 'total', 'tourist', 'toward', 'tower', 'town', 'toy', 'track', 'trade', 'traffic', 'tragic', 'train', 'transfer', 'trap', 'trash', 'travel', 'tray', 'treat', 'tree', 'trend', 'trial', 'tribe', 'trick', 'trigger', 'trim', 'trip', 'trophy', 'trouble', 'truck', 'true', 'truly', 'trumpet', 'trust', 'truth', 'try', 'tube', 'tuition', 'tumble', 'tuna', 'tunnel', 'turkey', 'turn', 'turtle', 'twelve', 'twenty', 'twice', 'twin', 'twist', 'two', 'type', 'typical', 'ugly', 'umbrella', 'unable', 'unaware', 'uncle', 'uncover', 'under', 'undo', 'unfair', 'unfold', 'unhappy', 'uniform', 'unique', 'unit', 'universe', 'unknown', 'unlock', 'until', 'unusual', 'unveil', 'update', 'upgrade', 'uphold', 'upon', 'upper', 'upset', 'urban', 'urge', 'usage', 'use', 'used', 'useful', 'useless', 'usual', 'utility', 'vacant', 'vacuum', 'vague', 'valid', 'valley', 'valve', 'van', 'vanish', 'vapor', 'various', 'vast', 'vault', 'vehicle', 'velvet', 'vendor', 'venture', 'venue', 'verb', 'verify', 'version', 'very', 'vessel', 'veteran', 'viable', 'vibrant', 'vicious', 'victory', 'video', 'view', 'village', 'vintage', 'violin', 'virtual', 'virus', 'visa', 'visit', 'visual', 'vital', 'vivid', 'vocal', 'voice', 'void', 'volcano', 'volume', 'vote', 'voyage', 'wage', 'wagon', 'wait', 'walk', 'wall', 'walnut', 'want', 'warfare', 'warm', 'warrior', 'wash', 'wasp', 'waste', 'water', 'wave', 'way', 'wealth', 'weapon', 'wear', 'weasel', 'weather', 'web', 'wedding', 'weekend', 'weird', 'welcome', 'west', 'wet', 'whale', 'what', 'wheat', 'wheel', 'when', 'where', 'whip', 'whisper', 'wide', 'width', 'wife', 'wild', 'will', 'win', 'window', 'wine', 'wing', 'wink', 'winner', 'winter', 'wire', 'wisdom', 'wise', 'wish', 'witness', 'wolf', 'woman', 'wonder', 'wood', 'wool', 'word', 'work', 'world', 'worry', 'worth', 'wrap', 'wreck', 'wrestle', 'wrist', 'write', 'wrong', 'yard', 'year', 'yellow', 'you', 'young', 'youth', 'zebra', 'zero', 'zone', 'zoo'];
wordList.space = ' ';

/**
 * Bip39: Mnemonic Seeds
 * =====================
 *
 * Bip39 is a way to turn random entropy into a mnemonic (a string of words
 * from a wordlist), and then that mnemonic into a seed. The seed can then be
 * used in Bip32 to derive hierarchical deterministic keys. It does not go the
 * other way around (i.e., you cannot turn a seed into a mnemonic). The usual
 * way to use it is either to generate a new one, like this:
 *
 * const mnemonic = new Bip39().fromRandom().toString()
 *
 * or from a known mnemonic:
 *
 * const seed = new Bip39().fromString(mnemonic).toSeed()
 */

class Bip39 extends Struct {
  constructor(mnemonic, seed, wordlist = wordList) {
    super({
      mnemonic,
      seed
    });
    this.Wordlist = wordlist;
  }

  toBw(bw) {
    if (!bw) {
      bw = new Bw();
    }

    if (this.mnemonic) {
      const buf = Buffer.from(this.mnemonic);
      bw.writeVarIntNum(buf.length);
      bw.write(buf);
    } else {
      bw.writeVarIntNum(0);
    }

    if (this.seed) {
      bw.writeVarIntNum(this.seed.length);
      bw.write(this.seed);
    } else {
      bw.writeVarIntNum(0);
    }

    return bw;
  }

  fromBr(br) {
    const mnemoniclen = br.readVarIntNum();

    if (mnemoniclen > 0) {
      this.mnemonic = br.read(mnemoniclen).toString();
    }

    const seedlen = br.readVarIntNum();

    if (seedlen > 0) {
      this.seed = br.read(seedlen);
    }

    return this;
  }
  /**
     * Generate a random new mnemonic from the wordlist.
     */


  fromRandom(bits) {
    if (!bits) {
      bits = 128;
    }

    if (bits % 32 !== 0) {
      throw new Error('bits must be multiple of 32');
    }

    if (bits < 128) {
      throw new Error('bits must be at least 128');
    }

    const buf = Random.getRandomBuffer(bits / 8);
    this.entropy2Mnemonic(buf);
    this.mnemonic2Seed();
    return this;
  }

  static fromRandom(bits) {
    return new this().fromRandom(bits);
  }

  async asyncFromRandom(bits) {
    if (!bits) {
      bits = 128;
    }

    const buf = Random.getRandomBuffer(bits / 8);
    let workersResult = await Workers.asyncObjectMethod(this, 'entropy2Mnemonic', [buf]);
    const bip39 = new Bip39().fromFastBuffer(workersResult.resbuf);
    workersResult = await Workers.asyncObjectMethod(bip39, 'mnemonic2Seed', []);
    return this.fromFastBuffer(workersResult.resbuf);
  }

  static asyncFromRandom(bits) {
    return new this().asyncFromRandom(bits);
  }

  fromEntropy(buf) {
    this.entropy2Mnemonic(buf);
    return this;
  }

  static fromEntropy(buf) {
    return new this().fromEntropy(buf);
  }

  async asyncFromEntropy(buf) {
    const workersResult = await Workers.asyncObjectMethod(this, 'fromEntropy', [buf]);
    return this.fromFastBuffer(workersResult.resbuf);
  }

  static asyncFromEntropy(buf) {
    return new this().asyncFromEntropy(buf);
  }

  fromString(mnemonic) {
    this.mnemonic = mnemonic;
    return this;
  }

  toString() {
    return this.mnemonic;
  }

  toSeed(passphrase) {
    this.mnemonic2Seed(passphrase);
    return this.seed;
  }

  async asyncToSeed(passphrase) {
    if (passphrase === undefined) {
      passphrase = '';
    }

    const args = [passphrase];
    const workersResult = await Workers.asyncObjectMethod(this, 'toSeed', args);
    return workersResult.resbuf;
  }
  /**
     * Generate a new mnemonic from some entropy generated somewhere else. The
     * entropy must be at least 128 bits.
     */


  entropy2Mnemonic(buf) {
    if (!Buffer.isBuffer(buf) || buf.length < 128 / 8) {
      throw new Error('Entropy is less than 128 bits. It must be 128 bits or more.');
    }

    const hash = Hash.sha256(buf);
    let bin = '';
    const bits = buf.length * 8;

    for (let i = 0; i < buf.length; i++) {
      bin = bin + ('00000000' + buf[i].toString(2)).slice(-8);
    }

    let hashbits = hash[0].toString(2);
    hashbits = ('00000000' + hashbits).slice(-8).slice(0, bits / 32);
    bin = bin + hashbits;

    if (bin.length % 11 !== 0) {
      throw new Error('internal error - entropy not an even multiple of 11 bits - ' + bin.length);
    }

    let mnemonic = '';

    for (let i = 0; i < bin.length / 11; i++) {
      if (mnemonic !== '') {
        mnemonic = mnemonic + this.Wordlist.space;
      }

      const wi = parseInt(bin.slice(i * 11, (i + 1) * 11), 2);
      mnemonic = mnemonic + this.Wordlist[wi];
    }

    this.mnemonic = mnemonic;
    return this;
  }
  /**
     * Check that a mnemonic is valid. This means there should be no superfluous
     * whitespace, no invalid words, and the checksum should match.
     */


  check() {
    const mnemonic = this.mnemonic; // confirm no invalid words

    const words = mnemonic.split(this.Wordlist.space);
    let bin = '';

    for (let i = 0; i < words.length; i++) {
      const ind = this.Wordlist.indexOf(words[i]);

      if (ind < 0) {
        return false;
      }

      bin = bin + ('00000000000' + ind.toString(2)).slice(-11);
    }

    if (bin.length % 11 !== 0) {
      throw new Error('internal error - entropy not an even multiple of 11 bits - ' + bin.length);
    } // confirm checksum


    const cs = bin.length / 33;
    const hashBits = bin.slice(-cs);
    const nonhashBits = bin.slice(0, bin.length - cs);
    const buf = Buffer.alloc(nonhashBits.length / 8);

    for (let i = 0; i < nonhashBits.length / 8; i++) {
      buf.writeUInt8(parseInt(bin.slice(i * 8, (i + 1) * 8), 2), i);
    }

    const hash = Hash.sha256(buf);
    let expectedHashBits = hash[0].toString(2);
    expectedHashBits = ('00000000' + expectedHashBits).slice(-8).slice(0, cs);
    return expectedHashBits === hashBits;
  }
  /**
     * Convert a mnemonic to a seed. Does not check for validity of the mnemonic -
     * for that, you should manually run check() first.
     */


  mnemonic2Seed(passphrase = '') {
    let mnemonic = this.mnemonic;

    if (!this.check()) {
      throw new Error('Mnemonic does not pass the check - was the mnemonic typed incorrectly? Are there extra spaces?');
    }

    if (typeof passphrase !== 'string') {
      throw new Error('passphrase must be a string or undefined');
    }

    mnemonic = mnemonic.normalize('NFKD');
    passphrase = passphrase.normalize('NFKD');
    const mbuf = Buffer.from(mnemonic);
    const pbuf = Buffer.concat([Buffer.from('mnemonic'), Buffer.from(passphrase)]);
    this.seed = pbkdf2.pbkdf2Sync(mbuf, pbuf, 2048, 64, 'sha512');
    return this;
  }

  isValid(passphrase = '') {
    let isValid;

    try {
      isValid = !!this.mnemonic2Seed(passphrase);
    } catch (err) {
      isValid = false;
    }

    return isValid;
  }

  static isValid(mnemonic, passphrase = '') {
    return new Bip39(mnemonic).isValid(passphrase);
  }

}

const wordList$1 = ['あいこくしん', 'あいさつ', 'あいだ', 'あおぞら', 'あかちゃん', 'あきる', 'あけがた', 'あける', 'あこがれる', 'あさい', 'あさひ', 'あしあと', 'あじわう', 'あずかる', 'あずき', 'あそぶ', 'あたえる', 'あたためる', 'あたりまえ', 'あたる', 'あつい', 'あつかう', 'あっしゅく', 'あつまり', 'あつめる', 'あてな', 'あてはまる', 'あひる', 'あぶら', 'あぶる', 'あふれる', 'あまい', 'あまど', 'あまやかす', 'あまり', 'あみもの', 'あめりか', 'あやまる', 'あゆむ', 'あらいぐま', 'あらし', 'あらすじ', 'あらためる', 'あらゆる', 'あらわす', 'ありがとう', 'あわせる', 'あわてる', 'あんい', 'あんがい', 'あんこ', 'あんぜん', 'あんてい', 'あんない', 'あんまり', 'いいだす', 'いおん', 'いがい', 'いがく', 'いきおい', 'いきなり', 'いきもの', 'いきる', 'いくじ', 'いくぶん', 'いけばな', 'いけん', 'いこう', 'いこく', 'いこつ', 'いさましい', 'いさん', 'いしき', 'いじゅう', 'いじょう', 'いじわる', 'いずみ', 'いずれ', 'いせい', 'いせえび', 'いせかい', 'いせき', 'いぜん', 'いそうろう', 'いそがしい', 'いだい', 'いだく', 'いたずら', 'いたみ', 'いたりあ', 'いちおう', 'いちじ', 'いちど', 'いちば', 'いちぶ', 'いちりゅう', 'いつか', 'いっしゅん', 'いっせい', 'いっそう', 'いったん', 'いっち', 'いってい', 'いっぽう', 'いてざ', 'いてん', 'いどう', 'いとこ', 'いない', 'いなか', 'いねむり', 'いのち', 'いのる', 'いはつ', 'いばる', 'いはん', 'いびき', 'いひん', 'いふく', 'いへん', 'いほう', 'いみん', 'いもうと', 'いもたれ', 'いもり', 'いやがる', 'いやす', 'いよかん', 'いよく', 'いらい', 'いらすと', 'いりぐち', 'いりょう', 'いれい', 'いれもの', 'いれる', 'いろえんぴつ', 'いわい', 'いわう', 'いわかん', 'いわば', 'いわゆる', 'いんげんまめ', 'いんさつ', 'いんしょう', 'いんよう', 'うえき', 'うえる', 'うおざ', 'うがい', 'うかぶ', 'うかべる', 'うきわ', 'うくらいな', 'うくれれ', 'うけたまわる', 'うけつけ', 'うけとる', 'うけもつ', 'うける', 'うごかす', 'うごく', 'うこん', 'うさぎ', 'うしなう', 'うしろがみ', 'うすい', 'うすぎ', 'うすぐらい', 'うすめる', 'うせつ', 'うちあわせ', 'うちがわ', 'うちき', 'うちゅう', 'うっかり', 'うつくしい', 'うったえる', 'うつる', 'うどん', 'うなぎ', 'うなじ', 'うなずく', 'うなる', 'うねる', 'うのう', 'うぶげ', 'うぶごえ', 'うまれる', 'うめる', 'うもう', 'うやまう', 'うよく', 'うらがえす', 'うらぐち', 'うらない', 'うりあげ', 'うりきれ', 'うるさい', 'うれしい', 'うれゆき', 'うれる', 'うろこ', 'うわき', 'うわさ', 'うんこう', 'うんちん', 'うんてん', 'うんどう', 'えいえん', 'えいが', 'えいきょう', 'えいご', 'えいせい', 'えいぶん', 'えいよう', 'えいわ', 'えおり', 'えがお', 'えがく', 'えきたい', 'えくせる', 'えしゃく', 'えすて', 'えつらん', 'えのぐ', 'えほうまき', 'えほん', 'えまき', 'えもじ', 'えもの', 'えらい', 'えらぶ', 'えりあ', 'えんえん', 'えんかい', 'えんぎ', 'えんげき', 'えんしゅう', 'えんぜつ', 'えんそく', 'えんちょう', 'えんとつ', 'おいかける', 'おいこす', 'おいしい', 'おいつく', 'おうえん', 'おうさま', 'おうじ', 'おうせつ', 'おうたい', 'おうふく', 'おうべい', 'おうよう', 'おえる', 'おおい', 'おおう', 'おおどおり', 'おおや', 'おおよそ', 'おかえり', 'おかず', 'おがむ', 'おかわり', 'おぎなう', 'おきる', 'おくさま', 'おくじょう', 'おくりがな', 'おくる', 'おくれる', 'おこす', 'おこなう', 'おこる', 'おさえる', 'おさない', 'おさめる', 'おしいれ', 'おしえる', 'おじぎ', 'おじさん', 'おしゃれ', 'おそらく', 'おそわる', 'おたがい', 'おたく', 'おだやか', 'おちつく', 'おっと', 'おつり', 'おでかけ', 'おとしもの', 'おとなしい', 'おどり', 'おどろかす', 'おばさん', 'おまいり', 'おめでとう', 'おもいで', 'おもう', 'おもたい', 'おもちゃ', 'おやつ', 'おやゆび', 'およぼす', 'おらんだ', 'おろす', 'おんがく', 'おんけい', 'おんしゃ', 'おんせん', 'おんだん', 'おんちゅう', 'おんどけい', 'かあつ', 'かいが', 'がいき', 'がいけん', 'がいこう', 'かいさつ', 'かいしゃ', 'かいすいよく', 'かいぜん', 'かいぞうど', 'かいつう', 'かいてん', 'かいとう', 'かいふく', 'がいへき', 'かいほう', 'かいよう', 'がいらい', 'かいわ', 'かえる', 'かおり', 'かかえる', 'かがく', 'かがし', 'かがみ', 'かくご', 'かくとく', 'かざる', 'がぞう', 'かたい', 'かたち', 'がちょう', 'がっきゅう', 'がっこう', 'がっさん', 'がっしょう', 'かなざわし', 'かのう', 'がはく', 'かぶか', 'かほう', 'かほご', 'かまう', 'かまぼこ', 'かめれおん', 'かゆい', 'かようび', 'からい', 'かるい', 'かろう', 'かわく', 'かわら', 'がんか', 'かんけい', 'かんこう', 'かんしゃ', 'かんそう', 'かんたん', 'かんち', 'がんばる', 'きあい', 'きあつ', 'きいろ', 'ぎいん', 'きうい', 'きうん', 'きえる', 'きおう', 'きおく', 'きおち', 'きおん', 'きかい', 'きかく', 'きかんしゃ', 'ききて', 'きくばり', 'きくらげ', 'きけんせい', 'きこう', 'きこえる', 'きこく', 'きさい', 'きさく', 'きさま', 'きさらぎ', 'ぎじかがく', 'ぎしき', 'ぎじたいけん', 'ぎじにってい', 'ぎじゅつしゃ', 'きすう', 'きせい', 'きせき', 'きせつ', 'きそう', 'きぞく', 'きぞん', 'きたえる', 'きちょう', 'きつえん', 'ぎっちり', 'きつつき', 'きつね', 'きてい', 'きどう', 'きどく', 'きない', 'きなが', 'きなこ', 'きぬごし', 'きねん', 'きのう', 'きのした', 'きはく', 'きびしい', 'きひん', 'きふく', 'きぶん', 'きぼう', 'きほん', 'きまる', 'きみつ', 'きむずかしい', 'きめる', 'きもだめし', 'きもち', 'きもの', 'きゃく', 'きやく', 'ぎゅうにく', 'きよう', 'きょうりゅう', 'きらい', 'きらく', 'きりん', 'きれい', 'きれつ', 'きろく', 'ぎろん', 'きわめる', 'ぎんいろ', 'きんかくじ', 'きんじょ', 'きんようび', 'ぐあい', 'くいず', 'くうかん', 'くうき', 'くうぐん', 'くうこう', 'ぐうせい', 'くうそう', 'ぐうたら', 'くうふく', 'くうぼ', 'くかん', 'くきょう', 'くげん', 'ぐこう', 'くさい', 'くさき', 'くさばな', 'くさる', 'くしゃみ', 'くしょう', 'くすのき', 'くすりゆび', 'くせげ', 'くせん', 'ぐたいてき', 'くださる', 'くたびれる', 'くちこみ', 'くちさき', 'くつした', 'ぐっすり', 'くつろぐ', 'くとうてん', 'くどく', 'くなん', 'くねくね', 'くのう', 'くふう', 'くみあわせ', 'くみたてる', 'くめる', 'くやくしょ', 'くらす', 'くらべる', 'くるま', 'くれる', 'くろう', 'くわしい', 'ぐんかん', 'ぐんしょく', 'ぐんたい', 'ぐんて', 'けあな', 'けいかく', 'けいけん', 'けいこ', 'けいさつ', 'げいじゅつ', 'けいたい', 'げいのうじん', 'けいれき', 'けいろ', 'けおとす', 'けおりもの', 'げきか', 'げきげん', 'げきだん', 'げきちん', 'げきとつ', 'げきは', 'げきやく', 'げこう', 'げこくじょう', 'げざい', 'けさき', 'げざん', 'けしき', 'けしごむ', 'けしょう', 'げすと', 'けたば', 'けちゃっぷ', 'けちらす', 'けつあつ', 'けつい', 'けつえき', 'けっこん', 'けつじょ', 'けっせき', 'けってい', 'けつまつ', 'げつようび', 'げつれい', 'けつろん', 'げどく', 'けとばす', 'けとる', 'けなげ', 'けなす', 'けなみ', 'けぬき', 'げねつ', 'けねん', 'けはい', 'げひん', 'けぶかい', 'げぼく', 'けまり', 'けみかる', 'けむし', 'けむり', 'けもの', 'けらい', 'けろけろ', 'けわしい', 'けんい', 'けんえつ', 'けんお', 'けんか', 'げんき', 'けんげん', 'けんこう', 'けんさく', 'けんしゅう', 'けんすう', 'げんそう', 'けんちく', 'けんてい', 'けんとう', 'けんない', 'けんにん', 'げんぶつ', 'けんま', 'けんみん', 'けんめい', 'けんらん', 'けんり', 'こあくま', 'こいぬ', 'こいびと', 'ごうい', 'こうえん', 'こうおん', 'こうかん', 'ごうきゅう', 'ごうけい', 'こうこう', 'こうさい', 'こうじ', 'こうすい', 'ごうせい', 'こうそく', 'こうたい', 'こうちゃ', 'こうつう', 'こうてい', 'こうどう', 'こうない', 'こうはい', 'ごうほう', 'ごうまん', 'こうもく', 'こうりつ', 'こえる', 'こおり', 'ごかい', 'ごがつ', 'ごかん', 'こくご', 'こくさい', 'こくとう', 'こくない', 'こくはく', 'こぐま', 'こけい', 'こける', 'ここのか', 'こころ', 'こさめ', 'こしつ', 'こすう', 'こせい', 'こせき', 'こぜん', 'こそだて', 'こたい', 'こたえる', 'こたつ', 'こちょう', 'こっか', 'こつこつ', 'こつばん', 'こつぶ', 'こてい', 'こてん', 'ことがら', 'ことし', 'ことば', 'ことり', 'こなごな', 'こねこね', 'このまま', 'このみ', 'このよ', 'ごはん', 'こひつじ', 'こふう', 'こふん', 'こぼれる', 'ごまあぶら', 'こまかい', 'ごますり', 'こまつな', 'こまる', 'こむぎこ', 'こもじ', 'こもち', 'こもの', 'こもん', 'こやく', 'こやま', 'こゆう', 'こゆび', 'こよい', 'こよう', 'こりる', 'これくしょん', 'ころっけ', 'こわもて', 'こわれる', 'こんいん', 'こんかい', 'こんき', 'こんしゅう', 'こんすい', 'こんだて', 'こんとん', 'こんなん', 'こんびに', 'こんぽん', 'こんまけ', 'こんや', 'こんれい', 'こんわく', 'ざいえき', 'さいかい', 'さいきん', 'ざいげん', 'ざいこ', 'さいしょ', 'さいせい', 'ざいたく', 'ざいちゅう', 'さいてき', 'ざいりょう', 'さうな', 'さかいし', 'さがす', 'さかな', 'さかみち', 'さがる', 'さぎょう', 'さくし', 'さくひん', 'さくら', 'さこく', 'さこつ', 'さずかる', 'ざせき', 'さたん', 'さつえい', 'ざつおん', 'ざっか', 'ざつがく', 'さっきょく', 'ざっし', 'さつじん', 'ざっそう', 'さつたば', 'さつまいも', 'さてい', 'さといも', 'さとう', 'さとおや', 'さとし', 'さとる', 'さのう', 'さばく', 'さびしい', 'さべつ', 'さほう', 'さほど', 'さます', 'さみしい', 'さみだれ', 'さむけ', 'さめる', 'さやえんどう', 'さゆう', 'さよう', 'さよく', 'さらだ', 'ざるそば', 'さわやか', 'さわる', 'さんいん', 'さんか', 'さんきゃく', 'さんこう', 'さんさい', 'ざんしょ', 'さんすう', 'さんせい', 'さんそ', 'さんち', 'さんま', 'さんみ', 'さんらん', 'しあい', 'しあげ', 'しあさって', 'しあわせ', 'しいく', 'しいん', 'しうち', 'しえい', 'しおけ', 'しかい', 'しかく', 'じかん', 'しごと', 'しすう', 'じだい', 'したうけ', 'したぎ', 'したて', 'したみ', 'しちょう', 'しちりん', 'しっかり', 'しつじ', 'しつもん', 'してい', 'してき', 'してつ', 'じてん', 'じどう', 'しなぎれ', 'しなもの', 'しなん', 'しねま', 'しねん', 'しのぐ', 'しのぶ', 'しはい', 'しばかり', 'しはつ', 'しはらい', 'しはん', 'しひょう', 'しふく', 'じぶん', 'しへい', 'しほう', 'しほん', 'しまう', 'しまる', 'しみん', 'しむける', 'じむしょ', 'しめい', 'しめる', 'しもん', 'しゃいん', 'しゃうん', 'しゃおん', 'じゃがいも', 'しやくしょ', 'しゃくほう', 'しゃけん', 'しゃこ', 'しゃざい', 'しゃしん', 'しゃせん', 'しゃそう', 'しゃたい', 'しゃちょう', 'しゃっきん', 'じゃま', 'しゃりん', 'しゃれい', 'じゆう', 'じゅうしょ', 'しゅくはく', 'じゅしん', 'しゅっせき', 'しゅみ', 'しゅらば', 'じゅんばん', 'しょうかい', 'しょくたく', 'しょっけん', 'しょどう', 'しょもつ', 'しらせる', 'しらべる', 'しんか', 'しんこう', 'じんじゃ', 'しんせいじ', 'しんちく', 'しんりん', 'すあげ', 'すあし', 'すあな', 'ずあん', 'すいえい', 'すいか', 'すいとう', 'ずいぶん', 'すいようび', 'すうがく', 'すうじつ', 'すうせん', 'すおどり', 'すきま', 'すくう', 'すくない', 'すける', 'すごい', 'すこし', 'ずさん', 'すずしい', 'すすむ', 'すすめる', 'すっかり', 'ずっしり', 'ずっと', 'すてき', 'すてる', 'すねる', 'すのこ', 'すはだ', 'すばらしい', 'ずひょう', 'ずぶぬれ', 'すぶり', 'すふれ', 'すべて', 'すべる', 'ずほう', 'すぼん', 'すまい', 'すめし', 'すもう', 'すやき', 'すらすら', 'するめ', 'すれちがう', 'すろっと', 'すわる', 'すんぜん', 'すんぽう', 'せあぶら', 'せいかつ', 'せいげん', 'せいじ', 'せいよう', 'せおう', 'せかいかん', 'せきにん', 'せきむ', 'せきゆ', 'せきらんうん', 'せけん', 'せこう', 'せすじ', 'せたい', 'せたけ', 'せっかく', 'せっきゃく', 'ぜっく', 'せっけん', 'せっこつ', 'せっさたくま', 'せつぞく', 'せつだん', 'せつでん', 'せっぱん', 'せつび', 'せつぶん', 'せつめい', 'せつりつ', 'せなか', 'せのび', 'せはば', 'せびろ', 'せぼね', 'せまい', 'せまる', 'せめる', 'せもたれ', 'せりふ', 'ぜんあく', 'せんい', 'せんえい', 'せんか', 'せんきょ', 'せんく', 'せんげん', 'ぜんご', 'せんさい', 'せんしゅ', 'せんすい', 'せんせい', 'せんぞ', 'せんたく', 'せんちょう', 'せんてい', 'せんとう', 'せんぬき', 'せんねん', 'せんぱい', 'ぜんぶ', 'ぜんぽう', 'せんむ', 'せんめんじょ', 'せんもん', 'せんやく', 'せんゆう', 'せんよう', 'ぜんら', 'ぜんりゃく', 'せんれい', 'せんろ', 'そあく', 'そいとげる', 'そいね', 'そうがんきょう', 'そうき', 'そうご', 'そうしん', 'そうだん', 'そうなん', 'そうび', 'そうめん', 'そうり', 'そえもの', 'そえん', 'そがい', 'そげき', 'そこう', 'そこそこ', 'そざい', 'そしな', 'そせい', 'そせん', 'そそぐ', 'そだてる', 'そつう', 'そつえん', 'そっかん', 'そつぎょう', 'そっけつ', 'そっこう', 'そっせん', 'そっと', 'そとがわ', 'そとづら', 'そなえる', 'そなた', 'そふぼ', 'そぼく', 'そぼろ', 'そまつ', 'そまる', 'そむく', 'そむりえ', 'そめる', 'そもそも', 'そよかぜ', 'そらまめ', 'そろう', 'そんかい', 'そんけい', 'そんざい', 'そんしつ', 'そんぞく', 'そんちょう', 'ぞんび', 'ぞんぶん', 'そんみん', 'たあい', 'たいいん', 'たいうん', 'たいえき', 'たいおう', 'だいがく', 'たいき', 'たいぐう', 'たいけん', 'たいこ', 'たいざい', 'だいじょうぶ', 'だいすき', 'たいせつ', 'たいそう', 'だいたい', 'たいちょう', 'たいてい', 'だいどころ', 'たいない', 'たいねつ', 'たいのう', 'たいはん', 'だいひょう', 'たいふう', 'たいへん', 'たいほ', 'たいまつばな', 'たいみんぐ', 'たいむ', 'たいめん', 'たいやき', 'たいよう', 'たいら', 'たいりょく', 'たいる', 'たいわん', 'たうえ', 'たえる', 'たおす', 'たおる', 'たおれる', 'たかい', 'たかね', 'たきび', 'たくさん', 'たこく', 'たこやき', 'たさい', 'たしざん', 'だじゃれ', 'たすける', 'たずさわる', 'たそがれ', 'たたかう', 'たたく', 'ただしい', 'たたみ', 'たちばな', 'だっかい', 'だっきゃく', 'だっこ', 'だっしゅつ', 'だったい', 'たてる', 'たとえる', 'たなばた', 'たにん', 'たぬき', 'たのしみ', 'たはつ', 'たぶん', 'たべる', 'たぼう', 'たまご', 'たまる', 'だむる', 'ためいき', 'ためす', 'ためる', 'たもつ', 'たやすい', 'たよる', 'たらす', 'たりきほんがん', 'たりょう', 'たりる', 'たると', 'たれる', 'たれんと', 'たろっと', 'たわむれる', 'だんあつ', 'たんい', 'たんおん', 'たんか', 'たんき', 'たんけん', 'たんご', 'たんさん', 'たんじょうび', 'だんせい', 'たんそく', 'たんたい', 'だんち', 'たんてい', 'たんとう', 'だんな', 'たんにん', 'だんねつ', 'たんのう', 'たんぴん', 'だんぼう', 'たんまつ', 'たんめい', 'だんれつ', 'だんろ', 'だんわ', 'ちあい', 'ちあん', 'ちいき', 'ちいさい', 'ちえん', 'ちかい', 'ちから', 'ちきゅう', 'ちきん', 'ちけいず', 'ちけん', 'ちこく', 'ちさい', 'ちしき', 'ちしりょう', 'ちせい', 'ちそう', 'ちたい', 'ちたん', 'ちちおや', 'ちつじょ', 'ちてき', 'ちてん', 'ちぬき', 'ちぬり', 'ちのう', 'ちひょう', 'ちへいせん', 'ちほう', 'ちまた', 'ちみつ', 'ちみどろ', 'ちめいど', 'ちゃんこなべ', 'ちゅうい', 'ちゆりょく', 'ちょうし', 'ちょさくけん', 'ちらし', 'ちらみ', 'ちりがみ', 'ちりょう', 'ちるど', 'ちわわ', 'ちんたい', 'ちんもく', 'ついか', 'ついたち', 'つうか', 'つうじょう', 'つうはん', 'つうわ', 'つかう', 'つかれる', 'つくね', 'つくる', 'つけね', 'つける', 'つごう', 'つたえる', 'つづく', 'つつじ', 'つつむ', 'つとめる', 'つながる', 'つなみ', 'つねづね', 'つのる', 'つぶす', 'つまらない', 'つまる', 'つみき', 'つめたい', 'つもり', 'つもる', 'つよい', 'つるぼ', 'つるみく', 'つわもの', 'つわり', 'てあし', 'てあて', 'てあみ', 'ていおん', 'ていか', 'ていき', 'ていけい', 'ていこく', 'ていさつ', 'ていし', 'ていせい', 'ていたい', 'ていど', 'ていねい', 'ていひょう', 'ていへん', 'ていぼう', 'てうち', 'ておくれ', 'てきとう', 'てくび', 'でこぼこ', 'てさぎょう', 'てさげ', 'てすり', 'てそう', 'てちがい', 'てちょう', 'てつがく', 'てつづき', 'でっぱ', 'てつぼう', 'てつや', 'でぬかえ', 'てぬき', 'てぬぐい', 'てのひら', 'てはい', 'てぶくろ', 'てふだ', 'てほどき', 'てほん', 'てまえ', 'てまきずし', 'てみじか', 'てみやげ', 'てらす', 'てれび', 'てわけ', 'てわたし', 'でんあつ', 'てんいん', 'てんかい', 'てんき', 'てんぐ', 'てんけん', 'てんごく', 'てんさい', 'てんし', 'てんすう', 'でんち', 'てんてき', 'てんとう', 'てんない', 'てんぷら', 'てんぼうだい', 'てんめつ', 'てんらんかい', 'でんりょく', 'でんわ', 'どあい', 'といれ', 'どうかん', 'とうきゅう', 'どうぐ', 'とうし', 'とうむぎ', 'とおい', 'とおか', 'とおく', 'とおす', 'とおる', 'とかい', 'とかす', 'ときおり', 'ときどき', 'とくい', 'とくしゅう', 'とくてん', 'とくに', 'とくべつ', 'とけい', 'とける', 'とこや', 'とさか', 'としょかん', 'とそう', 'とたん', 'とちゅう', 'とっきゅう', 'とっくん', 'とつぜん', 'とつにゅう', 'とどける', 'ととのえる', 'とない', 'となえる', 'となり', 'とのさま', 'とばす', 'どぶがわ', 'とほう', 'とまる', 'とめる', 'ともだち', 'ともる', 'どようび', 'とらえる', 'とんかつ', 'どんぶり', 'ないかく', 'ないこう', 'ないしょ', 'ないす', 'ないせん', 'ないそう', 'なおす', 'ながい', 'なくす', 'なげる', 'なこうど', 'なさけ', 'なたでここ', 'なっとう', 'なつやすみ', 'ななおし', 'なにごと', 'なにもの', 'なにわ', 'なのか', 'なふだ', 'なまいき', 'なまえ', 'なまみ', 'なみだ', 'なめらか', 'なめる', 'なやむ', 'ならう', 'ならび', 'ならぶ', 'なれる', 'なわとび', 'なわばり', 'にあう', 'にいがた', 'にうけ', 'におい', 'にかい', 'にがて', 'にきび', 'にくしみ', 'にくまん', 'にげる', 'にさんかたんそ', 'にしき', 'にせもの', 'にちじょう', 'にちようび', 'にっか', 'にっき', 'にっけい', 'にっこう', 'にっさん', 'にっしょく', 'にっすう', 'にっせき', 'にってい', 'になう', 'にほん', 'にまめ', 'にもつ', 'にやり', 'にゅういん', 'にりんしゃ', 'にわとり', 'にんい', 'にんか', 'にんき', 'にんげん', 'にんしき', 'にんずう', 'にんそう', 'にんたい', 'にんち', 'にんてい', 'にんにく', 'にんぷ', 'にんまり', 'にんむ', 'にんめい', 'にんよう', 'ぬいくぎ', 'ぬかす', 'ぬぐいとる', 'ぬぐう', 'ぬくもり', 'ぬすむ', 'ぬまえび', 'ぬめり', 'ぬらす', 'ぬんちゃく', 'ねあげ', 'ねいき', 'ねいる', 'ねいろ', 'ねぐせ', 'ねくたい', 'ねくら', 'ねこぜ', 'ねこむ', 'ねさげ', 'ねすごす', 'ねそべる', 'ねだん', 'ねつい', 'ねっしん', 'ねつぞう', 'ねったいぎょ', 'ねぶそく', 'ねふだ', 'ねぼう', 'ねほりはほり', 'ねまき', 'ねまわし', 'ねみみ', 'ねむい', 'ねむたい', 'ねもと', 'ねらう', 'ねわざ', 'ねんいり', 'ねんおし', 'ねんかん', 'ねんきん', 'ねんぐ', 'ねんざ', 'ねんし', 'ねんちゃく', 'ねんど', 'ねんぴ', 'ねんぶつ', 'ねんまつ', 'ねんりょう', 'ねんれい', 'のいず', 'のおづま', 'のがす', 'のきなみ', 'のこぎり', 'のこす', 'のこる', 'のせる', 'のぞく', 'のぞむ', 'のたまう', 'のちほど', 'のっく', 'のばす', 'のはら', 'のべる', 'のぼる', 'のみもの', 'のやま', 'のらいぬ', 'のらねこ', 'のりもの', 'のりゆき', 'のれん', 'のんき', 'ばあい', 'はあく', 'ばあさん', 'ばいか', 'ばいく', 'はいけん', 'はいご', 'はいしん', 'はいすい', 'はいせん', 'はいそう', 'はいち', 'ばいばい', 'はいれつ', 'はえる', 'はおる', 'はかい', 'ばかり', 'はかる', 'はくしゅ', 'はけん', 'はこぶ', 'はさみ', 'はさん', 'はしご', 'ばしょ', 'はしる', 'はせる', 'ぱそこん', 'はそん', 'はたん', 'はちみつ', 'はつおん', 'はっかく', 'はづき', 'はっきり', 'はっくつ', 'はっけん', 'はっこう', 'はっさん', 'はっしん', 'はったつ', 'はっちゅう', 'はってん', 'はっぴょう', 'はっぽう', 'はなす', 'はなび', 'はにかむ', 'はぶらし', 'はみがき', 'はむかう', 'はめつ', 'はやい', 'はやし', 'はらう', 'はろうぃん', 'はわい', 'はんい', 'はんえい', 'はんおん', 'はんかく', 'はんきょう', 'ばんぐみ', 'はんこ', 'はんしゃ', 'はんすう', 'はんだん', 'ぱんち', 'ぱんつ', 'はんてい', 'はんとし', 'はんのう', 'はんぱ', 'はんぶん', 'はんぺん', 'はんぼうき', 'はんめい', 'はんらん', 'はんろん', 'ひいき', 'ひうん', 'ひえる', 'ひかく', 'ひかり', 'ひかる', 'ひかん', 'ひくい', 'ひけつ', 'ひこうき', 'ひこく', 'ひさい', 'ひさしぶり', 'ひさん', 'びじゅつかん', 'ひしょ', 'ひそか', 'ひそむ', 'ひたむき', 'ひだり', 'ひたる', 'ひつぎ', 'ひっこし', 'ひっし', 'ひつじゅひん', 'ひっす', 'ひつぜん', 'ぴったり', 'ぴっちり', 'ひつよう', 'ひてい', 'ひとごみ', 'ひなまつり', 'ひなん', 'ひねる', 'ひはん', 'ひびく', 'ひひょう', 'ひほう', 'ひまわり', 'ひまん', 'ひみつ', 'ひめい', 'ひめじし', 'ひやけ', 'ひやす', 'ひよう', 'びょうき', 'ひらがな', 'ひらく', 'ひりつ', 'ひりょう', 'ひるま', 'ひるやすみ', 'ひれい', 'ひろい', 'ひろう', 'ひろき', 'ひろゆき', 'ひんかく', 'ひんけつ', 'ひんこん', 'ひんしゅ', 'ひんそう', 'ぴんち', 'ひんぱん', 'びんぼう', 'ふあん', 'ふいうち', 'ふうけい', 'ふうせん', 'ぷうたろう', 'ふうとう', 'ふうふ', 'ふえる', 'ふおん', 'ふかい', 'ふきん', 'ふくざつ', 'ふくぶくろ', 'ふこう', 'ふさい', 'ふしぎ', 'ふじみ', 'ふすま', 'ふせい', 'ふせぐ', 'ふそく', 'ぶたにく', 'ふたん', 'ふちょう', 'ふつう', 'ふつか', 'ふっかつ', 'ふっき', 'ふっこく', 'ぶどう', 'ふとる', 'ふとん', 'ふのう', 'ふはい', 'ふひょう', 'ふへん', 'ふまん', 'ふみん', 'ふめつ', 'ふめん', 'ふよう', 'ふりこ', 'ふりる', 'ふるい', 'ふんいき', 'ぶんがく', 'ぶんぐ', 'ふんしつ', 'ぶんせき', 'ふんそう', 'ぶんぽう', 'へいあん', 'へいおん', 'へいがい', 'へいき', 'へいげん', 'へいこう', 'へいさ', 'へいしゃ', 'へいせつ', 'へいそ', 'へいたく', 'へいてん', 'へいねつ', 'へいわ', 'へきが', 'へこむ', 'べにいろ', 'べにしょうが', 'へらす', 'へんかん', 'べんきょう', 'べんごし', 'へんさい', 'へんたい', 'べんり', 'ほあん', 'ほいく', 'ぼうぎょ', 'ほうこく', 'ほうそう', 'ほうほう', 'ほうもん', 'ほうりつ', 'ほえる', 'ほおん', 'ほかん', 'ほきょう', 'ぼきん', 'ほくろ', 'ほけつ', 'ほけん', 'ほこう', 'ほこる', 'ほしい', 'ほしつ', 'ほしゅ', 'ほしょう', 'ほせい', 'ほそい', 'ほそく', 'ほたて', 'ほたる', 'ぽちぶくろ', 'ほっきょく', 'ほっさ', 'ほったん', 'ほとんど', 'ほめる', 'ほんい', 'ほんき', 'ほんけ', 'ほんしつ', 'ほんやく', 'まいにち', 'まかい', 'まかせる', 'まがる', 'まける', 'まこと', 'まさつ', 'まじめ', 'ますく', 'まぜる', 'まつり', 'まとめ', 'まなぶ', 'まぬけ', 'まねく', 'まほう', 'まもる', 'まゆげ', 'まよう', 'まろやか', 'まわす', 'まわり', 'まわる', 'まんが', 'まんきつ', 'まんぞく', 'まんなか', 'みいら', 'みうち', 'みえる', 'みがく', 'みかた', 'みかん', 'みけん', 'みこん', 'みじかい', 'みすい', 'みすえる', 'みせる', 'みっか', 'みつかる', 'みつける', 'みてい', 'みとめる', 'みなと', 'みなみかさい', 'みねらる', 'みのう', 'みのがす', 'みほん', 'みもと', 'みやげ', 'みらい', 'みりょく', 'みわく', 'みんか', 'みんぞく', 'むいか', 'むえき', 'むえん', 'むかい', 'むかう', 'むかえ', 'むかし', 'むぎちゃ', 'むける', 'むげん', 'むさぼる', 'むしあつい', 'むしば', 'むじゅん', 'むしろ', 'むすう', 'むすこ', 'むすぶ', 'むすめ', 'むせる', 'むせん', 'むちゅう', 'むなしい', 'むのう', 'むやみ', 'むよう', 'むらさき', 'むりょう', 'むろん', 'めいあん', 'めいうん', 'めいえん', 'めいかく', 'めいきょく', 'めいさい', 'めいし', 'めいそう', 'めいぶつ', 'めいれい', 'めいわく', 'めぐまれる', 'めざす', 'めした', 'めずらしい', 'めだつ', 'めまい', 'めやす', 'めんきょ', 'めんせき', 'めんどう', 'もうしあげる', 'もうどうけん', 'もえる', 'もくし', 'もくてき', 'もくようび', 'もちろん', 'もどる', 'もらう', 'もんく', 'もんだい', 'やおや', 'やける', 'やさい', 'やさしい', 'やすい', 'やすたろう', 'やすみ', 'やせる', 'やそう', 'やたい', 'やちん', 'やっと', 'やっぱり', 'やぶる', 'やめる', 'ややこしい', 'やよい', 'やわらかい', 'ゆうき', 'ゆうびんきょく', 'ゆうべ', 'ゆうめい', 'ゆけつ', 'ゆしゅつ', 'ゆせん', 'ゆそう', 'ゆたか', 'ゆちゃく', 'ゆでる', 'ゆにゅう', 'ゆびわ', 'ゆらい', 'ゆれる', 'ようい', 'ようか', 'ようきゅう', 'ようじ', 'ようす', 'ようちえん', 'よかぜ', 'よかん', 'よきん', 'よくせい', 'よくぼう', 'よけい', 'よごれる', 'よさん', 'よしゅう', 'よそう', 'よそく', 'よっか', 'よてい', 'よどがわく', 'よねつ', 'よやく', 'よゆう', 'よろこぶ', 'よろしい', 'らいう', 'らくがき', 'らくご', 'らくさつ', 'らくだ', 'らしんばん', 'らせん', 'らぞく', 'らたい', 'らっか', 'られつ', 'りえき', 'りかい', 'りきさく', 'りきせつ', 'りくぐん', 'りくつ', 'りけん', 'りこう', 'りせい', 'りそう', 'りそく', 'りてん', 'りねん', 'りゆう', 'りゅうがく', 'りよう', 'りょうり', 'りょかん', 'りょくちゃ', 'りょこう', 'りりく', 'りれき', 'りろん', 'りんご', 'るいけい', 'るいさい', 'るいじ', 'るいせき', 'るすばん', 'るりがわら', 'れいかん', 'れいぎ', 'れいせい', 'れいぞうこ', 'れいとう', 'れいぼう', 'れきし', 'れきだい', 'れんあい', 'れんけい', 'れんこん', 'れんさい', 'れんしゅう', 'れんぞく', 'れんらく', 'ろうか', 'ろうご', 'ろうじん', 'ろうそく', 'ろくが', 'ろこつ', 'ろじうら', 'ろしゅつ', 'ろせん', 'ろてん', 'ろめん', 'ろれつ', 'ろんぎ', 'ろんぱ', 'ろんぶん', 'ろんり', 'わかす', 'わかめ', 'わかやま', 'わかれる', 'わしつ', 'わじまし', 'わすれもの', 'わらう', 'われる'];
wordList$1.space = '　';

/**
 * KeyPair
 * =======
 *
 * A keyPair is a collection of a private key and a public key.
 * const keyPair = new KeyPair().fromRandom()
 * const keyPair = new KeyPair().fromPrivKey(privKey)
 * const privKey = keyPair.privKey
 * const pubKey = keyPair.pubKey
 */

class KeyPair extends Struct {
  constructor(privKey, pubKey, PrivKey$1 = PrivKey) {
    super({
      privKey,
      pubKey
    });
    this.PrivKey = PrivKey$1;
  }

  fromJSON(json) {
    if (json.privKey) {
      this.privKey = this.PrivKey.fromJSON(json.privKey);
    }

    if (json.pubKey) {
      this.pubKey = PubKey.fromJSON(json.pubKey);
    }

    return this;
  }

  fromBr(br) {
    const buflen1 = br.readUInt8();

    if (buflen1 > 0) {
      this.privKey = new this.PrivKey().fromFastBuffer(br.read(buflen1));
    }

    const buflen2 = br.readUInt8();

    if (buflen2 > 0) {
      this.pubKey = new PubKey().fromFastBuffer(br.read(buflen2));
    }

    return this;
  }

  toBw(bw) {
    if (!bw) {
      bw = new Bw();
    }

    if (this.privKey) {
      const privKeybuf = this.privKey.toFastBuffer();
      bw.writeUInt8(privKeybuf.length);
      bw.write(privKeybuf);
    } else {
      bw.writeUInt8(0);
    }

    if (this.pubKey) {
      const pubKeybuf = this.pubKey.toFastBuffer();
      bw.writeUInt8(pubKeybuf.length);
      bw.write(pubKeybuf);
    } else {
      bw.writeUInt8(0);
    }

    return bw;
  }

  fromString(str) {
    return this.fromJSON(JSON.parse(str));
  }

  toString() {
    return JSON.stringify(this.toJSON());
  }

  toPublic() {
    const keyPair = new KeyPair().fromObject(this);
    keyPair.privKey = undefined;
    return keyPair;
  }

  fromPrivKey(privKey) {
    this.privKey = privKey;
    this.pubKey = new PubKey().fromPrivKey(privKey);
    return this;
  }

  static fromPrivKey(privKey) {
    return new this().fromPrivKey(privKey);
  }

  async asyncFromPrivKey(privKey) {
    this.privKey = privKey;
    this.pubKey = await new PubKey().asyncFromPrivKey(privKey);
    return this;
  }

  static asyncFromPrivKey(privKey) {
    return new this().asyncFromPrivKey(privKey);
  }

  fromRandom() {
    this.privKey = new this.PrivKey().fromRandom();
    this.pubKey = new PubKey().fromPrivKey(this.privKey);
    return this;
  }

  static fromRandom() {
    return new this().fromRandom();
  }

  async asyncFromRandom() {
    this.privKey = new this.PrivKey().fromRandom();
    return this.asyncFromPrivKey(this.privKey);
  }

  static asyncFromRandom() {
    return new this().asyncFromRandom();
  }

}

KeyPair.Mainnet = class extends KeyPair {
  constructor(privKey, pubKey) {
    super(privKey, pubKey, PrivKey.Mainnet);
  }

};
KeyPair.Testnet = class extends KeyPair {
  constructor(privKey, pubKey) {
    super(privKey, pubKey, PrivKey.Testnet);
  }

};

/**
 * Ecdsa
 * =====
 *
 * Ecdsa is the signature algorithm used by bitcoin. The way you probably want
 * to use this is with the static Ecdsa.sign( ... ) and Ecdsa.verify( ... )
 * functions. Note that in bitcoin, the hashBuf is little endian, so if you are
 * signing or verifying something that has to do with a transaction, you should
 * explicitly plug in that it is little endian as an option to the sign and
 * verify functions.
 *
 * This implementation of Ecdsa uses deterministic signatures as defined in RFC
 * 6979 as the default, which has become a defacto standard in bitcoin wallets
 * due to recurring security issues around using a value of k pulled from a
 * possibly faulty entropy pool. If you use the same value of k twice, someone
 * can derive your private key. Deterministic k prevents this without needing
 * an entropy pool.
 */

class Ecdsa extends Struct {
  constructor(sig, keyPair, hashBuf, k, endian, verified) {
    super({
      sig,
      keyPair,
      hashBuf,
      k,
      endian,
      verified
    });
  }

  toJSON() {
    return {
      sig: this.sig ? this.sig.toString() : undefined,
      keyPair: this.keyPair ? this.keyPair.toBuffer().toString('hex') : undefined,
      hashBuf: this.hashBuf ? this.hashBuf.toString('hex') : undefined,
      k: this.k ? this.k.toString() : undefined,
      endian: this.endian,
      verified: this.verified
    };
  }

  fromJSON(json) {
    this.sig = json.sig ? new Sig().fromString(json.sig) : undefined;
    this.keyPair = json.keyPair ? new KeyPair().fromBuffer(Buffer.from(json.keyPair, 'hex')) : undefined;
    this.hashBuf = json.hashBuf ? Buffer.from(json.hashBuf, 'hex') : undefined;
    this.k = json.k ? new Bn().fromString(json.k) : undefined;
    this.endian = json.endian;
    this.verified = json.verified;
    return this;
  }

  toBuffer() {
    const str = JSON.stringify(this.toJSON());
    return Buffer.from(str);
  }

  fromBuffer(buf) {
    const json = JSON.parse(buf.toString());
    return this.fromJSON(json);
  }

  calcrecovery() {
    for (let recovery = 0; recovery < 4; recovery++) {
      let Qprime;
      this.sig.recovery = recovery;

      try {
        Qprime = this.sig2PubKey();
      } catch (e) {
        continue;
      }

      if (Qprime.point.eq(this.keyPair.pubKey.point)) {
        const compressed = this.keyPair.pubKey.compressed;
        this.sig.compressed = this.keyPair.pubKey.compressed === undefined ? true : compressed;
        return this;
      }
    }

    this.sig.recovery = undefined;
    throw new Error('Unable to find valid recovery factor');
  }

  async asyncCalcrecovery() {
    const workersResult = await Workers.asyncObjectMethod(this, 'calcrecovery', []);
    return this.fromFastBuffer(workersResult.resbuf);
  }
  /**
     * Calculates the recovery factor, and mutates sig so that it now contains
     * the recovery factor and the "compressed" variable. Throws an exception on
     * failure.
     */


  static calcrecovery(sig, pubKey, hashBuf) {
    const ecdsa = new Ecdsa().fromObject({
      sig: sig,
      keyPair: new KeyPair().fromObject({
        pubKey: pubKey
      }),
      hashBuf: hashBuf
    });
    return ecdsa.calcrecovery().sig;
  }

  static async asyncCalcrecovery(sig, pubKey, hashBuf) {
    const workersResult = await Workers.asyncClassMethod(Ecdsa, 'calcrecovery', [sig, pubKey, hashBuf]);
    return new Sig().fromFastBuffer(workersResult.resbuf);
  }

  fromString(str) {
    const obj = JSON.parse(str);

    if (obj.hashBuf) {
      this.hashBuf = Buffer.from(obj.hashBuf, 'hex');
    }

    if (obj.keyPair) {
      this.keyPair = new KeyPair().fromString(obj.keyPair);
    }

    if (obj.sig) {
      this.sig = new Sig().fromString(obj.sig);
    }

    if (obj.k) {
      this.k = new Bn(obj.k, 10);
    }

    return this;
  }

  randomK() {
    const N = Point.getN();
    let k;

    do {
      k = new Bn().fromBuffer(Random.getRandomBuffer(32));
    } while (!(k.lt(N) && k.gt(0)));

    this.k = k;
    return this;
  }
  /**
     * The traditional Ecdsa algorithm uses a purely random value of k. This has
     * the negative that when signing, your entropy must be good, or the private
     * key can be recovered if two signatures use the same value of k. It turns out
     * that k does not have to be purely random. It can be deterministic, so long
     * as an attacker can't guess it. RFC 6979 specifies how to do this using a
     * combination of the private key and the hash of the thing to be signed. It is
     * best practice to use this value, which can be tested for byte-for-byte
     * accuracy, and is resistant to a broken RNG. Note that it is actually the
     * case that bitcoin private keys have been compromised through that attack.
     * Deterministic k is a best practice.
     *
     * https://tools.ietf.org/html/rfc6979#section-3.2
     */


  deterministicK(badrs) {
    let v = Buffer.alloc(32);
    v.fill(0x01);
    let k = Buffer.alloc(32);
    k.fill(0x00);
    const x = this.keyPair.privKey.bn.toBuffer({
      size: 32
    });
    k = Hash.sha256Hmac(Buffer.concat([v, Buffer.from([0x00]), x, this.hashBuf]), k);
    v = Hash.sha256Hmac(v, k);
    k = Hash.sha256Hmac(Buffer.concat([v, Buffer.from([0x01]), x, this.hashBuf]), k);
    v = Hash.sha256Hmac(v, k);
    v = Hash.sha256Hmac(v, k);
    let T = new Bn().fromBuffer(v);
    const N = Point.getN(); // if r or s were invalid when this function was used in signing,
    // we do not want to actually compute r, s here for efficiency, so,
    // we can increment badrs. explained at end of RFC 6979 section 3.2

    if (badrs === undefined) {
      badrs = 0;
    } // also explained in 3.2, we must ensure T is in the proper range (0, N)


    for (let i = 0; i < badrs || !(T.lt(N) && T.gt(0)); i++) {
      k = Hash.sha256Hmac(Buffer.concat([v, Buffer.from([0x00])]), k);
      v = Hash.sha256Hmac(v, k);
      v = Hash.sha256Hmac(v, k);
      T = new Bn().fromBuffer(v);
    }

    this.k = T;
    return this;
  }
  /**
     * Information about public key recovery:
     * https://bitcointalk.org/index.php?topic=6430.0
     * http://stackoverflow.com/questions/19665491/how-do-i-get-an-ecdsa-public-key-from-just-a-bitcoin-signature-sec1-4-1-6-k
     * This code was originally taken from BitcoinJS
     */


  sig2PubKey() {
    const recovery = this.sig.recovery;

    if (!(recovery === 0 || recovery === 1 || recovery === 2 || recovery === 3)) {
      throw new Error('i must be equal to 0, 1, 2, or 3');
    }

    const e = new Bn().fromBuffer(this.hashBuf);
    const r = this.sig.r;
    const s = this.sig.s; // A set LSB signifies that the y-coordinate is odd

    const isYOdd = recovery & 1; // The more significant bit specifies whether we should use the
    // first or second candidate key.

    const isSecondKey = recovery >> 1;
    const n = Point.getN();
    const G = Point.getG(); // 1.1 LEt x = r + jn

    const x = isSecondKey ? r.add(n) : r;
    const R = Point.fromX(isYOdd, x); // 1.4 Check that nR is at infinity

    let errm = '';

    try {
      R.mul(n);
    } catch (err) {
      errm = err.message;
    }

    if (errm !== 'point mul out of range') {
      throw new Error('nR is not a valid curve point');
    } // Compute -e from e


    const eNeg = e.neg().umod(n); // 1.6.1 Compute Q = r^-1 (sR - eG)
    // Q = r^-1 (sR + -eG)

    const rInv = r.invm(n); // const Q = R.multiplyTwo(s, G, eNeg).mul(rInv)

    const Q = R.mul(s).add(G.mul(eNeg)).mul(rInv);
    const pubKey = new PubKey(Q);
    pubKey.compressed = this.sig.compressed;
    pubKey.validate();
    return pubKey;
  }

  async asyncSig2PubKey() {
    const workersResult = await Workers.asyncObjectMethod(this, 'sig2PubKey', []);
    return PubKey.fromFastBuffer(workersResult.resbuf);
  }

  static sig2PubKey(sig, hashBuf) {
    const ecdsa = new Ecdsa().fromObject({
      sig: sig,
      hashBuf: hashBuf
    });
    return ecdsa.sig2PubKey();
  }

  static async asyncSig2PubKey(sig, hashBuf) {
    const ecdsa = new Ecdsa().fromObject({
      sig: sig,
      hashBuf: hashBuf
    });
    const pubKey = await ecdsa.asyncSig2PubKey();
    return pubKey;
  }

  verifyStr(enforceLowS = true) {
    if (!Buffer.isBuffer(this.hashBuf) || this.hashBuf.length !== 32) {
      return 'hashBuf must be a 32 byte buffer';
    }

    try {
      this.keyPair.pubKey.validate();
    } catch (e) {
      return 'Invalid pubKey: ' + e;
    }

    const r = this.sig.r;
    const s = this.sig.s;

    if (!(r.gt(0) && r.lt(Point.getN())) || !(s.gt(0) && s.lt(Point.getN()))) {
      return 'r and s not in range';
    }

    if (enforceLowS) {
      if (!this.sig.hasLowS()) {
        return 's is too high and does not satisfy low s contraint - see bip 62';
      }
    }

    const e = new Bn().fromBuffer(this.hashBuf, this.endian ? {
      endian: this.endian
    } : undefined);
    const n = Point.getN();
    const sinv = s.invm(n);
    const u1 = sinv.mul(e).mod(n);
    const u2 = sinv.mul(r).mod(n);
    const p = Point.getG().mulAdd(u1, this.keyPair.pubKey.point, u2); // const p = Point.getG().mulAdd(u1, this.keyPair.pubKey.point, u2)

    if (p.isInfinity()) {
      return 'p is infinity';
    }

    if (!(p.getX().mod(n).cmp(r) === 0)) {
      return 'Invalid signature';
    } else {
      return false;
    }
  }

  sign() {
    const hashBuf = this.endian === 'little' ? new Br(this.hashBuf).readReverse() : this.hashBuf;
    const privKey = this.keyPair.privKey;
    const d = privKey.bn;

    if (!hashBuf || !privKey || !d) {
      throw new Error('invalid parameters');
    }

    if (!Buffer.isBuffer(hashBuf) || hashBuf.length !== 32) {
      throw new Error('hashBuf must be a 32 byte buffer');
    }

    const N = Point.getN();
    const G = Point.getG();
    const e = new Bn().fromBuffer(hashBuf); // try different values of k until r, s are valid

    let badrs = 0;
    let k, Q, r, s;

    do {
      if (!this.k || badrs > 0) {
        this.deterministicK(badrs);
      }

      badrs++;
      k = this.k;
      Q = G.mul(k);
      r = Q.getX().mod(N);
      s = k.invm(N).mul(e.add(d.mul(r))).mod(N);
    } while (r.cmp(0) <= 0 || s.cmp(0) <= 0); // enforce low s
    // see Bip 62, "low S values in signatures"


    if (s.gt(new Bn().fromBuffer(Buffer.from('7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A0', 'hex')))) {
      s = Point.getN().sub(s);
    }

    this.sig = Sig.fromObject({
      r: r,
      s: s,
      compressed: this.keyPair.pubKey.compressed
    });
    return this;
  }

  async asyncSign() {
    const workersResult = await Workers.asyncObjectMethod(this, 'sign', []);
    return this.fromFastBuffer(workersResult.resbuf);
  }

  signRandomK() {
    this.randomK();
    return this.sign();
  }

  toString() {
    const obj = {};

    if (this.hashBuf) {
      obj.hashBuf = this.hashBuf.toString('hex');
    }

    if (this.keyPair) {
      obj.keyPair = this.keyPair.toString();
    }

    if (this.sig) {
      obj.sig = this.sig.toString();
    }

    if (this.k) {
      obj.k = this.k.toString();
    }

    return JSON.stringify(obj);
  }

  verify(enforceLowS = true) {
    if (!this.verifyStr(enforceLowS)) {
      this.verified = true;
    } else {
      this.verified = false;
    }

    return this;
  }

  async asyncVerify(enforceLowS = true) {
    const workersResult = await Workers.asyncObjectMethod(this, 'verify', [enforceLowS]);
    return this.fromFastBuffer(workersResult.resbuf);
  }

  static sign(hashBuf, keyPair, endian) {
    return new Ecdsa().fromObject({
      hashBuf: hashBuf,
      endian: endian,
      keyPair: keyPair
    }).sign().sig;
  }

  static async asyncSign(hashBuf, keyPair, endian) {
    const ecdsa = new Ecdsa().fromObject({
      hashBuf: hashBuf,
      endian: endian,
      keyPair: keyPair
    });
    await ecdsa.asyncSign();
    return ecdsa.sig;
  }

  static verify(hashBuf, sig, pubKey, endian, enforceLowS = true) {
    return new Ecdsa().fromObject({
      hashBuf: hashBuf,
      endian: endian,
      sig: sig,
      keyPair: new KeyPair().fromObject({
        pubKey: pubKey
      })
    }).verify(enforceLowS).verified;
  }

  static async asyncVerify(hashBuf, sig, pubKey, endian, enforceLowS = true) {
    const ecdsa = new Ecdsa().fromObject({
      hashBuf: hashBuf,
      endian: endian,
      sig: sig,
      keyPair: new KeyPair().fromObject({
        pubKey: pubKey
      })
    });
    await ecdsa.asyncVerify(enforceLowS);
    return ecdsa.verified;
  }

}

/**
 * Bitcoin Signed Message
 * ======================
 *
 * "Bitcoin Signed Message" just refers to a standard way of signing and
 * verifying an arbitrary message. The standard way to do this involves using a
 * "Bitcoin Signed Message:\n" prefix, which this code does. You are probably
 * interested in the static Bsm.sign( ... ) and Bsm.verify( ... ) functions,
 * which deal with a base64 string representing the compressed format of a
 * signature.
 */

class Bsm extends Struct {
  constructor(messageBuf, keyPair, sig, address, verified) {
    super({
      messageBuf,
      keyPair,
      sig,
      address,
      verified
    });
  }

  static magicHash(messageBuf) {
    if (!Buffer.isBuffer(messageBuf)) {
      throw new Error('messageBuf must be a buffer');
    }

    const bw = new Bw();
    bw.writeVarIntNum(Bsm.magicBytes.length);
    bw.write(Bsm.magicBytes);
    bw.writeVarIntNum(messageBuf.length);
    bw.write(messageBuf);
    const buf = bw.toBuffer();
    const hashBuf = Hash.sha256Sha256(buf);
    return hashBuf;
  }

  static async asyncMagicHash(messageBuf) {
    const args = [messageBuf];
    const workersResult = await Workers.asyncClassMethod(Bsm, 'magicHash', args);
    return workersResult.resbuf;
  }

  static sign(messageBuf, keyPair) {
    const m = new Bsm(messageBuf, keyPair);
    m.sign();
    const sigbuf = m.sig.toCompact();
    const sigstr = sigbuf.toString('base64');
    return sigstr;
  }

  static async asyncSign(messageBuf, keyPair) {
    const args = [messageBuf, keyPair];
    const workersResult = await Workers.asyncClassMethod(Bsm, 'sign', args);
    const sigstr = JSON.parse(workersResult.resbuf.toString());
    return sigstr;
  }

  static verify(messageBuf, sigstr, address) {
    const sigbuf = Buffer.from(sigstr, 'base64');
    const message = new Bsm();
    message.messageBuf = messageBuf;
    message.sig = new Sig().fromCompact(sigbuf);
    message.address = address;
    return message.verify().verified;
  }

  static async asyncVerify(messageBuf, sigstr, address) {
    const args = [messageBuf, sigstr, address];
    const workersResult = await Workers.asyncClassMethod(Bsm, 'verify', args);
    const res = JSON.parse(workersResult.resbuf.toString());
    return res;
  }

  sign() {
    const hashBuf = Bsm.magicHash(this.messageBuf);
    const ecdsa = new Ecdsa().fromObject({
      hashBuf: hashBuf,
      keyPair: this.keyPair
    });
    ecdsa.sign();
    ecdsa.calcrecovery();
    this.sig = ecdsa.sig;
    return this;
  }

  verify() {
    const hashBuf = Bsm.magicHash(this.messageBuf);
    const ecdsa = new Ecdsa();
    ecdsa.hashBuf = hashBuf;
    ecdsa.sig = this.sig;
    ecdsa.keyPair = new KeyPair();
    ecdsa.keyPair.pubKey = ecdsa.sig2PubKey();

    if (!ecdsa.verify()) {
      this.verified = false;
      return this;
    }

    const address = new Address().fromPubKey(ecdsa.keyPair.pubKey, undefined, this.sig.compressed); // TODO: what if livenet/testnet mismatch?

    if (cmp(address.hashBuf, this.address.hashBuf)) {
      this.verified = true;
    } else {
      this.verified = false;
    }

    return this;
  }

}

Bsm.magicBytes = Buffer.from('Bitcoin Signed Message:\n');

/**
 * Block Header
 * ============
 *
 * Every block contains a blockHeader. This is probably not something you will
 * personally use, but it's here if you need it.
 */

class BlockHeader extends Struct {
  constructor(versionBytesNum, prevBlockHashBuf, merkleRootBuf, time, bits, nonce) {
    super({
      versionBytesNum,
      prevBlockHashBuf,
      merkleRootBuf,
      time,
      bits,
      nonce
    });
  }

  fromJSON(json) {
    this.fromObject({
      versionBytesNum: json.versionBytesNum,
      prevBlockHashBuf: Buffer.from(json.prevBlockHashBuf, 'hex'),
      merkleRootBuf: Buffer.from(json.merkleRootBuf, 'hex'),
      time: json.time,
      bits: json.bits,
      nonce: json.nonce
    });
    return this;
  }

  toJSON() {
    return {
      versionBytesNum: this.versionBytesNum,
      prevBlockHashBuf: this.prevBlockHashBuf.toString('hex'),
      merkleRootBuf: this.merkleRootBuf.toString('hex'),
      time: this.time,
      bits: this.bits,
      nonce: this.nonce
    };
  }

  fromBr(br) {
    this.versionBytesNum = br.readUInt32LE();
    this.prevBlockHashBuf = br.read(32);
    this.merkleRootBuf = br.read(32);
    this.time = br.readUInt32LE();
    this.bits = br.readUInt32LE();
    this.nonce = br.readUInt32LE();
    return this;
  }

  toBw(bw) {
    if (!bw) {
      bw = new Bw();
    }

    bw.writeUInt32LE(this.versionBytesNum);
    bw.write(this.prevBlockHashBuf);
    bw.write(this.merkleRootBuf);
    bw.writeUInt32LE(this.time);
    bw.writeUInt32LE(this.bits);
    bw.writeUInt32LE(this.nonce);
    return bw;
  }

}

/**
 * Merkle
 * ======
 *
 * A node in a Merkle tree (possibly the root node, in which case it is the
 * Merkle root). A node either contains a buffer or links to two other nodes.
 */

class Merkle extends Struct {
  constructor(hashBuf, buf, merkle1, merkle2) {
    super({
      hashBuf,
      buf,
      merkle1,
      merkle2
    });
  }

  hash() {
    if (this.hashBuf) {
      return this.hashBuf;
    }

    if (this.buf) {
      return Hash.sha256Sha256(this.buf);
    }

    const hashBuf1 = this.merkle1.hash();
    const hashBuf2 = this.merkle2.hash();
    this.buf = Buffer.concat([hashBuf1, hashBuf2]);
    return Hash.sha256Sha256(this.buf);
  }

  fromBuffers(bufs) {
    if (bufs.length < 1) {
      throw new Error('buffers must have a length');
    }

    bufs = bufs.slice();
    const log = Math.log2(bufs.length);

    if (!Number.isInteger(log)) {
      // If a merkle tree does not have a number of ends that is a power of 2,
      // then we have to copy the last value until it is a power of 2. Note
      // that we copy *the actual object* over and over again, which ensures
      // that when we finds its hash, the hash is cached.
      const lastval = bufs[bufs.length - 1];
      var len = Math.pow(2, Math.ceil(log));

      for (let i = bufs.length; i < len; i++) {
        bufs.push(lastval);
      }
    }

    const bufs1 = bufs.slice(0, bufs.length / 2);
    const bufs2 = bufs.slice(bufs.length / 2);
    this.fromBufferArrays(bufs1, bufs2);
    return this;
  }

  static fromBuffers(bufs) {
    return new this().fromBuffers(bufs);
  }
  /**
     * Takes two arrays, both of which *must* be of a length that is a power of
     * two.
     */


  fromBufferArrays(bufs1, bufs2) {
    if (bufs1.length === 1) {
      this.merkle1 = new Merkle(undefined, bufs1[0]);
      this.merkle2 = new Merkle(undefined, bufs2[0]);
      return this;
    }

    const bufs11 = bufs1.slice(0, bufs1.length / 2);
    const bufs12 = bufs1.slice(bufs1.length / 2);
    this.merkle1 = new Merkle().fromBufferArrays(bufs11, bufs12);
    const bufs21 = bufs2.slice(0, bufs2.length / 2);
    const bufs22 = bufs2.slice(bufs2.length / 2);
    this.merkle2 = new Merkle().fromBufferArrays(bufs21, bufs22);
    return this;
  }

  static fromBufferArrays(bufs1, bufs2) {
    return new this().fromBufferArrays(bufs1, bufs2);
  }

  leavesNum() {
    if (this.merkle1) {
      return this.merkle1.leavesNum() + this.merkle2.leavesNum();
    }

    if (this.buf) {
      return 1;
    }

    throw new Error('invalid number of leaves');
  }

}

/**
 * Hash Cache
 * ==========
 *
 * For use in sighash.
 */

class HashCache extends Struct {
  constructor(prevoutsHashBuf, sequenceHashBuf, outputsHashBuf) {
    super();
    this.fromObject({
      prevoutsHashBuf,
      sequenceHashBuf,
      outputsHashBuf
    });
  }

  fromBuffer(buf) {
    return this.fromJSON(JSON.parse(buf.toString()));
  }

  toBuffer() {
    return Buffer.from(JSON.stringify(this.toJSON()));
  }

  fromJSON(json) {
    this.prevoutsHashBuf = json.prevoutsHashBuf ? Buffer.from(json.prevoutsHashBuf, 'hex') : undefined;
    this.sequenceHashBuf = json.sequenceHashBuf ? Buffer.from(json.sequenceHashBuf, 'hex') : undefined;
    this.outputsHashBuf = json.outputsHashBuf ? Buffer.from(json.outputsHashBuf, 'hex') : undefined;
    return this;
  }

  toJSON() {
    return {
      prevoutsHashBuf: this.prevoutsHashBuf ? this.prevoutsHashBuf.toString('hex') : undefined,
      sequenceHashBuf: this.sequenceHashBuf ? this.sequenceHashBuf.toString('hex') : undefined,
      outputsHashBuf: this.outputsHashBuf ? this.outputsHashBuf.toString('hex') : undefined
    };
  }

}

/**
 * VarInt (a.k.a. Compact Size)
 * ============================
 *
 * A varInt is a varible sized integer, and it is a format that is unique to
 * bitcoin, and used throughout bitcoin to represent the length of binary data
 * in a compact format that can take up as little as 1 byte or as much as 9
 * bytes.
 */

class VarInt extends Struct {
  constructor(buf) {
    super({
      buf
    });
  }

  fromJSON(json) {
    this.fromObject({
      buf: Buffer.from(json, 'hex')
    });
    return this;
  }

  toJSON() {
    return this.buf.toString('hex');
  }

  fromBuffer(buf) {
    this.buf = buf;
    return this;
  }

  fromBr(br) {
    this.buf = br.readVarIntBuf();
    return this;
  }

  fromBn(bn) {
    this.buf = new Bw().writeVarIntBn(bn).toBuffer();
    return this;
  }

  static fromBn(bn) {
    return new this().fromBn(bn);
  }

  fromNumber(num) {
    this.buf = new Bw().writeVarIntNum(num).toBuffer();
    return this;
  }

  static fromNumber(num) {
    return new this().fromNumber(num);
  }

  toBuffer() {
    return this.buf;
  }

  toBn() {
    return new Br(this.buf).readVarIntBn();
  }

  toNumber() {
    return new Br(this.buf).readVarIntNum();
  }

}

/*
 * Transaction Input
 * =================
 *
 * An input to a transaction. The way you probably want to use this is through
 * the convenient method of new TxIn(txHashBuf, txOutNum, script, nSequence) (i.e., you
 * can leave out the scriptVi, which is computed automatically if you leave it
 * out.)
 */

class TxIn extends Struct {
  constructor(txHashBuf, txOutNum, scriptVi, script, nSequence = 0xffffffff) {
    super({
      txHashBuf,
      txOutNum,
      scriptVi,
      script,
      nSequence
    });
  }

  setScript(script) {
    this.scriptVi = VarInt.fromNumber(script.toBuffer().length);
    this.script = script;
    return this;
  }

  fromProperties(txHashBuf, txOutNum, script, nSequence) {
    this.fromObject({
      txHashBuf,
      txOutNum,
      nSequence
    });
    this.setScript(script);
    return this;
  }

  static fromProperties(txHashBuf, txOutNum, script, nSequence) {
    return new this().fromProperties(txHashBuf, txOutNum, script, nSequence);
  }

  fromJSON(json) {
    this.fromObject({
      txHashBuf: typeof json.txHashBuf !== 'undefined' ? Buffer.from(json.txHashBuf, 'hex') : undefined,
      txOutNum: json.txOutNum,
      scriptVi: typeof json.scriptVi !== 'undefined' ? VarInt.fromJSON(json.scriptVi) : undefined,
      script: typeof json.script !== 'undefined' ? Script.fromJSON(json.script) : undefined,
      nSequence: json.nSequence
    });
    return this;
  }

  toJSON() {
    return {
      txHashBuf: typeof this.txHashBuf !== 'undefined' ? this.txHashBuf.toString('hex') : undefined,
      txOutNum: this.txOutNum,
      scriptVi: typeof this.scriptVi !== 'undefined' ? this.scriptVi.toJSON() : undefined,
      script: typeof this.script !== 'undefined' ? this.script.toJSON() : undefined,
      nSequence: this.nSequence
    };
  }

  fromBr(br) {
    this.txHashBuf = br.read(32);
    this.txOutNum = br.readUInt32LE();
    this.scriptVi = VarInt.fromBuffer(br.readVarIntBuf());
    this.script = Script.fromBuffer(br.read(this.scriptVi.toNumber()));
    this.nSequence = br.readUInt32LE();
    return this;
  }

  toBw(bw) {
    if (!bw) {
      bw = new Bw();
    }

    bw.write(this.txHashBuf);
    bw.writeUInt32LE(this.txOutNum);
    bw.write(this.scriptVi.buf);
    bw.write(this.script.toBuffer());
    bw.writeUInt32LE(this.nSequence);
    return bw;
  }
  /**
     * Generate txIn with blank signatures from a txOut and its
     * txHashBuf+txOutNum. A "blank" signature is just an OP_0. The pubKey also
     * defaults to blank but can be substituted with the real public key if you
     * know what it is.
     */


  fromPubKeyHashTxOut(txHashBuf, txOutNum, txOut, pubKey) {
    const script = new Script();

    if (txOut.script.isPubKeyHashOut()) {
      script.writeOpCode(OpCode.OP_0); // blank signature

      if (pubKey) {
        script.writeBuffer(pubKey.toBuffer());
      } else {
        script.writeOpCode(OpCode.OP_0);
      }
    } else {
      throw new Error('txOut must be of type pubKeyHash');
    }

    this.txHashBuf = txHashBuf;
    this.txOutNum = txOutNum;
    this.setScript(script);
    return this;
  }

  hasNullInput() {
    const hex = this.txHashBuf.toString('hex');

    if (hex === '0000000000000000000000000000000000000000000000000000000000000000' && this.txOutNum === 0xffffffff) {
      return true;
    }

    return false;
  }
  /**
     * Analagous to bitcoind's SetNull in COutPoint
     */


  setNullInput() {
    this.txHashBuf = Buffer.alloc(32);
    this.txHashBuf.fill(0);
    this.txOutNum = 0xffffffff; // -1 cast to unsigned int
  }

}
/* Interpret sequence numbers as relative lock-time constraints. */


TxIn.LOCKTIME_VERIFY_SEQUENCE = 1 << 0;
/* Setting nSequence to this value for every input in a transaction disables
   * nLockTime. */

TxIn.SEQUENCE_FINAL = 0xffffffff;
/* Below flags apply in the context of Bip 68 */

/* If this flag set, txIn.nSequence is NOT interpreted as a relative lock-time.
   * */

TxIn.SEQUENCE_LOCKTIME_DISABLE_FLAG = 1 << 31;
/* If txIn.nSequence encodes a relative lock-time and this flag is set, the
   * relative lock-time has units of 512 seconds, otherwise it specifies blocks
   * with a granularity of 1. */

TxIn.SEQUENCE_LOCKTIME_TYPE_FLAG = 1 << 22;
/* If txIn.nSequence encodes a relative lock-time, this mask is applied to
   * extract that lock-time from the sequence field. */

TxIn.SEQUENCE_LOCKTIME_MASK = 0x0000ffff;
/* In order to use the same number of bits to encode roughly the same
   * wall-clock duration, and because blocks are naturally limited to occur
   * every 600s on average, the minimum granularity for time-based relative
   * lock-time is fixed at 512 seconds.  Converting from CTxIn::nSequence to
   * seconds is performed by multiplying by 512 = 2^9, or equivalently
   * shifting up by 9 bits. */

TxIn.SEQUENCE_LOCKTIME_GRANULARITY = 9;

/**
 * Transaction Output
 * ==================
 *
 * An output to a transaction. The way you normally want to make one is with
 * new TxOut(valueBn, script) (i.e., just as with TxIn, you can leave out the
 * scriptVi, since it can be computed automatically.
 */

class TxOut extends Struct {
  constructor(valueBn, scriptVi, script) {
    super({
      valueBn,
      scriptVi,
      script
    });
  }

  setScript(script) {
    this.scriptVi = VarInt.fromNumber(script.toBuffer().length);
    this.script = script;
    return this;
  }

  fromProperties(valueBn, script) {
    this.fromObject({
      valueBn
    });
    this.setScript(script);
    return this;
  }

  static fromProperties(valueBn, script) {
    return new this().fromProperties(valueBn, script);
  }

  fromJSON(json) {
    this.fromObject({
      valueBn: new Bn().fromJSON(json.valueBn),
      scriptVi: new VarInt().fromJSON(json.scriptVi),
      script: new Script().fromJSON(json.script)
    });
    return this;
  }

  toJSON() {
    return {
      valueBn: this.valueBn.toJSON(),
      scriptVi: this.scriptVi.toJSON(),
      script: this.script.toJSON()
    };
  }

  fromBr(br) {
    this.valueBn = br.readUInt64LEBn();
    this.scriptVi = VarInt.fromNumber(br.readVarIntNum());
    this.script = new Script().fromBuffer(br.read(this.scriptVi.toNumber()));
    return this;
  }

  toBw(bw) {
    if (!bw) {
      bw = new Bw();
    }

    bw.writeUInt64LEBn(this.valueBn);
    bw.write(this.scriptVi.buf);
    bw.write(this.script.toBuffer());
    return bw;
  }

}

/**
 * Transaction
 * ===========
 *
 * A bitcoin transaction.
 */

class Tx extends Struct {
  constructor(versionBytesNum = 1, txInsVi = VarInt.fromNumber(0), txIns = [], txOutsVi = VarInt.fromNumber(0), txOuts = [], nLockTime = 0) {
    super({
      versionBytesNum,
      txInsVi,
      txIns,
      txOutsVi,
      txOuts,
      nLockTime
    });
  }

  fromJSON(json) {
    const txIns = [];
    json.txIns.forEach(function (txIn) {
      txIns.push(new TxIn().fromJSON(txIn));
    });
    const txOuts = [];
    json.txOuts.forEach(function (txOut) {
      txOuts.push(new TxOut().fromJSON(txOut));
    });
    this.fromObject({
      versionBytesNum: json.versionBytesNum,
      txInsVi: new VarInt().fromJSON(json.txInsVi),
      txIns: txIns,
      txOutsVi: new VarInt().fromJSON(json.txOutsVi),
      txOuts: txOuts,
      nLockTime: json.nLockTime
    });
    return this;
  }

  toJSON() {
    const txIns = [];
    this.txIns.forEach(function (txIn) {
      txIns.push(txIn.toJSON());
    });
    const txOuts = [];
    this.txOuts.forEach(function (txOut) {
      txOuts.push(txOut.toJSON());
    });
    return {
      versionBytesNum: this.versionBytesNum,
      txInsVi: this.txInsVi.toJSON(),
      txIns: txIns,
      txOutsVi: this.txOutsVi.toJSON(),
      txOuts: txOuts,
      nLockTime: this.nLockTime
    };
  }

  fromBr(br) {
    this.versionBytesNum = br.readUInt32LE();
    this.txInsVi = new VarInt(br.readVarIntBuf());
    const txInsNum = this.txInsVi.toNumber();
    this.txIns = [];

    for (let i = 0; i < txInsNum; i++) {
      this.txIns.push(new TxIn().fromBr(br));
    }

    this.txOutsVi = new VarInt(br.readVarIntBuf());
    const txOutsNum = this.txOutsVi.toNumber();
    this.txOuts = [];

    for (let i = 0; i < txOutsNum; i++) {
      this.txOuts.push(new TxOut().fromBr(br));
    }

    this.nLockTime = br.readUInt32LE();
    return this;
  }

  toBw(bw) {
    if (!bw) {
      bw = new Bw();
    }

    bw.writeUInt32LE(this.versionBytesNum);
    bw.write(this.txInsVi.buf);

    for (let i = 0; i < this.txIns.length; i++) {
      this.txIns[i].toBw(bw);
    }

    bw.write(this.txOutsVi.buf);

    for (let i = 0; i < this.txOuts.length; i++) {
      this.txOuts[i].toBw(bw);
    }

    bw.writeUInt32LE(this.nLockTime);
    return bw;
  } // https://github.com/Bitcoin-UAHF/spec/blob/master/replay-protected-sighash.md


  hashPrevouts() {
    const bw = new Bw();

    for (const i in this.txIns) {
      const txIn = this.txIns[i];
      bw.write(txIn.txHashBuf); // outpoint (1/2)

      bw.writeUInt32LE(txIn.txOutNum); // outpoint (2/2)
    }

    return Hash.sha256Sha256(bw.toBuffer());
  }

  hashSequence() {
    const bw = new Bw();

    for (const i in this.txIns) {
      const txIn = this.txIns[i];
      bw.writeUInt32LE(txIn.nSequence);
    }

    return Hash.sha256Sha256(bw.toBuffer());
  }

  hashOutputs() {
    const bw = new Bw();

    for (const i in this.txOuts) {
      const txOut = this.txOuts[i];
      bw.write(txOut.toBuffer());
    }

    return Hash.sha256Sha256(bw.toBuffer());
  }
  /**
   * For a normal transaction, subScript is usually the scriptPubKey. For a
   * p2sh transaction, subScript is usually the redeemScript. If you're not
   * normal because you're using OP_CODESEPARATORs, you know what to do.
   */


  sighash(nHashType, nIn, subScript, valueBn, flags = 0, hashCache = new HashCache()) {
    const buf = this.sighashPreimage(nHashType, nIn, subScript, valueBn, flags, hashCache);

    if (buf.compare(Buffer.from('0000000000000000000000000000000000000000000000000000000000000001', 'hex')) === 0) {
      return buf;
    }

    return new Br(Hash.sha256Sha256(buf)).readReverse();
  }

  async asyncSighash(nHashType, nIn, subScript, valueBn, flags = 0, hashCache = {}) {
    const workersResult = await Workers.asyncObjectMethod(this, 'sighash', [nHashType, nIn, subScript, valueBn, flags, hashCache]);
    return workersResult.resbuf;
  }

  sighashPreimage(nHashType, nIn, subScript, valueBn, flags = 0, hashCache = new HashCache()) {
    // start with UAHF part (Bitcoin SV)
    // https://github.com/Bitcoin-UAHF/spec/blob/master/replay-protected-sighash.md
    if (nHashType & Sig.SIGHASH_FORKID && flags & Tx.SCRIPT_ENABLE_SIGHASH_FORKID) {
      let hashPrevouts = Buffer.alloc(32, 0);
      let hashSequence = Buffer.alloc(32, 0);
      let hashOutputs = Buffer.alloc(32, 0);

      if (!(nHashType & Sig.SIGHASH_ANYONECANPAY)) {
        hashPrevouts = hashCache.prevoutsHashBuf ? hashCache.prevoutsHashBuf : hashCache.prevoutsHashBuf = this.hashPrevouts();
      }

      if (!(nHashType & Sig.SIGHASH_ANYONECANPAY) && (nHashType & 0x1f) !== Sig.SIGHASH_SINGLE && (nHashType & 0x1f) !== Sig.SIGHASH_NONE) {
        hashSequence = hashCache.sequenceHashBuf ? hashCache.sequenceHashBuf : hashCache.sequenceHashBuf = this.hashSequence();
      }

      if ((nHashType & 0x1f) !== Sig.SIGHASH_SINGLE && (nHashType & 0x1f) !== Sig.SIGHASH_NONE) {
        hashOutputs = hashCache.outputsHashBuf ? hashCache.outputsHashBuf : hashCache.outputsHashBuf = this.hashOutputs();
      } else if ((nHashType & 0x1f) === Sig.SIGHASH_SINGLE && nIn < this.txOuts.length) {
        hashOutputs = Hash.sha256Sha256(this.txOuts[nIn].toBuffer());
      }

      const bw = new Bw();
      bw.writeUInt32LE(this.versionBytesNum);
      bw.write(hashPrevouts);
      bw.write(hashSequence);
      bw.write(this.txIns[nIn].txHashBuf); // outpoint (1/2)

      bw.writeUInt32LE(this.txIns[nIn].txOutNum); // outpoint (2/2)

      bw.writeVarIntNum(subScript.toBuffer().length);
      bw.write(subScript.toBuffer());
      bw.writeUInt64LEBn(valueBn);
      bw.writeUInt32LE(this.txIns[nIn].nSequence);
      bw.write(hashOutputs);
      bw.writeUInt32LE(this.nLockTime);
      bw.writeUInt32LE(nHashType >>> 0);
      return bw.toBuffer();
    } // original bitcoin code follows - not related to UAHF (Bitcoin SV)


    const txcopy = this.cloneByBuffer();
    subScript = new Script().fromBuffer(subScript.toBuffer());
    subScript.removeCodeseparators();

    for (let i = 0; i < txcopy.txIns.length; i++) {
      txcopy.txIns[i] = TxIn.fromBuffer(txcopy.txIns[i].toBuffer()).setScript(new Script());
    }

    txcopy.txIns[nIn] = TxIn.fromBuffer(txcopy.txIns[nIn].toBuffer()).setScript(subScript);

    if ((nHashType & 31) === Sig.SIGHASH_NONE) {
      txcopy.txOuts.length = 0;
      txcopy.txOutsVi = VarInt.fromNumber(0);

      for (let i = 0; i < txcopy.txIns.length; i++) {
        if (i !== nIn) {
          txcopy.txIns[i].nSequence = 0;
        }
      }
    } else if ((nHashType & 31) === Sig.SIGHASH_SINGLE) {
      // The SIGHASH_SINGLE bug.
      // https://bitcointalk.org/index.php?topic=260595.0
      if (nIn > txcopy.txOuts.length - 1) {
        return Buffer.from('0000000000000000000000000000000000000000000000000000000000000001', 'hex');
      }

      txcopy.txOuts.length = nIn + 1;
      txcopy.txOutsVi = VarInt.fromNumber(nIn + 1);

      for (let i = 0; i < txcopy.txOuts.length; i++) {
        if (i < nIn) {
          txcopy.txOuts[i] = TxOut.fromProperties(new Bn().fromBuffer(Buffer.from('ffffffffffffffff', 'hex')), new Script());
        }
      }

      for (let i = 0; i < txcopy.txIns.length; i++) {
        if (i !== nIn) {
          txcopy.txIns[i].nSequence = 0;
        }
      }
    } // else, SIGHASH_ALL


    if (nHashType & Sig.SIGHASH_ANYONECANPAY) {
      txcopy.txIns[0] = txcopy.txIns[nIn];
      txcopy.txIns.length = 1;
      txcopy.txInsVi = VarInt.fromNumber(1);
    }

    const buf = new Bw().write(txcopy.toBuffer()).writeInt32LE(nHashType).toBuffer();
    return buf;
  }

  async asyncSighashPreimage(nHashType, nIn, subScript, valueBn, flags = 0, hashCache = {}) {
    const workersResult = await Workers.asyncObjectMethod(this, 'sighashPreimage', [nHashType, nIn, subScript, valueBn, flags, hashCache]);
    return workersResult.resbuf;
  } // This function returns a signature but does not update any inputs


  sign(keyPair, nHashType = Sig.SIGHASH_ALL | Sig.SIGHASH_FORKID, nIn, subScript, valueBn, flags = Tx.SCRIPT_ENABLE_SIGHASH_FORKID, hashCache = {}) {
    const hashBuf = this.sighash(nHashType, nIn, subScript, valueBn, flags, hashCache);
    const sig = Ecdsa.sign(hashBuf, keyPair, 'little').fromObject({
      nHashType: nHashType
    });
    return sig;
  }

  async asyncSign(keyPair, nHashType = Sig.SIGHASH_ALL | Sig.SIGHASH_FORKID, nIn, subScript, valueBn, flags = Tx.SCRIPT_ENABLE_SIGHASH_FORKID, hashCache = {}) {
    const workersResult = await Workers.asyncObjectMethod(this, 'sign', [keyPair, nHashType, nIn, subScript, valueBn, flags, hashCache]);
    return new Sig().fromFastBuffer(workersResult.resbuf);
  } // This function takes a signature as input and does not parse any inputs


  verify(sig, pubKey, nIn, subScript, enforceLowS = false, valueBn, flags = Tx.SCRIPT_ENABLE_SIGHASH_FORKID, hashCache = {}) {
    const hashBuf = this.sighash(sig.nHashType, nIn, subScript, valueBn, flags, hashCache);
    return Ecdsa.verify(hashBuf, sig, pubKey, 'little', enforceLowS);
  }

  async asyncVerify(sig, pubKey, nIn, subScript, enforceLowS = false, valueBn, flags = Tx.SCRIPT_ENABLE_SIGHASH_FORKID, hashCache = {}) {
    const workersResult = await Workers.asyncObjectMethod(this, 'verify', [sig, pubKey, nIn, subScript, enforceLowS, valueBn, flags, hashCache]);
    return JSON.parse(workersResult.resbuf.toString());
  }

  hash() {
    return Hash.sha256Sha256(this.toBuffer());
  }

  async asyncHash() {
    const workersResult = await Workers.asyncObjectMethod(this, 'hash', []);
    return workersResult.resbuf;
  }

  id() {
    return new Br(this.hash()).readReverse().toString('hex');
  }

  async asyncId() {
    const workersResult = await Workers.asyncObjectMethod(this, 'id', []);
    return JSON.parse(workersResult.resbuf.toString());
  }

  addTxIn(txHashBuf, txOutNum, script, nSequence) {
    let txIn;

    if (txHashBuf instanceof TxIn) {
      txIn = txHashBuf;
    } else {
      txIn = new TxIn().fromObject({
        txHashBuf,
        txOutNum,
        nSequence
      }).setScript(script);
    }

    this.txIns.push(txIn);
    this.txInsVi = VarInt.fromNumber(this.txInsVi.toNumber() + 1);
    return this;
  }

  addTxOut(valueBn, script) {
    let txOut;

    if (valueBn instanceof TxOut) {
      txOut = valueBn;
    } else {
      txOut = new TxOut().fromObject({
        valueBn
      }).setScript(script);
    }

    this.txOuts.push(txOut);
    this.txOutsVi = VarInt.fromNumber(this.txOutsVi.toNumber() + 1);
    return this;
  }
  /**
   * Analagous to bitcoind's IsCoinBase function in transaction.h
   */


  isCoinbase() {
    return this.txIns.length === 1 && this.txIns[0].hasNullInput();
  }
  /**
   * BIP 69 sorting. Be sure to sign after sorting.
   */


  sort() {
    this.txIns.sort((first, second) => {
      return new Br(first.txHashBuf).readReverse().compare(new Br(second.txHashBuf).readReverse()) || first.txOutNum - second.txOutNum;
    });
    this.txOuts.sort((first, second) => {
      return first.valueBn.sub(second.valueBn).toNumber() || first.script.toBuffer().compare(second.script.toBuffer());
    });
    return this;
  }

}

Tx.MAX_MONEY = 21000000 * 1e8; // This is defined on Interp, but Tx cannot depend on Interp - must redefine here

Tx.SCRIPT_ENABLE_SIGHASH_FORKID = 1 << 16;

/**
 * Block
 * =====
 *
 * A block, of course, is a collection of transactions. This class is somewhat
 * incompconste at the moment. In the future, it should support the ability to
 * check to see if a transaction is in a block (thanks to the magic of merkle
 * trees). You will probably never use Yours Bitcoin to create a block, since almost
 * everyone will use bitcoind for that. As such, the primary way to use this is
 * new Block().fromBuffer(buf), which will parse the block and prepare its insides
 * for you to inspect.
 */

class Block extends Struct {
  constructor(blockHeader, txsVi, txs) {
    super({
      blockHeader,
      txsVi,
      txs
    });
  }

  fromJSON(json) {
    const txs = [];
    json.txs.forEach(function (tx) {
      txs.push(new Tx().fromJSON(tx));
    });
    this.fromObject({
      blockHeader: new BlockHeader().fromJSON(json.blockHeader),
      txsVi: new VarInt().fromJSON(json.txsVi),
      txs: txs
    });
    return this;
  }

  toJSON() {
    const txs = [];
    this.txs.forEach(function (tx) {
      txs.push(tx.toJSON());
    });
    return {
      blockHeader: this.blockHeader.toJSON(),
      txsVi: this.txsVi.toJSON(),
      txs: txs
    };
  }

  fromBr(br) {
    this.blockHeader = new BlockHeader().fromBr(br);
    this.txsVi = new VarInt(br.readVarIntBuf());
    const txsNum = this.txsVi.toNumber();
    this.txs = [];

    for (let i = 0; i < txsNum; i++) {
      this.txs.push(new Tx().fromBr(br));
    }

    return this;
  }

  toBw(bw) {
    if (!bw) {
      bw = new Bw();
    }

    bw.write(this.blockHeader.toBuffer());
    bw.write(this.txsVi.buf);
    const txsNum = this.txsVi.toNumber();

    for (let i = 0; i < txsNum; i++) {
      this.txs[i].toBw(bw);
    }

    return bw;
  }

  hash() {
    return Hash.sha256Sha256(this.blockHeader.toBuffer());
  }

  async asyncHash() {
    const workersResult = await Workers.asyncObjectMethod(this, 'hash', []);
    return workersResult.resbuf;
  }

  id() {
    return new Br(this.hash()).readReverse().toString('hex');
  }

  async asyncId() {
    const workersResult = await Workers.asyncObjectMethod(this, 'id', []);
    return JSON.parse(workersResult.resbuf.toString());
  }

  verifyMerkleRoot() {
    const txsbufs = this.txs.map(tx => tx.toBuffer());
    const merkleRootBuf = Merkle.fromBuffers(txsbufs).hash();
    return Buffer.compare(merkleRootBuf, this.blockHeader.merkleRootBuf);
  }
  /**
   * Sometimes we don't want to parse an entire block into memory. Instead, we
   * simply want to iterate through all transactions in the block. That is what
   * this method is for. This method returns an efficient iterator which can be
   * used in a `for (tx of txs)` construct that returns each tx one at a time
   * without first parsing all of them into memory.
   *
   * @param {Buffer} blockBuf A buffer of a block.
   */


  static iterateTxs(blockBuf) {
    const br = new Br(blockBuf);
    const blockHeader = new BlockHeader().fromBr(br);
    const txsVi = new VarInt(br.readVarIntBuf());
    const txsNum = txsVi.toNumber();
    return {
      blockHeader,
      txsVi,
      txsNum,

      *[Symbol.iterator]() {
        for (let i = 0; i < txsNum; i++) {
          yield new Tx().fromBr(br);
        }
      }

    };
  }

}

Block.MAX_BLOCK_SIZE = 1000000;

/**
 * Script Interpreter
 * ==================
 *
 * Bitcoin transactions contain scripts. Each input has a script called the
 * scriptSig, and each output has a script called the scriptPubKey. To validate
 * an input, the ScriptSig is executed, then with the same stack, the
 * scriptPubKey from the output corresponding to that input is run. The primary
 * way to use this class is via the verify function:
 *
 * new Interp().verify( ... )
 *
 * In some ways, the script interpreter is one of the most poorly architected
 * components of Yours Bitcoin because of the giant switch statement in step(). But
 * that is deliberately so to make it similar to bitcoin core, and thus easier
 * to audit.
 */

class Interp extends Struct {
  constructor(script, tx, nIn, stack = [], altStack = [], pc = 0, pBeginCodeHash = 0, nOpCount = 0, ifStack = [], errStr = '', flags = Interp.defaultFlags, valueBn = new Bn(0)) {
    super({
      script,
      tx,
      nIn,
      stack,
      altStack,
      pc,
      pBeginCodeHash,
      nOpCount,
      ifStack,
      errStr,
      flags,
      valueBn
    });
  }

  initialize() {
    this.script = new Script();
    this.stack = [];
    this.altStack = [];
    this.pc = 0;
    this.pBeginCodeHash = 0;
    this.nOpCount = 0;
    this.ifStack = [];
    this.errStr = '';
    this.flags = Interp.defaultFlags;
    return this;
  }

  fromJSON(json) {
    this.fromJSONNoTx(json);
    this.tx = json.tx ? new Tx().fromJSON(json.tx) : undefined;
    return this;
  }
  /**
   * Convert JSON containing everything but the tx to an interp object.
   */


  fromJSONNoTx(json) {
    this.fromObject({
      script: json.script !== undefined ? new Script().fromJSON(json.script) : undefined,
      nIn: json.nIn
    });
    this.stack = [];
    json.stack.forEach(function (hex) {
      this.stack.push(Buffer.from(hex, 'hex'));
    }.bind(this));
    this.altStack = [];
    json.altStack.forEach(function (hex) {
      this.altStack.push(Buffer.from(hex, 'hex'));
    }.bind(this));
    this.fromObject({
      pc: json.pc,
      pBeginCodeHash: json.pBeginCodeHash,
      nOpCount: json.nOpCount,
      ifStack: json.ifStack,
      errStr: json.errStr,
      flags: json.flags
    });
    return this;
  }

  fromBr(br) {
    let jsonNoTxBufLEn = br.readVarIntNum();
    let jsonNoTxBuf = br.read(jsonNoTxBufLEn);
    this.fromJSONNoTx(JSON.parse(jsonNoTxBuf.toString()));
    let txbuflen = br.readVarIntNum();

    if (txbuflen > 0) {
      let txbuf = br.read(txbuflen);
      this.tx = new Tx().fromFastBuffer(txbuf);
    }

    return this;
  }

  toJSON() {
    let json = this.toJSONNoTx();
    json.tx = this.tx ? this.tx.toJSON() : undefined;
    return json;
  }
  /**
   * Convert everything but the tx to JSON.
   */


  toJSONNoTx() {
    let stack = [];
    this.stack.forEach(function (buf) {
      stack.push(buf.toString('hex'));
    });
    let altStack = [];
    this.altStack.forEach(function (buf) {
      altStack.push(buf.toString('hex'));
    });
    return {
      script: this.script ? this.script.toJSON() : undefined,
      nIn: this.nIn,
      stack: stack,
      altStack: altStack,
      pc: this.pc,
      pBeginCodeHash: this.pBeginCodeHash,
      nOpCount: this.nOpCount,
      ifStack: this.ifStack,
      errStr: this.errStr,
      flags: this.flags
    };
  }

  toBw(bw) {
    if (!bw) {
      bw = new Bw();
    }

    let jsonNoTxBuf = Buffer.from(JSON.stringify(this.toJSONNoTx()));
    bw.writeVarIntNum(jsonNoTxBuf.length);
    bw.write(jsonNoTxBuf);

    if (this.tx) {
      let txbuf = this.tx.toFastBuffer();
      bw.writeVarIntNum(txbuf.length);
      bw.write(txbuf);
    } else {
      bw.writeVarIntNum(0);
    }

    return bw;
  }
  /**
   * In order to make auduting the script interpreter easier, we use the same
   * constants as bitcoin core, including the flags, which customize the
   * operation of the interpreter.
   */


  static getFlags(flagstr) {
    let flags = 0;

    if (flagstr.indexOf('NONE') !== -1) {
      flags = flags | Interp.SCRIPT_VERIFY_NONE;
    }

    if (flagstr.indexOf('P2SH') !== -1) {
      flags = flags | Interp.SCRIPT_VERIFY_P2SH;
    }

    if (flagstr.indexOf('STRICTENC') !== -1) {
      flags = flags | Interp.SCRIPT_VERIFY_STRICTENC;
    }

    if (flagstr.indexOf('DERSIG') !== -1) {
      flags = flags | Interp.SCRIPT_VERIFY_DERSIG;
    }

    if (flagstr.indexOf('LOW_S') !== -1) {
      flags = flags | Interp.SCRIPT_VERIFY_LOW_S;
    }

    if (flagstr.indexOf('NULLDUMMY') !== -1) {
      flags = flags | Interp.SCRIPT_VERIFY_NULLDUMMY;
    }

    if (flagstr.indexOf('SIGPUSHONLY') !== -1) {
      flags = flags | Interp.SCRIPT_VERIFY_SIGPUSHONLY;
    }

    if (flagstr.indexOf('MINIMALDATA') !== -1) {
      flags = flags | Interp.SCRIPT_VERIFY_MINIMALDATA;
    }

    if (flagstr.indexOf('DISCOURAGE_UPGRADABLE_NOPS') !== -1) {
      flags = flags | Interp.SCRIPT_VERIFY_DISCOURAGE_UPGRADABLE_NOPS;
    }

    if (flagstr.indexOf('CLEANSTACK') !== -1) {
      flags = flags | Interp.SCRIPT_VERIFY_CLEANSTACK;
    }

    if (flagstr.indexOf('CHECKLOCKTIMEVERIFY') !== -1) {
      flags = flags | Interp.SCRIPT_VERIFY_CHECKLOCKTIMEVERIFY;
    }

    if (flagstr.indexOf('CHECKSEQUENCEVERIFY') !== -1) {
      flags = flags | Interp.SCRIPT_VERIFY_CHECKSEQUENCEVERIFY;
    }

    if (flagstr.indexOf('SIGHASH_FORKID') !== -1) {
      flags = flags | Interp.SCRIPT_ENABLE_SIGHASH_FORKID;
    }

    return flags;
  }

  static castToBool(buf) {
    for (let i = 0; i < buf.length; i++) {
      if (buf[i] !== 0) {
        // can be negative zero
        if (i === buf.length - 1 && buf[i] === 0x80) {
          return false;
        }

        return true;
      }
    }

    return false;
  }
  /**
   * Translated from bitcoin core's CheckSigEncoding
   */


  checkSigEncoding(buf) {
    // Empty signature. Not strictly DER encoded, but allowed to provide a
    // compact way to provide an invalid signature for use with CHECK(MULTI)SIG
    if (buf.length === 0) {
      return true;
    }

    if ((this.flags & (Interp.SCRIPT_VERIFY_DERSIG | Interp.SCRIPT_VERIFY_LOW_S | Interp.SCRIPT_VERIFY_STRICTENC)) !== 0 && !Sig.IsTxDer(buf)) {
      this.errStr = 'SCRIPT_ERR_SIG_DER';
      return false;
    } else if ((this.flags & Interp.SCRIPT_VERIFY_LOW_S) !== 0) {
      let sig = new Sig().fromTxFormat(buf);

      if (!sig.hasLowS()) {
        this.errStr = 'SCRIPT_ERR_SIG_DER';
        return false;
      }
    } else if ((this.flags & Interp.SCRIPT_VERIFY_STRICTENC) !== 0) {
      let sig = new Sig().fromTxFormat(buf);

      if (!sig.hasDefinedHashType()) {
        this.errStr = 'SCRIPT_ERR_SIG_HASHTYPE';
        return false;
      }
    }

    return true;
  }
  /**
   * Translated from bitcoin core's CheckPubKeyEncoding
   */


  checkPubKeyEncoding(buf) {
    if ((this.flags & Interp.SCRIPT_VERIFY_STRICTENC) !== 0 && !PubKey.isCompressedOrUncompressed(buf)) {
      this.errStr = 'SCRIPT_ERR_PUBKEYTYPE';
      return false;
    }

    return true;
  }
  /**
   * Translated from bitcoin core's CheckLockTime
   */


  checkLockTime(nLockTime) {
    // There are two kinds of nLockTime: lock-by-blockheight
    // and lock-by-blocktime, distinguished by whether
    // nLockTime < LOCKTIME_THRESHOLD.
    //
    // We want to compare apples to apples, so fail the script
    // unless the type of nLockTime being tested is the same as
    // the nLockTime in the transaction.
    if (!(this.tx.nLockTime < Interp.LOCKTIME_THRESHOLD && nLockTime < Interp.LOCKTIME_THRESHOLD || this.tx.nLockTime >= Interp.LOCKTIME_THRESHOLD && nLockTime >= Interp.LOCKTIME_THRESHOLD)) {
      return false;
    } // Now that we know we're comparing apples-to-apples, the
    // comparison is a simple numeric one.


    if (nLockTime > this.tx.nLockTime) {
      return false;
    } // Finally the nLockTime feature can be disabled and thus
    // CHECKLOCKTIMEVERIFY bypassed if every txIn has been
    // finalized by setting nSequence to maxint. The
    // transaction would be allowed into the blockchain, making
    // the opCode ineffective.
    //
    // Testing if this vin is not final is sufficient to
    // prevent this condition. Alternatively we could test all
    // inputs, but testing just this input minimizes the data
    // required to prove correct CHECKLOCKTIMEVERIFY execution.


    if (TxIn.SEQUENCE_FINAL === this.tx.txIns[this.nIn].nSequence) {
      return false;
    }

    return true;
  }
  /**
   * Translated from bitcoin core's CheckSequence.
   */


  checkSequence(nSequence) {
    // Relative lock times are supported by comparing the passed
    // in operand to the sequence number of the input.
    let txToSequence = this.tx.txIns[this.nIn].nSequence; // Fail if the transaction's version number is not set high
    // enough to trigger Bip 68 rules.

    if (this.tx.versionBytesNum < 2) {
      return false;
    } // Sequence numbers with their most significant bit set are not
    // consensus constrained. Testing that the transaction's sequence
    // number do not have this bit set prevents using this property
    // to get around a CHECKSEQUENCEVERIFY check.


    if (txToSequence & TxIn.SEQUENCE_LOCKTIME_DISABLE_FLAG) {
      return false;
    } // Mask off any bits that do not have consensus-enforced meaning
    // before doing the integer comparisons


    let nLockTimeMask = TxIn.SEQUENCE_LOCKTIME_TYPE_FLAG | TxIn.SEQUENCE_LOCKTIME_MASK;
    let txToSequenceMasked = txToSequence & nLockTimeMask;
    let nSequenceMasked = nSequence & nLockTimeMask; // There are two kinds of nSequence: lock-by-blockheight
    // and lock-by-blocktime, distinguished by whether
    // nSequenceMasked < CTxIn::SEQUENCE_LOCKTIME_TYPE_FLAG.
    //
    // We want to compare apples to apples, so fail the script
    // unless the type of nSequenceMasked being tested is the same as
    // the nSequenceMasked in the transaction.

    if (!(txToSequenceMasked < TxIn.SEQUENCE_LOCKTIME_TYPE_FLAG && nSequenceMasked < TxIn.SEQUENCE_LOCKTIME_TYPE_FLAG || txToSequenceMasked >= TxIn.SEQUENCE_LOCKTIME_TYPE_FLAG && nSequenceMasked >= TxIn.SEQUENCE_LOCKTIME_TYPE_FLAG)) {
      return false;
    } // Now that we know we're comparing apples-to-apples, the
    // comparison is a simple numeric one.


    if (nSequenceMasked > txToSequenceMasked) {
      return false;
    }

    return true;
  }
  /**
   * Based on bitcoin core's EvalScript function, with the inner loop moved to
   * Interp.prototype.step()
   * bitcoin core commit: b5d1b1092998bc95313856d535c632ea5a8f9104
   */


  *eval() {
    if (this.script.toBuffer().length > 10000) {
      this.errStr = 'SCRIPT_ERR_SCRIPT_SIZE';
      yield false;
    }

    try {
      while (this.pc < this.script.chunks.length) {
        let fSuccess = this.step();

        if (!fSuccess) {
          yield false;
        } else {
          yield fSuccess;
        }
      } // Size limits


      if (this.stack.length + this.altStack.length > 1000) {
        this.errStr = 'SCRIPT_ERR_STACK_SIZE';
        yield false;
      }
    } catch (e) {
      this.errStr = 'SCRIPT_ERR_UNKNOWN_ERROR: ' + e;
      yield false;
    }

    if (this.ifStack.length > 0) {
      this.errStr = 'SCRIPT_ERR_UNBALANCED_CONDITIONAL';
      yield false;
    }

    yield true;
  }
  /**
   * Based on the inner loop of bitcoin core's EvalScript function
   */


  step() {
    let fRequireMinimal = (this.flags & Interp.SCRIPT_VERIFY_MINIMALDATA) !== 0; // bool fExec = !count(ifStack.begin(), ifStack.end(), false)

    let fExec = !(this.ifStack.indexOf(false) + 1); //
    // Read instruction
    //

    let chunk = this.script.chunks[this.pc];
    this.pc++;
    let opCodeNum = chunk.opCodeNum;

    if (opCodeNum === undefined) {
      this.errStr = 'SCRIPT_ERR_BAD_OPCODE';
      return false;
    }

    if (chunk.buf && chunk.buf.length > Interp.MAX_SCRIPT_ELEMENT_SIZE) {
      this.errStr = 'SCRIPT_ERR_PUSH_SIZE';
      return false;
    } // Note how OpCode.OP_RESERVED does not count towards the opCode limit.


    if (opCodeNum > OpCode.OP_16 && ++this.nOpCount > 201) {
      this.errStr = 'SCRIPT_ERR_OP_COUNT';
      return false;
    }

    if (opCodeNum === OpCode.OP_LEFT || opCodeNum === OpCode.OP_RIGHT || opCodeNum === OpCode.OP_2MUL || opCodeNum === OpCode.OP_2DIV) {
      this.errStr = 'SCRIPT_ERR_DISABLED_OPCODE';
      return false;
    }

    if (fExec && opCodeNum >= 0 && opCodeNum <= OpCode.OP_PUSHDATA4) {
      if (fRequireMinimal && !this.script.checkMinimalPush(this.pc - 1)) {
        this.errStr = 'SCRIPT_ERR_MINIMALDATA';
        return false;
      }

      if (!chunk.buf) {
        this.stack.push(Interp.false);
      } else if (chunk.len !== chunk.buf.length) {
        throw new Error('LEngth of push value not equal to length of data');
      } else {
        this.stack.push(chunk.buf);
      }
    } else if (fExec || OpCode.OP_IF <= opCodeNum && opCodeNum <= OpCode.OP_ENDIF) {
      switch (opCodeNum) {
        //
        // Push value
        //
        case OpCode.OP_1NEGATE:
        case OpCode.OP_1:
        case OpCode.OP_2:
        case OpCode.OP_3:
        case OpCode.OP_4:
        case OpCode.OP_5:
        case OpCode.OP_6:
        case OpCode.OP_7:
        case OpCode.OP_8:
        case OpCode.OP_9:
        case OpCode.OP_10:
        case OpCode.OP_11:
        case OpCode.OP_12:
        case OpCode.OP_13:
        case OpCode.OP_14:
        case OpCode.OP_15:
        case OpCode.OP_16:
          {
            // ( -- value)
            // ScriptNum bn((int)opCode - (int)(OpCode.OP_1 - 1))
            let n = opCodeNum - (OpCode.OP_1 - 1);
            let buf = new Bn(n).toScriptNumBuffer();
            this.stack.push(buf); // The result of these opCodes should always be the minimal way to push the data
            // they push, so no need for a CheckMinimalPush here.
          }
          break;
        //
        // Control
        //

        case OpCode.OP_NOP:
          break;

        case OpCode.OP_CHECKLOCKTIMEVERIFY:
          {
            if (!(this.flags & Interp.SCRIPT_VERIFY_CHECKLOCKTIMEVERIFY)) {
              // not enabled; treat as a NOP2
              if (this.flags & Interp.SCRIPT_VERIFY_DISCOURAGE_UPGRADABLE_NOPS) {
                this.errStr = 'SCRIPT_ERR_DISCOURAGE_UPGRADABLE_NOPS';
                return false;
              }

              break;
            }

            if (this.stack.length < 1) {
              this.errStr = 'SCRIPT_ERR_INVALID_STACK_OPERATION';
              return false;
            } // Note that elsewhere numeric opCodes are limited to
            // operands in the range -2**31+1 to 2**31-1, however it is
            // legal for opCodes to produce results exceeding that
            // range. This limitation is implemented by CScriptNum's
            // default 4-byte limit.
            //
            // If we kept to that limit we'd have a year 2038 problem,
            // even though the nLockTime field in transactions
            // themselves is uint32 which only becomes meaningless
            // after the year 2106.
            //
            // Thus as a special case we tell CScriptNum to accept up
            // to 5-byte bignums, which are good until 2**39-1, well
            // beyond the 2**32-1 limit of the nLockTime field itself.


            let nLockTimebuf = this.stack[this.stack.length - 1];
            let nLockTimebn = new Bn().fromScriptNumBuffer(nLockTimebuf, fRequireMinimal, 5);
            let nLockTime = nLockTimebn.toNumber(); // In the rare event that the argument may be < 0 due to
            // some arithmetic being done first, you can always use
            // 0 MAX CHECKLOCKTIMEVERIFY.

            if (nLockTime < 0) {
              this.errStr = 'SCRIPT_ERR_NEGATIVE_LOCKTIME';
              return false;
            } // Actually compare the specified lock time with the transaction.


            if (!this.checkLockTime(nLockTime)) {
              this.errStr = 'SCRIPT_ERR_UNSATISFIED_LOCKTIME';
              return false;
            }
          }
          break;

        case OpCode.OP_CHECKSEQUENCEVERIFY:
          {
            if (!(this.flags & Interp.SCRIPT_VERIFY_CHECKSEQUENCEVERIFY)) {
              // not enabled; treat as a NOP3
              if (this.flags & Interp.SCRIPT_VERIFY_DISCOURAGE_UPGRADABLE_NOPS) {
                this.errStr = 'SCRIPT_ERR_DISCOURAGE_UPGRADABLE_NOPS';
                return false;
              }

              break;
            }

            if (this.stack.length < 1) {
              this.errStr = 'SCRIPT_ERR_INVALID_STACK_OPERATION';
              return false;
            } // nSequence, like nLockTime, is a 32-bit unsigned integer
            // field. See the comment in CHECKLOCKTIMEVERIFY regarding
            // 5-byte numeric operands.


            let nSequencebuf = this.stack[this.stack.length - 1];
            let nSequencebn = new Bn().fromScriptNumBuffer(nSequencebuf, fRequireMinimal, 5);
            let nSequence = nSequencebn.toNumber(); // In the rare event that the argument may be < 0 due to
            // some arithmetic being done first, you can always use
            // 0 MAX CHECKSEQUENCEVERIFY.

            if (nSequence < 0) {
              this.errStr = 'SCRIPT_ERR_NEGATIVE_LOCKTIME';
              return false;
            } // To provide for future soft-fork extensibility, if the
            // operand has the disabled lock-time flag set,
            // CHECKSEQUENCEVERIFY behaves as a NOP.


            if ((nSequence & TxIn.SEQUENCE_LOCKTIME_DISABLE_FLAG) !== 0) {
              break;
            } // Compare the specified sequence number with the input.


            if (!this.checkSequence(nSequence)) {
              this.errStr = 'SCRIPT_ERR_UNSATISFIED_LOCKTIME';
              return false;
            }
          }
          break;

        case OpCode.OP_NOP1:
        case OpCode.OP_NOP3:
        case OpCode.OP_NOP4:
        case OpCode.OP_NOP5:
        case OpCode.OP_NOP6:
        case OpCode.OP_NOP7:
        case OpCode.OP_NOP8:
        case OpCode.OP_NOP9:
        case OpCode.OP_NOP10:
          if (this.flags & Interp.SCRIPT_VERIFY_DISCOURAGE_UPGRADABLE_NOPS) {
            this.errStr = 'SCRIPT_ERR_DISCOURAGE_UPGRADABLE_NOPS';
            return false;
          }

          break;

        case OpCode.OP_IF:
        case OpCode.OP_NOTIF:
          {
            // <expression> if [statements] [else [statements]] endif
            // bool fValue = false
            let fValue = false;

            if (fExec) {
              if (this.stack.length < 1) {
                this.errStr = 'SCRIPT_ERR_UNBALANCED_CONDITIONAL';
                return false;
              }

              let buf = this.stack.pop();
              fValue = Interp.castToBool(buf);

              if (opCodeNum === OpCode.OP_NOTIF) {
                fValue = !fValue;
              }
            }

            this.ifStack.push(fValue);
          }
          break;

        case OpCode.OP_ELSE:
          if (this.ifStack.length === 0) {
            this.errStr = 'SCRIPT_ERR_UNBALANCED_CONDITIONAL';
            return false;
          }

          this.ifStack[this.ifStack.length - 1] = !this.ifStack[this.ifStack.length - 1];
          break;

        case OpCode.OP_ENDIF:
          if (this.ifStack.length === 0) {
            this.errStr = 'SCRIPT_ERR_UNBALANCED_CONDITIONAL';
            return false;
          }

          this.ifStack.pop();
          break;

        case OpCode.OP_VERIFY:
          {
            // (true -- ) or
            // (false -- false) and return
            if (this.stack.length < 1) {
              this.errStr = 'SCRIPT_ERR_INVALID_STACK_OPERATION';
              return false;
            }

            let buf = this.stack[this.stack.length - 1];
            let fValue = Interp.castToBool(buf);

            if (fValue) {
              this.stack.pop();
            } else {
              this.errStr = 'SCRIPT_ERR_VERIFY';
              return false;
            }
          }
          break;

        case OpCode.OP_RETURN:
          {
            this.errStr = 'SCRIPT_ERR_OP_RETURN';
            return false;
          }
        // unreachable code: break
        //
        // Stack ops
        //

        case OpCode.OP_TOALTSTACK:
          if (this.stack.length < 1) {
            this.errStr = 'SCRIPT_ERR_INVALID_STACK_OPERATION';
            return false;
          }

          this.altStack.push(this.stack.pop());
          break;

        case OpCode.OP_FROMALTSTACK:
          if (this.altStack.length < 1) {
            this.errStr = 'SCRIPT_ERR_INVALID_ALTSTACK_OPERATION';
            return false;
          }

          this.stack.push(this.altStack.pop());
          break;

        case OpCode.OP_2DROP:
          // (x1 x2 -- )
          if (this.stack.length < 2) {
            this.errStr = 'SCRIPT_ERR_INVALID_STACK_OPERATION';
            return false;
          }

          this.stack.pop();
          this.stack.pop();
          break;

        case OpCode.OP_2DUP:
          {
            // (x1 x2 -- x1 x2 x1 x2)
            if (this.stack.length < 2) {
              this.errStr = 'SCRIPT_ERR_INVALID_STACK_OPERATION';
              return false;
            }

            let buf1 = this.stack[this.stack.length - 2];
            let buf2 = this.stack[this.stack.length - 1];
            this.stack.push(buf1);
            this.stack.push(buf2);
          }
          break;

        case OpCode.OP_3DUP:
          {
            // (x1 x2 x3 -- x1 x2 x3 x1 x2 x3)
            if (this.stack.length < 3) {
              this.errStr = 'SCRIPT_ERR_INVALID_STACK_OPERATION';
              return false;
            }

            let buf1 = this.stack[this.stack.length - 3];
            let buf2 = this.stack[this.stack.length - 2];
            let buf3 = this.stack[this.stack.length - 1];
            this.stack.push(buf1);
            this.stack.push(buf2);
            this.stack.push(buf3);
          }
          break;

        case OpCode.OP_2OVER:
          {
            // (x1 x2 x3 x4 -- x1 x2 x3 x4 x1 x2)
            if (this.stack.length < 4) {
              this.errStr = 'SCRIPT_ERR_INVALID_STACK_OPERATION';
              return false;
            }

            let buf1 = this.stack[this.stack.length - 4];
            let buf2 = this.stack[this.stack.length - 3];
            this.stack.push(buf1);
            this.stack.push(buf2);
          }
          break;

        case OpCode.OP_2ROT:
          {
            // (x1 x2 x3 x4 x5 x6 -- x3 x4 x5 x6 x1 x2)
            if (this.stack.length < 6) {
              this.errStr = 'SCRIPT_ERR_INVALID_STACK_OPERATION';
              return false;
            }

            let spliced = this.stack.splice(this.stack.length - 6, 2);
            this.stack.push(spliced[0]);
            this.stack.push(spliced[1]);
          }
          break;

        case OpCode.OP_2SWAP:
          {
            // (x1 x2 x3 x4 -- x3 x4 x1 x2)
            if (this.stack.length < 4) {
              this.errStr = 'SCRIPT_ERR_INVALID_STACK_OPERATION';
              return false;
            }

            let spliced = this.stack.splice(this.stack.length - 4, 2);
            this.stack.push(spliced[0]);
            this.stack.push(spliced[1]);
          }
          break;

        case OpCode.OP_IFDUP:
          {
            // (x - 0 | x x)
            if (this.stack.length < 1) {
              this.errStr = 'SCRIPT_ERR_INVALID_STACK_OPERATION';
              return false;
            }

            let buf = this.stack[this.stack.length - 1];
            let fValue = Interp.castToBool(buf);

            if (fValue) {
              this.stack.push(buf);
            }
          }
          break;

        case OpCode.OP_DEPTH:
          {
            // -- stacksize
            let buf = new Bn(this.stack.length).toScriptNumBuffer();
            this.stack.push(buf);
          }
          break;

        case OpCode.OP_DROP:
          // (x -- )
          if (this.stack.length < 1) {
            this.errStr = 'SCRIPT_ERR_INVALID_STACK_OPERATION';
            return false;
          }

          this.stack.pop();
          break;

        case OpCode.OP_DUP:
          // (x -- x x)
          if (this.stack.length < 1) {
            this.errStr = 'SCRIPT_ERR_INVALID_STACK_OPERATION';
            return false;
          }

          this.stack.push(this.stack[this.stack.length - 1]);
          break;

        case OpCode.OP_NIP:
          // (x1 x2 -- x2)
          if (this.stack.length < 2) {
            this.errStr = 'SCRIPT_ERR_INVALID_STACK_OPERATION';
            return false;
          }

          this.stack.splice(this.stack.length - 2, 1);
          break;

        case OpCode.OP_OVER:
          // (x1 x2 -- x1 x2 x1)
          if (this.stack.length < 2) {
            this.errStr = 'SCRIPT_ERR_INVALID_STACK_OPERATION';
            return false;
          }

          this.stack.push(this.stack[this.stack.length - 2]);
          break;

        case OpCode.OP_PICK:
        case OpCode.OP_ROLL:
          {
            // (xn ... x2 x1 x0 n - xn ... x2 x1 x0 xn)
            // (xn ... x2 x1 x0 n - ... x2 x1 x0 xn)
            if (this.stack.length < 2) {
              this.errStr = 'SCRIPT_ERR_INVALID_STACK_OPERATION';
              return false;
            }

            let buf = this.stack[this.stack.length - 1];
            let bn = new Bn().fromScriptNumBuffer(buf, fRequireMinimal);
            let n = bn.toNumber();
            this.stack.pop();

            if (n < 0 || n >= this.stack.length) {
              this.errStr = 'SCRIPT_ERR_INVALID_STACK_OPERATION';
              return false;
            }

            buf = this.stack[this.stack.length - n - 1];

            if (opCodeNum === OpCode.OP_ROLL) {
              this.stack.splice(this.stack.length - n - 1, 1);
            }

            this.stack.push(buf);
          }
          break;

        case OpCode.OP_ROT:
          {
            // (x1 x2 x3 -- x2 x3 x1)
            //  x2 x1 x3  after first swap
            //  x2 x3 x1  after second swap
            if (this.stack.length < 3) {
              this.errStr = 'SCRIPT_ERR_INVALID_STACK_OPERATION';
              return false;
            }

            let x1 = this.stack[this.stack.length - 3];
            let x2 = this.stack[this.stack.length - 2];
            let x3 = this.stack[this.stack.length - 1];
            this.stack[this.stack.length - 3] = x2;
            this.stack[this.stack.length - 2] = x3;
            this.stack[this.stack.length - 1] = x1;
          }
          break;

        case OpCode.OP_SWAP:
          {
            // (x1 x2 -- x2 x1)
            if (this.stack.length < 2) {
              this.errStr = 'SCRIPT_ERR_INVALID_STACK_OPERATION';
              return false;
            }

            let x1 = this.stack[this.stack.length - 2];
            let x2 = this.stack[this.stack.length - 1];
            this.stack[this.stack.length - 2] = x2;
            this.stack[this.stack.length - 1] = x1;
          }
          break;

        case OpCode.OP_TUCK:
          // (x1 x2 -- x2 x1 x2)
          if (this.stack.length < 2) {
            this.errStr = 'SCRIPT_ERR_INVALID_STACK_OPERATION';
            return false;
          }

          this.stack.splice(this.stack.length - 2, 0, this.stack[this.stack.length - 1]);
          break;

        case OpCode.OP_SIZE:
          {
            // (in -- in size)
            if (this.stack.length < 1) {
              this.errStr = 'SCRIPT_ERR_INVALID_STACK_OPERATION';
              return false;
            }

            let bn = new Bn(this.stack[this.stack.length - 1].length);
            this.stack.push(bn.toScriptNumBuffer());
          }
          break;
        //
        // Bitwise logic
        //

        case OpCode.OP_OR:
        case OpCode.OP_AND:
        case OpCode.OP_XOR:
          // (x1 x2 -- out)
          if (this.stack.length < 2) {
            this.errStr = 'SCRIPT_ERR_INVALID_STACK_OPERATION';
            return false;
          }

          let buf1 = this.stack[this.stack.length - 2];
          let buf2 = this.stack[this.stack.length - 1];

          if (buf1.length != buf2.length) {
            this.errStr = 'SCRIPT_ERR_INVALID_OPERAND_SIZE';
            return false;
          }

          switch (opCodeNum) {
            case OpCode.OP_AND:
              for (let i = 0; i < buf1.length; i++) {
                buf1[i] &= buf2[i];
              }

              break;

            case OpCode.OP_OR:
              for (let i = 0; i < buf1.length; i++) {
                buf1[i] |= buf2[i];
              }

              break;

            case OpCode.OP_XOR:
              for (let i = 0; i < buf1.length; i++) {
                buf1[i] ^= buf2[i];
              }

              break;
          } // pop out buf2


          this.stack.pop();
          break;

        case OpCode.OP_INVERT:
          // (x -- out)
          if (this.stack.length < 1) {
            this.errStr = 'SCRIPT_ERR_INVALID_STACK_OPERATION';
            return false;
          }

          let buf = this.stack[this.stack.length - 1];

          for (let i = 0; i < buf.length; i++) {
            buf[i] = ~buf[i];
          }

          break;

        case OpCode.OP_LSHIFT:
        case OpCode.OP_RSHIFT:
          // (x n -- out)
          {
            if (this.stack.length < 2) {
              this.errStr = 'SCRIPT_ERR_INVALID_STACK_OPERATION';
              return false;
            }

            let buf1 = this.stack[this.stack.length - 2];
            let value = new Bn(buf1);
            let n = new Bn().fromScriptNumBuffer(this.stack[this.stack.length - 1], fRequireMinimal).toNumber();

            if (n < 0) {
              this.errStr = 'SCRIPT_ERR_INVALID_NUMBER_RANGE';
              return false;
            }

            this.stack.pop();
            this.stack.pop();

            switch (opCodeNum) {
              case OpCode.OP_LSHIFT:
                value = value.ushln(n);
                break;

              case OpCode.OP_RSHIFT:
                value = value.ushrn(n);
                break;
            }

            let buf2 = value.toBuffer().slice(-buf1.length);

            if (buf2.length < buf1.length) {
              buf2 = Buffer.concat([Buffer.alloc(buf1.length - buf2.length), buf2]);
            }

            this.stack.push(buf2);
            break;
          }

        case OpCode.OP_EQUAL:
        case OpCode.OP_EQUALVERIFY:
          // case OpCode.OP_NOTEQUAL: // use OpCode.OP_NUMNOTEQUAL
          {
            // (x1 x2 - bool)
            if (this.stack.length < 2) {
              this.errStr = 'SCRIPT_ERR_INVALID_STACK_OPERATION';
              return false;
            }

            let buf1 = this.stack[this.stack.length - 2];
            let buf2 = this.stack[this.stack.length - 1];
            let fEqual = cmp(buf1, buf2); // OpCode.OP_NOTEQUAL is disabled because it would be too easy to say
            // something like n != 1 and have some wiseguy pass in 1 with extra
            // zero bytes after it (numerically, 0x01 == 0x0001 == 0x000001)
            // if (opCode == OpCode.OP_NOTEQUAL)
            //  fEqual = !fEqual

            this.stack.pop();
            this.stack.pop();
            this.stack.push(fEqual ? Interp.true : Interp.false);

            if (opCodeNum === OpCode.OP_EQUALVERIFY) {
              if (fEqual) {
                this.stack.pop();
              } else {
                this.errStr = 'SCRIPT_ERR_EQUALVERIFY';
                return false;
              }
            }
          }
          break;
        //
        // Numeric
        //

        case OpCode.OP_1ADD:
        case OpCode.OP_1SUB:
        case OpCode.OP_NEGATE:
        case OpCode.OP_ABS:
        case OpCode.OP_NOT:
        case OpCode.OP_0NOTEQUAL:
          {
            // (in -- out)
            if (this.stack.length < 1) {
              this.errStr = 'SCRIPT_ERR_INVALID_STACK_OPERATION';
              return false;
            }

            let buf = this.stack[this.stack.length - 1];
            let bn = new Bn().fromScriptNumBuffer(buf, fRequireMinimal);

            switch (opCodeNum) {
              case OpCode.OP_1ADD:
                bn = bn.add(1);
                break;

              case OpCode.OP_1SUB:
                bn = bn.sub(1);
                break;

              case OpCode.OP_NEGATE:
                bn = bn.neg();
                break;

              case OpCode.OP_ABS:
                if (bn.lt(0)) bn = bn.neg();
                break;

              case OpCode.OP_NOT:
                bn = new Bn(bn.eq(0) + 0);
                break;

              case OpCode.OP_0NOTEQUAL:
                bn = new Bn(bn.neq(0) + 0);
                break;
              // default:      assert(!"invalid opCode"); break; // TODO: does this ever occur?
            }

            this.stack.pop();
            this.stack.push(bn.toScriptNumBuffer());
          }
          break;

        case OpCode.OP_ADD:
        case OpCode.OP_SUB:
        case OpCode.OP_MUL:
        case OpCode.OP_DIV:
        case OpCode.OP_MOD:
        case OpCode.OP_BOOLAND:
        case OpCode.OP_BOOLOR:
        case OpCode.OP_NUMEQUAL:
        case OpCode.OP_NUMEQUALVERIFY:
        case OpCode.OP_NUMNOTEQUAL:
        case OpCode.OP_LESSTHAN:
        case OpCode.OP_GREATERTHAN:
        case OpCode.OP_LESSTHANOREQUAL:
        case OpCode.OP_GREATERTHANOREQUAL:
        case OpCode.OP_MIN:
        case OpCode.OP_MAX:
          {
            // (x1 x2 -- out)
            if (this.stack.length < 2) {
              this.errStr = 'SCRIPT_ERR_INVALID_STACK_OPERATION';
              return false;
            }

            let bn1 = new Bn().fromScriptNumBuffer(this.stack[this.stack.length - 2], fRequireMinimal);
            let bn2 = new Bn().fromScriptNumBuffer(this.stack[this.stack.length - 1], fRequireMinimal);
            let bn = new Bn(0);

            switch (opCodeNum) {
              case OpCode.OP_ADD:
                bn = bn1.add(bn2);
                break;

              case OpCode.OP_SUB:
                bn = bn1.sub(bn2);
                break;

              case OpCode.OP_MUL:
                bn = bn1.mul(bn2);
                break;

              case OpCode.OP_DIV:
                if (bn2 == 0) {
                  this.errStr = "SCRIPT_ERR_DIV_BY_ZERO";
                  return false;
                }

                bn = bn1.div(bn2);
                break;

              case OpCode.OP_MOD:
                if (bn2 == 0) {
                  this.errStr = "SCRIPT_ERR_DIV_BY_ZERO";
                  return false;
                }

                bn = bn1.mod(bn2);
                break;
              // case OpCode.OP_BOOLAND:       bn = (bn1 != bnZero && bn2 != bnZero); break

              case OpCode.OP_BOOLAND:
                bn = new Bn((bn1.neq(0) && bn2.neq(0)) + 0);
                break;
              // case OpCode.OP_BOOLOR:        bn = (bn1 != bnZero || bn2 != bnZero); break

              case OpCode.OP_BOOLOR:
                bn = new Bn((bn1.neq(0) || bn2.neq(0)) + 0);
                break;
              // case OpCode.OP_NUMEQUAL:      bn = (bn1 == bn2); break

              case OpCode.OP_NUMEQUAL:
                bn = new Bn(bn1.eq(bn2) + 0);
                break;
              // case OpCode.OP_NUMEQUALVERIFY:    bn = (bn1 == bn2); break

              case OpCode.OP_NUMEQUALVERIFY:
                bn = new Bn(bn1.eq(bn2) + 0);
                break;
              // case OpCode.OP_NUMNOTEQUAL:     bn = (bn1 != bn2); break

              case OpCode.OP_NUMNOTEQUAL:
                bn = new Bn(bn1.neq(bn2) + 0);
                break;
              // case OpCode.OP_LESSTHAN:      bn = (bn1 < bn2); break

              case OpCode.OP_LESSTHAN:
                bn = new Bn(bn1.lt(bn2) + 0);
                break;
              // case OpCode.OP_GREATERTHAN:     bn = (bn1 > bn2); break

              case OpCode.OP_GREATERTHAN:
                bn = new Bn(bn1.gt(bn2) + 0);
                break;
              // case OpCode.OP_LESSTHANOREQUAL:   bn = (bn1 <= bn2); break

              case OpCode.OP_LESSTHANOREQUAL:
                bn = new Bn(bn1.leq(bn2) + 0);
                break;
              // case OpCode.OP_GREATERTHANOREQUAL:  bn = (bn1 >= bn2); break

              case OpCode.OP_GREATERTHANOREQUAL:
                bn = new Bn(bn1.geq(bn2) + 0);
                break;

              case OpCode.OP_MIN:
                bn = bn1.lt(bn2) ? bn1 : bn2;
                break;

              case OpCode.OP_MAX:
                bn = bn1.gt(bn2) ? bn1 : bn2;
                break;
              // default:           assert(!"invalid opCode"); break; //TODO: does this ever occur?
            }

            this.stack.pop();
            this.stack.pop();
            this.stack.push(bn.toScriptNumBuffer());

            if (opCodeNum === OpCode.OP_NUMEQUALVERIFY) {
              // if (CastToBool(stacktop(-1)))
              if (Interp.castToBool(this.stack[this.stack.length - 1])) {
                this.stack.pop();
              } else {
                this.errStr = 'SCRIPT_ERR_NUMEQUALVERIFY';
                return false;
              }
            }
          }
          break;

        case OpCode.OP_WITHIN:
          {
            // (x min max -- out)
            if (this.stack.length < 3) {
              this.errStr = 'SCRIPT_ERR_INVALID_STACK_OPERATION';
              return false;
            }

            let bn1 = new Bn().fromScriptNumBuffer(this.stack[this.stack.length - 3], fRequireMinimal);
            let bn2 = new Bn().fromScriptNumBuffer(this.stack[this.stack.length - 2], fRequireMinimal);
            let bn3 = new Bn().fromScriptNumBuffer(this.stack[this.stack.length - 1], fRequireMinimal); // bool fValue = (bn2 <= bn1 && bn1 < bn3)

            let fValue = bn2.leq(bn1) && bn1.lt(bn3);
            this.stack.pop();
            this.stack.pop();
            this.stack.pop();
            this.stack.push(fValue ? Interp.true : Interp.false);
          }
          break;
        //
        // Crypto
        //

        case OpCode.OP_RIPEMD160:
        case OpCode.OP_SHA1:
        case OpCode.OP_SHA256:
        case OpCode.OP_HASH160:
        case OpCode.OP_HASH256:
          {
            // (in -- hash)
            if (this.stack.length < 1) {
              this.errStr = 'SCRIPT_ERR_INVALID_STACK_OPERATION';
              return false;
            }

            let buf = this.stack[this.stack.length - 1]; // valtype vchnew Hash((opCode == OpCode.OP_RIPEMD160 || opCode == OpCode.OP_SHA1 || opCode == OpCode.OP_HASH160) ? 20 : 32)

            let bufHash;

            if (opCodeNum === OpCode.OP_RIPEMD160) {
              bufHash = Hash.ripemd160(buf);
            } else if (opCodeNum === OpCode.OP_SHA1) {
              bufHash = Hash.sha1(buf);
            } else if (opCodeNum === OpCode.OP_SHA256) {
              bufHash = Hash.sha256(buf);
            } else if (opCodeNum === OpCode.OP_HASH160) {
              bufHash = Hash.sha256Ripemd160(buf);
            } else if (opCodeNum === OpCode.OP_HASH256) {
              bufHash = Hash.sha256Sha256(buf);
            }

            this.stack.pop();
            this.stack.push(bufHash);
          }
          break;

        case OpCode.OP_CODESEPARATOR:
          // Hash starts after the code separator
          this.pBeginCodeHash = this.pc;
          break;

        case OpCode.OP_CHECKSIG:
        case OpCode.OP_CHECKSIGVERIFY:
          {
            // (sig pubKey -- bool)
            if (this.stack.length < 2) {
              this.errStr = 'SCRIPT_ERR_INVALID_STACK_OPERATION';
              return false;
            }

            let bufSig = this.stack[this.stack.length - 2];
            let bufPubKey = this.stack[this.stack.length - 1]; // Subset of script starting at the most recent codeseparator
            // CScript scriptCode(pBeginCodeHash, pend)

            let subScript = new Script().fromObject({
              chunks: this.script.chunks.slice(this.pBeginCodeHash)
            }); // https://github.com/Bitcoin-UAHF/spec/blob/master/replay-protected-sighash.md

            let nHashType = bufSig.length > 0 ? bufSig.readUInt8(bufSig.length - 1) : 0;

            if (nHashType & Sig.SIGHASH_FORKID) {
              if (!(this.flags & Interp.SCRIPT_ENABLE_SIGHASH_FORKID)) {
                this.errStr = 'SCRIPT_ERR_ILLEGAL_FORKID';
                return false;
              }
            } else {
              subScript.findAndDelete(new Script().writeBuffer(bufSig));
            }

            if (!this.checkSigEncoding(bufSig) || !this.checkPubKeyEncoding(bufPubKey)) {
              // serror is set
              return false;
            }

            let fSuccess;

            try {
              let sig = new Sig().fromTxFormat(bufSig);
              let pubKey = new PubKey().fromBuffer(bufPubKey, false);
              fSuccess = this.tx.verify(sig, pubKey, this.nIn, subScript, Boolean(this.flags & Interp.SCRIPT_VERIFY_LOW_S), this.valueBn, this.flags);
            } catch (e) {
              // invalid sig or pubKey
              fSuccess = false;
            }

            this.stack.pop();
            this.stack.pop(); // stack.push_back(fSuccess ? vchTrue : vchFalse)

            this.stack.push(fSuccess ? Interp.true : Interp.false);

            if (opCodeNum === OpCode.OP_CHECKSIGVERIFY) {
              if (fSuccess) {
                this.stack.pop();
              } else {
                this.errStr = 'SCRIPT_ERR_CHECKSIGVERIFY';
                return false;
              }
            }
          }
          break;

        case OpCode.OP_CHECKMULTISIG:
        case OpCode.OP_CHECKMULTISIGVERIFY:
          {
            // ([sig ...] num_of_signatures [pubKey ...] num_of_pubKeys -- bool)
            let i = 1;

            if (this.stack.length < i) {
              this.errStr = 'SCRIPT_ERR_INVALID_STACK_OPERATION';
              return false;
            }

            let nKeysCount = new Bn().fromScriptNumBuffer(this.stack[this.stack.length - i], fRequireMinimal).toNumber();

            if (nKeysCount < 0 || nKeysCount > 20) {
              this.errStr = 'SCRIPT_ERR_PUBKEY_COUNT';
              return false;
            }

            this.nOpCount += nKeysCount;

            if (this.nOpCount > 201) {
              this.errStr = 'SCRIPT_ERR_OP_COUNT';
              return false;
            } // int ikey = ++i


            let ikey = ++i;
            i += nKeysCount;

            if (this.stack.length < i) {
              this.errStr = 'SCRIPT_ERR_INVALID_STACK_OPERATION';
              return false;
            }

            let nSigsCount = new Bn().fromScriptNumBuffer(this.stack[this.stack.length - i], fRequireMinimal).toNumber();

            if (nSigsCount < 0 || nSigsCount > nKeysCount) {
              this.errStr = 'SCRIPT_ERR_SIG_COUNT';
              return false;
            } // int isig = ++i


            let isig = ++i;
            i += nSigsCount;

            if (this.stack.length < i) {
              this.errStr = 'SCRIPT_ERR_INVALID_STACK_OPERATION';
              return false;
            } // Subset of script starting at the most recent codeseparator


            let subScript = new Script().fromObject({
              chunks: this.script.chunks.slice(this.pBeginCodeHash)
            });

            for (let k = 0; k < nSigsCount; k++) {
              let bufSig = this.stack[this.stack.length - isig - k]; // https://github.com/Bitcoin-UAHF/spec/blob/master/replay-protected-sighash.md

              let nHashType = bufSig.length > 0 ? bufSig.readUInt8(bufSig.length - 1) : 0;

              if (nHashType & Sig.SIGHASH_FORKID) {
                if (!(this.flags & Interp.SCRIPT_ENABLE_SIGHASH_FORKID)) {
                  this.errStr = 'SCRIPT_ERR_ILLEGAL_FORKID';
                  return false;
                }
              } else {
                // Drop the signature, since there's no way for a signature to sign itself
                subScript.findAndDelete(new Script().writeBuffer(bufSig));
              }
            }

            let fSuccess = true;

            while (fSuccess && nSigsCount > 0) {
              // valtype& vchSig  = stacktop(-isig)
              let bufSig = this.stack[this.stack.length - isig]; // valtype& vchPubKey = stacktop(-ikey)

              let bufPubKey = this.stack[this.stack.length - ikey];

              if (!this.checkSigEncoding(bufSig) || !this.checkPubKeyEncoding(bufPubKey)) {
                // serror is set
                return false;
              }

              let fOk;

              try {
                let sig = new Sig().fromTxFormat(bufSig);
                let pubKey = new PubKey().fromBuffer(bufPubKey, false);
                fOk = this.tx.verify(sig, pubKey, this.nIn, subScript, Boolean(this.flags & Interp.SCRIPT_VERIFY_LOW_S), this.valueBn, this.flags);
              } catch (e) {
                // invalid sig or pubKey
                fOk = false;
              }

              if (fOk) {
                isig++;
                nSigsCount--;
              }

              ikey++;
              nKeysCount--; // If there are more signatures left than keys left,
              // then too many signatures have failed

              if (nSigsCount > nKeysCount) {
                fSuccess = false;
              }
            } // Clean up stack of actual arguments


            while (i-- > 1) {
              this.stack.pop();
            } // A bug causes CHECKMULTISIG to consume one extra argument
            // whose contents were not checked in any way.
            //
            // Unfortunately this is a potential source of mutability,
            // so optionally verify it is exactly equal to zero prior
            // to removing it from the stack.


            if (this.stack.length < 1) {
              this.errStr = 'SCRIPT_ERR_INVALID_STACK_OPERATION';
              return false;
            }

            if (this.flags & Interp.SCRIPT_VERIFY_NULLDUMMY && this.stack[this.stack.length - 1].length) {
              this.errStr = 'SCRIPT_ERR_SIG_NULLDUMMY';
              return false;
            }

            this.stack.pop(); // stack.push_back(fSuccess ? vchTrue : vchFalse)

            this.stack.push(fSuccess ? Interp.true : Interp.false);

            if (opCodeNum === OpCode.OP_CHECKMULTISIGVERIFY) {
              if (fSuccess) {
                this.stack.pop();
              } else {
                this.errStr = 'SCRIPT_ERR_CHECKMULTISIGVERIFY';
                return false;
              }
            }
          }
          break;
        //
        // Byte string operations
        //

        case OpCode.OP_CAT:
          if (this.stack.length < 2) {
            this.errStr = 'SCRIPT_ERR_INVALID_STACK_OPERATION';
            return false;
          }

          let vch1 = this.stack[this.stack.length - 2];
          let vch2 = this.stack[this.stack.length - 1];
          this.stack[this.stack.length - 2] = Buffer.concat([vch1, vch2]);
          this.stack.pop();
          break;

        case OpCode.OP_SPLIT:
          if (this.stack.length < 2) {
            this.errStr = 'SCRIPT_ERR_INVALID_STACK_OPERATION';
            return false;
          }

          let data = this.stack[this.stack.length - 2];
          let position = new Bn().fromScriptNumBuffer(this.stack[this.stack.length - 1], fRequireMinimal);

          if (position.lt(0) || position.gt(data.length)) {
            this.errStr = 'SCRIPT_ERR_INVALID_SPLIT_RANGE';
            return false;
          }

          let n1 = data.slice(0, position);
          let n2 = data.slice(position);
          this.stack.pop();
          this.stack.pop();
          this.stack.push(n1);
          this.stack.push(n2);
          break;

        default:
          this.errStr = 'SCRIPT_ERR_BAD_OPCODE';
          return false;
      }
    }

    return true;
  }
  /**
   * This function has the same interface as bitcoin core's VerifyScript and is
   * the function you want to use to know if a particular input in a
   * transaction is valid or not. It simply iterates over the results generated
   * by the results method.
   */


  verify(scriptSig, scriptPubKey, tx, nIn, flags, valueBn) {
    let results = this.results(scriptSig, scriptPubKey, tx, nIn, flags, valueBn);

    for (let success of results) {
      if (!success) {
        return false;
      }
    }

    return true;
  }
  /**
   * Gives you the results of the execution each operation of the scripSig and
   * scriptPubKey corresponding to a particular input (nIn) for the concerned
   * transaction (tx). Each result can be either true or false. If true, then
   * the operation did not invalidate the transaction. If false, then the
   * operation has invalidated the script, and the transaction is not valid.
   * flags is a number that can pass in some special flags, such as whether or
   * not to execute the redeemScript in a p2sh transaction.
   *
   * This method is translated from bitcoin core's VerifyScript.  This function
   * is a generator, thus you can and need to iterate through it.  To
   * automatically return true or false, use the verify method.
   */


  *results(scriptSig, scriptPubKey, tx, nIn, flags, valueBn) {
    let stackCopy;
    this.fromObject({
      script: scriptSig,
      tx: tx,
      nIn: nIn,
      flags: flags,
      valueBn: valueBn
    });

    if ((flags & Interp.SCRIPT_VERIFY_SIGPUSHONLY) !== 0 && !scriptSig.isPushOnly()) {
      this.errStr = this.errStr || 'SCRIPT_ERR_SIG_PUSHONLY';
      yield false;
    }

    yield* this.eval();

    if (flags & Interp.SCRIPT_VERIFY_P2SH) {
      stackCopy = this.stack.slice();
    }

    let stack = this.stack;
    this.initialize();
    this.fromObject({
      script: scriptPubKey,
      stack: stack,
      tx: tx,
      nIn: nIn,
      flags: flags,
      valueBn: valueBn
    });
    yield* this.eval();

    if (this.stack.length === 0) {
      this.errStr = this.errStr || 'SCRIPT_ERR_EVAL_FALSE';
      yield false;
    }

    let buf = this.stack[this.stack.length - 1];

    if (!Interp.castToBool(buf)) {
      this.errStr = this.errStr || 'SCRIPT_ERR_EVAL_FALSE';
      yield false;
    } // Additional validation for spend-to-script-hash transactions:


    if (flags & Interp.SCRIPT_VERIFY_P2SH && scriptPubKey.isScriptHashOut()) {
      // scriptSig must be literals-only or validation fails
      if (!scriptSig.isPushOnly()) {
        this.errStr = this.errStr || 'SCRIPT_ERR_SIG_PUSHONLY';
        yield false;
      } // Restore stack.


      let tmp = stack;
      stack = stackCopy;
      stackCopy = tmp; // stack cannot be empty here, because if it was the
      // P2SH  HASH <> EQUAL  scriptPubKey would be evaluated with
      // an empty stack and the EvalScript above would yield false.

      if (stack.length === 0) {
        throw new Error('internal error - stack copy empty');
      }

      let pubKeySerialized = stack[stack.length - 1];
      let scriptPubKey2 = new Script().fromBuffer(pubKeySerialized);
      stack.pop();
      this.initialize();
      this.fromObject({
        script: scriptPubKey2,
        stack: stack,
        tx: tx,
        nIn: nIn,
        flags: flags,
        valueBn: valueBn
      });
      yield* this.eval();

      if (stack.length === 0) {
        this.errStr = this.errStr || 'SCRIPT_ERR_EVAL_FALSE';
        yield false;
      }

      if (!Interp.castToBool(stack[stack.length - 1])) {
        this.errStr = this.errStr || 'SCRIPT_ERR_EVAL_FALSE';
        yield false;
      } else {
        yield true;
      }
    } // The CLEANSTACK check is only performed after potential P2SH evaluation,
    // as the non-P2SH evaluation of a P2SH script will obviously not result in
    // a clean stack (the P2SH inputs remain).


    if ((flags & Interp.SCRIPT_VERIFY_CLEANSTACK) !== 0) {
      // Disallow CLEANSTACK without P2SH, as otherwise a switch
      // CLEANSTACK->P2SH+CLEANSTACK would be possible, which is not a softfork
      // (and P2SH should be one).
      if (!(flags & Interp.SCRIPT_VERIFY_P2SH)) {
        throw new Error('cannot use CLEANSTACK without P2SH');
      }

      if (stack.length !== 1) {
        this.errStr = this.errStr || 'SCRIPT_ERR_CLEANSTACK';
        yield false;
      }
    }

    yield true;
  }
  /**
   * If the script has failed, this methods returns valuable debug
   * information about exactly where the script failed. It is a
   * JSON-compatible object so it can be easily stringified. pc refers to the
   * currently executing opcode.
   */


  getDebugObject() {
    let pc = this.pc - 1; // pc is incremented immediately after getting

    return {
      errStr: this.errStr,
      scriptStr: this.script ? this.script.toString() : 'no script found',
      pc: pc,
      stack: this.stack.map(buf => buf.toString('hex')),
      altStack: this.altStack.map(buf => buf.toString('hex')),
      opCodeStr: this.script ? OpCode.fromNumber(this.script.chunks[pc].opCodeNum).toString() : 'no script found'
    };
  }

  getDebugString() {
    return JSON.stringify(this.getDebugObject(), null, 2);
  }

}

Interp.true = Buffer.from([1]);
Interp.false = Buffer.from([]);
Interp.MAX_SCRIPT_ELEMENT_SIZE = 520;
Interp.LOCKTIME_THRESHOLD = 500000000; // Tue Nov  5 00:53:20 1985 UTC
// flags taken from bitcoin core
// bitcoin core commit: b5d1b1092998bc95313856d535c632ea5a8f9104

Interp.SCRIPT_VERIFY_NONE = 0; // Evaluate P2SH subScripts (softfork safe, Bip16).

Interp.SCRIPT_VERIFY_P2SH = 1 << 0; // Passing a non-strict-DER signature or one with undefined hashtype to a checksig operation causes script failure.
// Passing a pubKey that is not (0x04 + 64 bytes) or (0x02 or 0x03 + 32 bytes) to checksig causes that pubKey to be
// skipped (not softfork safe: this flag can widen the validity of OP_CHECKSIG OP_NOT).

Interp.SCRIPT_VERIFY_STRICTENC = 1 << 1; // Passing a non-strict-DER signature to a checksig operation causes script failure (softfork safe, Bip62 rule 1)

Interp.SCRIPT_VERIFY_DERSIG = 1 << 2; // Passing a non-strict-DER signature or one with S > order/2 to a checksig operation causes script failure
// (softfork safe, Bip62 rule 5).

Interp.SCRIPT_VERIFY_LOW_S = 1 << 3; // verify dummy stack item consumed by CHECKMULTISIG is of zero-length (softfork safe, Bip62 rule 7).

Interp.SCRIPT_VERIFY_NULLDUMMY = 1 << 4; // Using a non-push operator in the scriptSig causes script failure (softfork safe, Bip62 rule 2).

Interp.SCRIPT_VERIFY_SIGPUSHONLY = 1 << 5; // Require minimal encodings for all push operations (OP_0... OP_16, OP_1NEGATE where possible, direct
// pushes up to 75 bytes, OP_PUSHDATA up to 255 bytes, OP_PUSHDATA2 for anything larger). Evaluating
// any other push causes the script to fail (Bip62 rule 3).
// In addition, whenever a stack element is interpreted as a number, it must be of minimal length (Bip62 rule 4).
// (softfork safe)

Interp.SCRIPT_VERIFY_MINIMALDATA = 1 << 6; // Discourage use of NOPs reserved for upgrades (NOP1-10)
//
// Provided so that nodes can avoid accepting or mining transactions
// containing executed NOP's whose meaning may change after a soft-fork,
// thus rendering the script invalid; with this flag set executing
// discouraged NOPs fails the script. This verification flag will never be
// a mandatory flag applied to scripts in a block. NOPs that are not
// executed, e.g.  within an unexecuted IF ENDIF block, are *not* rejected.

Interp.SCRIPT_VERIFY_DISCOURAGE_UPGRADABLE_NOPS = 1 << 7; // Require that only a single stack element remains after evaluation. This
// changes the success criterion from "At least one stack element must
// remain, and when interpreted as a boolean, it must be true" to "Exactly
// one stack element must remain, and when interpreted as a boolean, it must
// be true".  (softfork safe, Bip62 rule 6)
// Note: CLEANSTACK should never be used without P2SH.

Interp.SCRIPT_VERIFY_CLEANSTACK = 1 << 8; // Verify CHECKLOCKTIMEVERIFY
//
// See Bip65 for details.

Interp.SCRIPT_VERIFY_CHECKLOCKTIMEVERIFY = 1 << 9; // support CHECKSEQUENCEVERIFY opCode
//
// See Bip112 for details

Interp.SCRIPT_VERIFY_CHECKSEQUENCEVERIFY = 1 << 10; // used for UAHF
// https://github.com/Bitcoin-UAHF/spec/blob/master/replay-protected-sighash.md

Interp.SCRIPT_ENABLE_SIGHASH_FORKID = 1 << 16; // These are the things we wish to verify by default. At the time of writing,
// P2SH and CHECKLOCKTIMEVERIFY are both active, but CHECKSEQUENCEVERIFY is
// not.

Interp.defaultFlags = Interp.SCRIPT_VERIFY_P2SH | Interp.SCRIPT_VERIFY_CHECKLOCKTIMEVERIFY; // Interp.defaultFlags = Interp.SCRIPT_VERIFY_P2SH | Interp.SCRIPT_VERIFY_CHECKLOCKTIMEVERIFY | Interp.SCRIPT_VERIFY_CHECKSEQUENCEVERIFY

function _extends() {
  _extends = Object.assign || function (target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];

      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }

    return target;
  };

  return _extends.apply(this, arguments);
}

/**
 * PubKey Map
 * ==========
 *
 * A map from (transaction hash, output number) to (script chunk index, pubKey).
 * Whening signing a bitcoin transaction, we need to be able to sign an input
 * with the correct key and also we need to know where to put signature when we
 * get it. This mapping allows us to find the key for an associated input (which
 * is identified by tx output hash and number) with which to sign the
 * transaction and then also to know where to insert the signature into the
 * input script. This gets us the public key, and we need a different method to
 * get the private key. That is because we often know the public key to be used
 * but may not have access to the private key until the entire tx is sent to
 * where the private keys are.
 */

class SigOperations extends Struct {
  constructor(map = new Map()) {
    super({
      map
    });
  }

  toJSON() {
    const json = {};
    this.map.forEach((arr, label) => {
      json[label] = arr.map(obj => ({
        nScriptChunk: obj.nScriptChunk,
        type: obj.type,
        // 'sig' or 'pubKey'
        addressStr: obj.addressStr,
        nHashType: obj.nHashType,
        log: obj.log
      }));
    });
    return json;
  }

  fromJSON(json) {
    Object.keys(json).forEach(label => {
      this.map.set(label, json[label].map(obj => ({
        nScriptChunk: obj.nScriptChunk,
        type: obj.type,
        addressStr: obj.addressStr,
        nHashType: obj.nHashType,
        log: obj.log
      })));
    });
    return this;
  }
  /**
   * Set an address to in the map for use with single-sig.
   *
   * @param {Buffer} txHashBuf The hash of a transsaction. Note that this is
   * *not* the reversed transaction id, but is the raw hash.
   * @param {Number} txOutNum The output number, a.k.a. the "vout".
   * @param {Number} nScriptChunk The index of the chunk of the script where
   * we are going to place the signature.
   * @param {String} addressStr The addressStr coresponding to this (txHashBuf,
   * txOutNum, nScriptChunk) where we are going to sign and insert the
   * signature or public key.
   * @param {Number} nHashType Usually = Sig.SIGHASH_ALL | Sig.SIGHASH_FORKID
   */


  setOne(txHashBuf, txOutNum, nScriptChunk, type = 'sig', addressStr, nHashType = Sig.SIGHASH_ALL | Sig.SIGHASH_FORKID) {
    const label = txHashBuf.toString('hex') + ':' + txOutNum;
    const obj = {
      nScriptChunk,
      type,
      addressStr,
      nHashType
    };
    this.map.set(label, [obj]);
    return this;
  }
  /**
   * Set a bunch of addresses for signing an input such as for use with multi-sig.
   *
   * @param {Buffer} txHashBuf The hash of a transsaction. Note that this is
   * *not* the reversed transaction id, but is the raw hash.
   * @param {Number} txOutNum The output number, a.k.a. the "vout".
   * @param {Array} arr Must take the form of [{nScriptChunk, type, addressStr, nHashType}, ...]
   */


  setMany(txHashBuf, txOutNum, arr) {
    const label = txHashBuf.toString('hex') + ':' + txOutNum;
    arr = arr.map(obj => _extends({
      type: obj.type || 'sig',
      nHashType: obj.nHashType || Sig.SIGHASH_ALL | Sig.SIGHASH_FORKID
    }, obj));
    this.map.set(label, arr);
    return this;
  }

  addOne(txHashBuf, txOutNum, nScriptChunk, type = 'sig', addressStr, nHashType = Sig.SIGHASH_ALL | Sig.SIGHASH_FORKID) {
    const arr = this.get(txHashBuf, txOutNum) || [];
    arr.push({
      nScriptChunk,
      type,
      addressStr,
      nHashType
    });
    this.setMany(txHashBuf, txOutNum, arr);
    return this;
  }
  /**
   * Get an address from the map
   *
   * @param {Buffer} txHashBuf The hash of a transction. Note that this is *not*
   * the reversed transaction id, but is the raw hash.
   * @param {Number} txOutNum The output number, a.k.a. the "vout".
   * @param {Number} nScriptChunk The index of the chunk of the script where
   * we are going to place the signature.
   * @returns {PubKey}
   */


  get(txHashBuf, txOutNum) {
    const label = txHashBuf.toString('hex') + ':' + txOutNum;
    return this.map.get(label) || [];
  }

}

/**
 * Transaction Output Map
 * ======================
 *
 * A map from a transaction hash and output number to that particular output.
 * Note that the map is from the transaction *hash*, which is the value that
 * occurs in the blockchain, not the id, which is the reverse of the hash. The
 * TxOutMap is necessary when signing a transction to get the script and value
 * of that output which is plugged into the sighash algorithm.
 */

class TxOutMap extends Struct {
  constructor(map = new Map()) {
    super({
      map
    });
  }

  toJSON() {
    const json = {};
    this.map.forEach((txOut, label) => {
      json[label] = txOut.toHex();
    });
    return json;
  }

  fromJSON(json) {
    Object.keys(json).forEach(label => {
      this.map.set(label, TxOut.fromHex(json[label]));
    });
    return this;
  }

  set(txHashBuf, txOutNum, txOut) {
    const label = txHashBuf.toString('hex') + ':' + txOutNum;
    this.map.set(label, txOut);
    return this;
  }

  get(txHashBuf, txOutNum) {
    const label = txHashBuf.toString('hex') + ':' + txOutNum;
    return this.map.get(label);
  }

  setTx(tx) {
    const txhashhex = tx.hash().toString('hex');
    tx.txOuts.forEach((txOut, index) => {
      const label = txhashhex + ':' + index;
      this.map.set(label, txOut);
    });
    return this;
  }

}

/**
 * Transaction Builder
 * ===================
 */
const Constants$1 = Constants.Default.TxBuilder;

class TxBuilder extends Struct {
  constructor(tx = new Tx(), txIns = [], txOuts = [], uTxOutMap = new TxOutMap(), sigOperations = new SigOperations(), changeScript, changeAmountBn, feeAmountBn, feePerKbNum = Constants$1.feePerKbNum, nLockTime = 0, versionBytesNum = 1, sigsPerInput = 1, dust = Constants$1.dust, dustChangeToFees = false, hashCache = new HashCache()) {
    super({
      tx,
      txIns,
      txOuts,
      uTxOutMap,
      sigOperations,
      changeScript,
      changeAmountBn,
      feeAmountBn,
      feePerKbNum,
      nLockTime,
      versionBytesNum,
      sigsPerInput,
      dust,
      dustChangeToFees,
      hashCache
    });
  }

  toJSON() {
    const json = {};
    json.tx = this.tx.toHex();
    json.txIns = this.txIns.map(txIn => txIn.toHex());
    json.txOuts = this.txOuts.map(txOut => txOut.toHex());
    json.uTxOutMap = this.uTxOutMap.toJSON();
    json.sigOperations = this.sigOperations.toJSON();
    json.changeScript = this.changeScript ? this.changeScript.toHex() : undefined;
    json.changeAmountBn = this.changeAmountBn ? this.changeAmountBn.toNumber() : undefined;
    json.feeAmountBn = this.feeAmountBn ? this.feeAmountBn.toNumber() : undefined;
    json.feePerKbNum = this.feePerKbNum;
    json.sigsPerInput = this.sigsPerInput;
    json.dust = this.dust;
    json.dustChangeToFees = this.dustChangeToFees;
    json.hashCache = this.hashCache.toJSON();
    return json;
  }

  fromJSON(json) {
    this.tx = new Tx().fromHex(json.tx);
    this.txIns = json.txIns.map(txIn => TxIn.fromHex(txIn));
    this.txOuts = json.txOuts.map(txOut => TxOut.fromHex(txOut));
    this.uTxOutMap = new TxOutMap().fromJSON(json.uTxOutMap);
    this.sigOperations = new SigOperations().fromJSON(json.sigOperations);
    this.changeScript = json.changeScript ? new Script().fromHex(json.changeScript) : undefined;
    this.changeAmountBn = json.changeAmountBn ? new Bn(json.changeAmountBn) : undefined;
    this.feeAmountBn = json.feeAmountBn ? new Bn(json.feeAmountBn) : undefined;
    this.feePerKbNum = json.feePerKbNum || this.feePerKbNum;
    this.sigsPerInput = json.sigsPerInput || this.sigsPerInput;
    this.dust = json.dust || this.dust;
    this.dustChangeToFees = json.dustChangeToFees || this.dustChangeToFees;
    this.hashCache = HashCache.fromJSON(json.hashCache);
    return this;
  }

  setFeePerKbNum(feePerKbNum) {
    if (typeof feePerKbNum !== 'number' || feePerKbNum < 0) {
      throw new Error('cannot set a fee of zero or less');
    }

    this.feePerKbNum = feePerKbNum;
    return this;
  }

  setChangeAddress(changeAddress) {
    this.changeScript = changeAddress.toTxOutScript();
    return this;
  }

  setChangeScript(changeScript) {
    this.changeScript = changeScript;
    return this;
  }
  /**
     * nLockTime is an unsigned integer.
     */


  setNLocktime(nLockTime) {
    this.nLockTime = nLockTime;
    return this;
  }

  setVersion(versionBytesNum) {
    this.versionBytesNum = versionBytesNum;
    return this;
  }
  /**
     * Sometimes one of your outputs or the change output will be less than
     * dust. Values less than dust cannot be broadcast. If you are OK with
     * sending dust amounts to fees, then set this value to true.
     */


  setDust(dust = Constants$1.dust) {
    this.dust = dust;
    return this;
  }
  /**
     * Sometimes one of your outputs or the change output will be less than
     * dust. Values less than dust cannot be broadcast. If you are OK with
     * sending dust amounts to fees, then set this value to true. We
     * preferentially send all dust to the change if possible. However, that
     * might not be possible if the change itself is less than dust, in which
     * case all dust goes to fees.
     */


  sendDustChangeToFees(dustChangeToFees = false) {
    this.dustChangeToFees = dustChangeToFees;
    return this;
  }
  /**
     * Import a transaction partially signed by someone else. The only thing you
     * can do after this is sign one or more inputs. Usually used for multisig
     * transactions. uTxOutMap is optional. It is not necessary so long as you
     * pass in the txOut when you sign. You need to know the output when signing
     * an input, including the script in the output, which is why this is
     * necessary when signing an input.
     */


  importPartiallySignedTx(tx, uTxOutMap = this.uTxOutMap, sigOperations = this.sigOperations) {
    this.tx = tx;
    this.uTxOutMap = uTxOutMap;
    this.sigOperations = sigOperations;
    return this;
  }
  /**
     * Pay "from" a script - in other words, add an input to the transaction.
     */


  inputFromScript(txHashBuf, txOutNum, txOut, script, nSequence) {
    if (!Buffer.isBuffer(txHashBuf) || !(typeof txOutNum === 'number') || !(txOut instanceof TxOut) || !(script instanceof Script)) {
      throw new Error('invalid one of: txHashBuf, txOutNum, txOut, script');
    }

    this.txIns.push(TxIn.fromProperties(txHashBuf, txOutNum, script, nSequence));
    this.uTxOutMap.set(txHashBuf, txOutNum, txOut);
    return this;
  }

  addSigOperation(txHashBuf, txOutNum, nScriptChunk, type, addressStr, nHashType) {
    this.sigOperations.addOne(txHashBuf, txOutNum, nScriptChunk, type, addressStr, nHashType);
    return this;
  }
  /**
     * Pay "from" a pubKeyHash output - in other words, add an input to the
     * transaction.
     */


  inputFromPubKeyHash(txHashBuf, txOutNum, txOut, pubKey, nSequence, nHashType) {
    if (!Buffer.isBuffer(txHashBuf) || typeof txOutNum !== 'number' || !(txOut instanceof TxOut)) {
      throw new Error('invalid one of: txHashBuf, txOutNum, txOut');
    }

    this.txIns.push(new TxIn().fromObject({
      nSequence
    }).fromPubKeyHashTxOut(txHashBuf, txOutNum, txOut, pubKey));
    this.uTxOutMap.set(txHashBuf, txOutNum, txOut);
    const addressStr = Address.fromTxOutScript(txOut.script).toString();
    this.addSigOperation(txHashBuf, txOutNum, 0, 'sig', addressStr, nHashType);
    this.addSigOperation(txHashBuf, txOutNum, 1, 'pubKey', addressStr);
    return this;
  }
  /**
     * An address to send funds to, along with the amount. The amount should be
     * denominated in satoshis, not bitcoins.
     */


  outputToAddress(valueBn, addr) {
    if (!(addr instanceof Address) || !(valueBn instanceof Bn)) {
      throw new Error('addr must be an Address, and valueBn must be a Bn');
    }

    const script = new Script().fromPubKeyHash(addr.hashBuf);
    this.outputToScript(valueBn, script);
    return this;
  }
  /**
     * A script to send funds to, along with the amount. The amount should be
     * denominated in satoshis, not bitcoins.
     */


  outputToScript(valueBn, script) {
    if (!(script instanceof Script) || !(valueBn instanceof Bn)) {
      throw new Error('script must be a Script, and valueBn must be a Bn');
    }

    const txOut = TxOut.fromProperties(valueBn, script);
    this.txOuts.push(txOut);
    return this;
  }

  buildOutputs() {
    let outAmountBn = new Bn(0);
    this.txOuts.forEach(txOut => {
      if (txOut.valueBn.lt(this.dust) && !txOut.script.isOpReturn() && !txOut.script.isSafeDataOut()) {
        throw new Error('cannot create output lesser than dust');
      }

      outAmountBn = outAmountBn.add(txOut.valueBn);
      this.tx.addTxOut(txOut);
    });
    return outAmountBn;
  }

  buildInputs(outAmountBn, extraInputsNum = 0) {
    let inAmountBn = new Bn(0);

    for (const txIn of this.txIns) {
      const txOut = this.uTxOutMap.get(txIn.txHashBuf, txIn.txOutNum);
      inAmountBn = inAmountBn.add(txOut.valueBn);
      this.tx.addTxIn(txIn);

      if (inAmountBn.geq(outAmountBn)) {
        if (extraInputsNum <= 0) {
          break;
        }

        extraInputsNum--;
      }
    }

    if (inAmountBn.lt(outAmountBn)) {
      throw new Error('not enough funds for outputs: inAmountBn ' + inAmountBn.toNumber() + ' outAmountBn ' + outAmountBn.toNumber());
    }

    return inAmountBn;
  } // Thanks to SigOperations, if those are accurately used, then we can
  // accurately estimate what the size of the transaction is going to be once
  // all the signatures and public keys are inserted.


  estimateSize() {
    // largest possible sig size. final 1 is for pushdata at start. second to
    // final is sighash byte. the rest are DER encoding.
    const sigSize = 1 + 1 + 1 + 1 + 32 + 1 + 1 + 32 + 1 + 1; // length of script, y odd, x value - assumes compressed public key

    const pubKeySize = 1 + 1 + 33;
    let size = this.tx.toBuffer().length;
    this.tx.txIns.forEach(txIn => {
      const {
        txHashBuf,
        txOutNum
      } = txIn;
      const sigOperations = this.sigOperations.get(txHashBuf, txOutNum);
      sigOperations.forEach(obj => {
        const {
          nScriptChunk,
          type
        } = obj;
        const script = new Script([txIn.script.chunks[nScriptChunk]]);
        const scriptSize = script.toBuffer().length;
        size -= scriptSize;

        if (type === 'sig') {
          size += sigSize;
        } else if (obj.type === 'pubKey') {
          size += pubKeySize;
        } else {
          throw new Error('unsupported sig operations type');
        }
      });
    }); // size = size + sigSize * this.tx.txIns.length

    size = size + 1; // assume txInsVi increases by 1 byte

    return Math.round(size);
  }

  estimateFee(extraFeeAmount = new Bn(0)) {
    // old style rounding up per kb - pays too high fees:
    // const fee = Math.ceil(this.estimateSize() / 1000) * this.feePerKbNum
    // new style pays lower fees - rounds up to satoshi, not per kb:
    const fee = Math.ceil(this.estimateSize() / 1000 * this.feePerKbNum);
    return new Bn(fee).add(extraFeeAmount);
  }
  /**
     * Builds the transaction and adds the appropriate fee by subtracting from
     * the change output. Note that by default the TxBuilder will use as many
     * inputs as necessary to pay the output amounts and the required fee. The
     * TxBuilder will not necessarily us all the inputs. To force the TxBuilder
     * to use all the inputs (such as if you wish to spend the entire balance
     * of a wallet), set the argument useAllInputs = true.
     */


  build(opts = {
    useAllInputs: false
  }) {
    let minFeeAmountBn;

    if (this.txIns.length <= 0) {
      throw Error('tx-builder number of inputs must be greater than 0');
    }

    if (!this.changeScript) {
      throw new Error('must specify change script to use build method');
    }

    for (let extraInputsNum = opts.useAllInputs ? this.txIns.length - 1 : 0; extraInputsNum < this.txIns.length; extraInputsNum++) {
      this.tx = new Tx();
      const outAmountBn = this.buildOutputs();
      const changeTxOut = TxOut.fromProperties(new Bn(0), this.changeScript);
      this.tx.addTxOut(changeTxOut);
      let inAmountBn;

      try {
        inAmountBn = this.buildInputs(outAmountBn, extraInputsNum);
      } catch (err) {
        if (err.message.includes('not enough funds for outputs')) {
          throw new Error('unable to gather enough inputs for outputs and fee');
        } else {
          throw err;
        }
      } // Set change amount from inAmountBn - outAmountBn


      this.changeAmountBn = inAmountBn.sub(outAmountBn);
      changeTxOut.valueBn = this.changeAmountBn;
      minFeeAmountBn = this.estimateFee();

      if (this.changeAmountBn.geq(minFeeAmountBn) && this.changeAmountBn.sub(minFeeAmountBn).gt(this.dust)) {
        break;
      }
    }

    if (this.changeAmountBn.geq(minFeeAmountBn)) {
      // Subtract fee from change
      this.feeAmountBn = minFeeAmountBn;
      this.changeAmountBn = this.changeAmountBn.sub(this.feeAmountBn);
      this.tx.txOuts[this.tx.txOuts.length - 1].valueBn = this.changeAmountBn;

      if (this.changeAmountBn.lt(this.dust)) {
        if (this.dustChangeToFees) {
          // Remove the change amount since it is less than dust and the
          // builder has requested dust be sent to fees.
          this.tx.txOuts.pop();
          this.tx.txOutsVi = VarInt.fromNumber(this.tx.txOutsVi.toNumber() - 1);
          this.feeAmountBn = this.feeAmountBn.add(this.changeAmountBn);
          this.changeAmountBn = new Bn(0);
        } else {
          throw new Error('unable to create change amount greater than dust');
        }
      }

      this.tx.nLockTime = this.nLockTime;
      this.tx.versionBytesNum = this.versionBytesNum;

      if (this.tx.txOuts.length === 0) {
        throw new Error('outputs length is zero - unable to create any outputs greater than dust');
      }

      return this;
    } else {
      throw new Error('unable to gather enough inputs for outputs and fee');
    }
  } // BIP 69 sorting. call after build() but before sign()


  sort() {
    this.tx.sort();
    return this;
  }
  /**
     * Check if all signatures are present in a multisig input script.
     */


  static allSigsPresent(m, script) {
    // The first element is a Famous MultiSig Bug OP_0, and last element is the
    // redeemScript. The rest are signatures.
    let present = 0;

    for (let i = 1; i < script.chunks.length - 1; i++) {
      if (script.chunks[i].buf) {
        present++;
      }
    }

    return present === m;
  }
  /**
     * Remove blank signatures in a multisig input script.
     */


  static removeBlankSigs(script) {
    // The first element is a Famous MultiSig Bug OP_0, and last element is the
    // redeemScript. The rest are signatures.
    script = new Script(script.chunks.slice()); // copy the script

    for (let i = 1; i < script.chunks.length - 1; i++) {
      if (!script.chunks[i].buf) {
        script.chunks.splice(i, 1); // remove ith element
      }
    }

    return script;
  }

  fillSig(nIn, nScriptChunk, sig) {
    const txIn = this.tx.txIns[nIn];
    txIn.script.chunks[nScriptChunk] = new Script().writeBuffer(sig.toTxFormat()).chunks[0];
    txIn.scriptVi = VarInt.fromNumber(txIn.script.toBuffer().length);
    return this;
  }
  /**
     * Sign an input, but do not fill the signature into the transaction. Return
     * the signature.
     *
     * For a normal transaction, subScript is usually the scriptPubKey. If
     * you're not normal because you're using OP_CODESEPARATORs, you know what
     * to do.
     */


  getSig(keyPair, nHashType = Sig.SIGHASH_ALL | Sig.SIGHASH_FORKID, nIn, subScript, flags = Tx.SCRIPT_ENABLE_SIGHASH_FORKID) {
    let valueBn;

    if (nHashType & Sig.SIGHASH_FORKID && flags & Tx.SCRIPT_ENABLE_SIGHASH_FORKID) {
      const txHashBuf = this.tx.txIns[nIn].txHashBuf;
      const txOutNum = this.tx.txIns[nIn].txOutNum;
      const txOut = this.uTxOutMap.get(txHashBuf, txOutNum);

      if (!txOut) {
        throw new Error('for SIGHASH_FORKID must provide UTXOs');
      }

      valueBn = txOut.valueBn;
    }

    return this.tx.sign(keyPair, nHashType, nIn, subScript, valueBn, flags, this.hashCache);
  }
  /**
     * Asynchronously sign an input in a worker, but do not fill the signature
     * into the transaction. Return the signature.
     */


  asyncGetSig(keyPair, nHashType = Sig.SIGHASH_ALL | Sig.SIGHASH_FORKID, nIn, subScript, flags = Tx.SCRIPT_ENABLE_SIGHASH_FORKID) {
    let valueBn;

    if (nHashType & Sig.SIGHASH_FORKID && flags & Tx.SCRIPT_ENABLE_SIGHASH_FORKID) {
      const txHashBuf = this.tx.txIns[nIn].txHashBuf;
      const txOutNum = this.tx.txIns[nIn].txOutNum;
      const txOut = this.uTxOutMap.get(txHashBuf, txOutNum);

      if (!txOut) {
        throw new Error('for SIGHASH_FORKID must provide UTXOs');
      }

      valueBn = txOut.valueBn;
    }

    return this.tx.asyncSign(keyPair, nHashType, nIn, subScript, valueBn, flags, this.hashCache);
  }
  /**
     * Sign ith input with keyPair and insert the signature into the transaction.
     * This method only works for some standard transaction types. For
     * non-standard transaction types, use getSig.
     */


  signTxIn(nIn, keyPair, txOut, nScriptChunk, nHashType = Sig.SIGHASH_ALL | Sig.SIGHASH_FORKID, flags = Tx.SCRIPT_ENABLE_SIGHASH_FORKID) {
    const txIn = this.tx.txIns[nIn];
    const script = txIn.script;

    if (nScriptChunk === undefined && script.isPubKeyHashIn()) {
      nScriptChunk = 0;
    }

    if (nScriptChunk === undefined) {
      throw new Error('cannot sign unknown script type for input ' + nIn);
    }

    const txHashBuf = txIn.txHashBuf;
    const txOutNum = txIn.txOutNum;

    if (!txOut) {
      txOut = this.uTxOutMap.get(txHashBuf, txOutNum);
    }

    const outScript = txOut.script;
    const subScript = outScript; // true for standard script types

    const sig = this.getSig(keyPair, nHashType, nIn, subScript, flags, this.hashCache);
    this.fillSig(nIn, nScriptChunk, sig);
    return this;
  }
  /**
     * Asynchronously sign ith input with keyPair in a worker and insert the
     * signature into the transaction.  This method only works for some standard
     * transaction types. For non-standard transaction types, use asyncGetSig.
     */


  async asyncSignTxIn(nIn, keyPair, txOut, nScriptChunk, nHashType = Sig.SIGHASH_ALL | Sig.SIGHASH_FORKID, flags = Tx.SCRIPT_ENABLE_SIGHASH_FORKID) {
    const txIn = this.tx.txIns[nIn];
    const script = txIn.script;

    if (nScriptChunk === undefined && script.isPubKeyHashIn()) {
      nScriptChunk = 0;
    }

    if (nScriptChunk === undefined) {
      throw new Error('cannot sign unknown script type for input ' + nIn);
    }

    const txHashBuf = txIn.txHashBuf;
    const txOutNum = txIn.txOutNum;

    if (!txOut) {
      txOut = this.uTxOutMap.get(txHashBuf, txOutNum);
    }

    const outScript = txOut.script;
    const subScript = outScript; // true for standard script types

    const sig = await this.asyncGetSig(keyPair, nHashType, nIn, subScript, flags, this.hashCache);
    this.fillSig(nIn, nScriptChunk, sig);
    return this;
  }

  signWithKeyPairs(keyPairs) {
    // produce map of addresses to private keys
    const addressStrMap = {};

    for (const keyPair of keyPairs) {
      const addressStr = Address.fromPubKey(keyPair.pubKey).toString();
      addressStrMap[addressStr] = keyPair;
    } // loop through all inputs


    for (const nIn in this.tx.txIns) {
      const txIn = this.tx.txIns[nIn]; // for each input, use sigOperations to get list of signatures and pubkeys
      // to be produced and inserted

      const arr = this.sigOperations.get(txIn.txHashBuf, txIn.txOutNum);

      for (const obj of arr) {
        // for each pubkey, get the privkey from the privkey map and sign the input
        const {
          nScriptChunk,
          type,
          addressStr,
          nHashType
        } = obj;
        const keyPair = addressStrMap[addressStr];

        if (!keyPair) {
          obj.log = `cannot find keyPair for addressStr ${addressStr}`;
          continue;
        }

        const txOut = this.uTxOutMap.get(txIn.txHashBuf, txIn.txOutNum);

        if (type === 'sig') {
          this.signTxIn(nIn, keyPair, txOut, nScriptChunk, nHashType);
          obj.log = 'successfully inserted signature';
        } else if (type === 'pubKey') {
          txIn.script.chunks[nScriptChunk] = new Script().writeBuffer(keyPair.pubKey.toBuffer()).chunks[0];
          txIn.setScript(txIn.script);
          obj.log = 'successfully inserted public key';
        } else {
          obj.log = `cannot perform operation of type ${type}`;
          continue;
        }
      }
    }

    return this;
  }

}

/**
 * Transaction Verifier
 * ====================
 */

class TxVerifier extends Struct {
  constructor(tx, txOutMap, errStr, interp) {
    super({
      tx,
      txOutMap,
      errStr,
      interp
    });
  }
  /**
     * Verifies that the transaction is valid both by performing basic checks, such
     * as ensuring that no two inputs are the same, as well as by verifying every
     * script. The two checks are checkStr, which is analagous to bitcoind's
     * CheckTransaction, and verifyStr, which runs the script interpreter.
     *
     * This does NOT check that any possible claimed fees are accurate; checking
     * that the fees are accurate requires checking that the input transactions are
     * valid, which is not performed by this test. That check is done with the
     * normal verify function.
     */


  verify(flags = Interp.SCRIPT_ENABLE_SIGHASH_FORKID) {
    return !this.checkStr() && !this.verifyStr(flags);
  }
  /*
     * Returns true if the transaction was verified successfully (that is no
     * error was found), and false otherwise. In case an error was found the
     * error message can be accessed by calling this.getDebugString().
     */


  async asyncVerify(flags) {
    const verifyStr = await this.asyncVerifyStr(flags);
    return !this.checkStr() && !verifyStr;
  }
  /**
     * Convenience method to verify a transaction.
     */


  static verify(tx, txOutMap, flags) {
    return new TxVerifier(tx, txOutMap).verify(flags);
  }

  static asyncVerify(tx, txOutMap, flags) {
    return new TxVerifier(tx, txOutMap).asyncVerify(flags);
  }
  /**
     * Check that a transaction passes basic sanity tests. If not, return a string
     * describing the error. This function contains the same logic as
     * CheckTransaction in bitcoin core.
     */


  checkStr() {
    // Basic checks that don't depend on any context
    if (this.tx.txIns.length === 0 || this.tx.txInsVi.toNumber() === 0) {
      this.errStr = 'transaction txIns empty';
      return this.errStr;
    }

    if (this.tx.txOuts.length === 0 || this.tx.txOutsVi.toNumber() === 0) {
      this.errStr = 'transaction txOuts empty';
      return this.errStr;
    } // Size limits


    if (this.tx.toBuffer().length > Block.MAX_BLOCK_SIZE) {
      this.errStr = 'transaction over the maximum block size';
      return this.errStr;
    } // Check for negative or overflow output values


    let valueoutbn = new Bn(0);

    for (let i = 0; i < this.tx.txOuts.length; i++) {
      const txOut = this.tx.txOuts[i];

      if (txOut.valueBn.lt(0)) {
        this.errStr = 'transaction txOut ' + i + ' negative';
        return this.errStr;
      }

      if (txOut.valueBn.gt(Tx.MAX_MONEY)) {
        this.errStr = 'transaction txOut ' + i + ' greater than MAX_MONEY';
        return this.errStr;
      }

      valueoutbn = valueoutbn.add(txOut.valueBn);

      if (valueoutbn.gt(Tx.MAX_MONEY)) {
        this.errStr = 'transaction txOut ' + i + ' total output greater than MAX_MONEY';
        return this.errStr;
      }
    } // Check for duplicate inputs


    const txInmap = {};

    for (let i = 0; i < this.tx.txIns.length; i++) {
      const txIn = this.tx.txIns[i];
      const inputid = txIn.txHashBuf.toString('hex') + ':' + txIn.txOutNum;

      if (txInmap[inputid] !== undefined) {
        this.errStr = 'transaction input ' + i + ' duplicate input';
        return this.errStr;
      }

      txInmap[inputid] = true;
    }

    if (this.tx.isCoinbase()) {
      const buf = this.tx.txIns[0].script.toBuffer();

      if (buf.length < 2 || buf.length > 100) {
        this.errStr = 'coinbase trasaction script size invalid';
        return this.errStr;
      }
    } else {
      for (let i = 0; i < this.tx.txIns.length; i++) {
        if (this.tx.txIns[i].hasNullInput()) {
          this.errStr = 'transaction input ' + i + ' has null input';
          return this.errStr;
        }
      }
    }

    return false;
  }
  /**
     * verify the transaction inputs by running the script interpreter. Returns a
     * string of the script interpreter is invalid, otherwise returns false.
     */


  verifyStr(flags) {
    for (let i = 0; i < this.tx.txIns.length; i++) {
      if (!this.verifyNIn(i, flags)) {
        this.errStr = 'input ' + i + ' failed script verify';
        return this.errStr;
      }
    }

    return false;
  }

  async asyncVerifyStr(flags) {
    for (let i = 0; i < this.tx.txIns.length; i++) {
      const verifyNIn = await this.asyncVerifyNIn(i, flags);

      if (!verifyNIn) {
        this.errStr = 'input ' + i + ' failed script verify';
        return this.errStr;
      }
    }

    return false;
  }
  /**
     * Verify a particular input by running the script interpreter. Returns true if
     * the input is valid, false otherwise.
     */


  verifyNIn(nIn, flags) {
    const txIn = this.tx.txIns[nIn];
    const scriptSig = txIn.script;
    const txOut = this.txOutMap.get(txIn.txHashBuf, txIn.txOutNum);

    if (!txOut) {
      console.log('output ' + txIn.txOutNum + ' not found');
      return false;
    }

    const scriptPubKey = txOut.script;
    const valueBn = txOut.valueBn;
    this.interp = new Interp();
    const verified = this.interp.verify(scriptSig, scriptPubKey, this.tx, nIn, flags, valueBn);
    return verified;
  }

  async asyncVerifyNIn(nIn, flags) {
    const txIn = this.tx.txIns[nIn];
    const scriptSig = txIn.script;
    const txOut = this.txOutMap.get(txIn.txHashBuf, txIn.txOutNum);

    if (!txOut) {
      console.log('output ' + txIn.txOutNum + ' not found');
      return false;
    }

    const scriptPubKey = txOut.script;
    const valueBn = txOut.valueBn;
    this.interp = new Interp();
    const workersResult = await Workers.asyncObjectMethod(this.interp, 'verify', [scriptSig, scriptPubKey, this.tx, nIn, flags, valueBn]);
    const verified = JSON.parse(workersResult.resbuf.toString());
    return verified;
  }

  getDebugObject() {
    return {
      errStr: this.errStr,
      interpFailure: this.interp ? this.interp.getDebugObject() : undefined
    };
  }

  getDebugString() {
    return JSON.stringify(this.getDebugObject(), null, 2);
  }

}

/**
 * Aes (experimental)
 * ==================
 *
 * Advanced Encryption Standard (Aes). This is a low-level tool for encrypting
 * or decrypting blocks of data. There is almost never a reason to use this -
 * don't use it unless you need to encrypt or decrypt individual blocks.
 */

class Aes {}

Aes.encrypt = function (messageBuf, keyBuf) {
  const key = Aes.buf2Words(keyBuf);
  const message = Aes.buf2Words(messageBuf);
  const a = new _Aes(key);
  const enc = a.encrypt(message);
  const encBuf = Aes.words2Buf(enc);
  return encBuf;
};

Aes.decrypt = function (encBuf, keyBuf) {
  const enc = Aes.buf2Words(encBuf);
  const key = Aes.buf2Words(keyBuf);
  const a = new _Aes(key);
  const message = a.decrypt(enc);
  const messageBuf = Aes.words2Buf(message);
  return messageBuf;
};

Aes.buf2Words = function (buf) {
  if (buf.length % 4) {
    throw new Error('buf length must be a multiple of 4');
  }

  const words = [];

  for (let i = 0; i < buf.length / 4; i++) {
    words.push(buf.readUInt32BE(i * 4));
  }

  return words;
};

Aes.words2Buf = function (words) {
  const buf = Buffer.alloc(words.length * 4);

  for (let i = 0; i < words.length; i++) {
    buf.writeUInt32BE(words[i], i * 4);
  }

  return buf;
};

/**
 * Cbc
 * ===
 *
 * Cipher Block Chaining (Cbc). This is a low-level tool for chaining multiple
 * encrypted blocks together, usually with Aes. This is a low-level tool that
 * does not include authentication. You should only be using this if you have
 * authentication at another step. It is best combined with Hmac.
 *
 * http://en.wikipedia.org/wiki/Block_cipher_mode_of_operation#Cipher-block_chaining_.28Cbc.29
 */

class Cbc {}

Cbc.buf2BlocksBuf = function (buf, blockSize) {
  const bytesize = blockSize / 8;
  const blockBufs = [];

  for (let i = 0; i <= buf.length / bytesize; i++) {
    let blockBuf = buf.slice(i * bytesize, i * bytesize + bytesize);

    if (blockBuf.length < blockSize) {
      blockBuf = Cbc.pkcs7Pad(blockBuf, blockSize);
    }

    blockBufs.push(blockBuf);
  }

  return blockBufs;
};

Cbc.blockBufs2Buf = function (blockBufs) {
  let last = blockBufs[blockBufs.length - 1];
  last = Cbc.pkcs7Unpad(last);
  blockBufs[blockBufs.length - 1] = last;
  const buf = Buffer.concat(blockBufs);
  return buf;
};

Cbc.encrypt = function (messageBuf, ivBuf, blockCipher, cipherKeyBuf) {
  const blockSize = ivBuf.length * 8;
  const blockBufs = Cbc.buf2BlocksBuf(messageBuf, blockSize);
  const encBufs = Cbc.encryptBlocks(blockBufs, ivBuf, blockCipher, cipherKeyBuf);
  const encBuf = Buffer.concat(encBufs);
  return encBuf;
};

Cbc.decrypt = function (encBuf, ivBuf, blockCipher, cipherKeyBuf) {
  const bytesize = ivBuf.length;
  const encBufs = [];

  for (let i = 0; i < encBuf.length / bytesize; i++) {
    encBufs.push(encBuf.slice(i * bytesize, i * bytesize + bytesize));
  }

  const blockBufs = Cbc.decryptBlocks(encBufs, ivBuf, blockCipher, cipherKeyBuf);
  const buf = Cbc.blockBufs2Buf(blockBufs);
  return buf;
};

Cbc.encryptBlock = function (blockBuf, ivBuf, blockCipher, cipherKeyBuf) {
  const xorbuf = Cbc.xorBufs(blockBuf, ivBuf);
  const encBuf = blockCipher.encrypt(xorbuf, cipherKeyBuf);
  return encBuf;
};

Cbc.decryptBlock = function (encBuf, ivBuf, blockCipher, cipherKeyBuf) {
  const xorbuf = blockCipher.decrypt(encBuf, cipherKeyBuf);
  const blockBuf = Cbc.xorBufs(xorbuf, ivBuf);
  return blockBuf;
};

Cbc.encryptBlocks = function (blockBufs, ivBuf, blockCipher, cipherKeyBuf) {
  const encBufs = [];

  for (let i = 0; i < blockBufs.length; i++) {
    const blockBuf = blockBufs[i];
    const encBuf = Cbc.encryptBlock(blockBuf, ivBuf, blockCipher, cipherKeyBuf);
    encBufs.push(encBuf);
    ivBuf = encBuf;
  }

  return encBufs;
};

Cbc.decryptBlocks = function (encBufs, ivBuf, blockCipher, cipherKeyBuf) {
  const blockBufs = [];

  for (let i = 0; i < encBufs.length; i++) {
    const encBuf = encBufs[i];
    const blockBuf = Cbc.decryptBlock(encBuf, ivBuf, blockCipher, cipherKeyBuf);
    blockBufs.push(blockBuf);
    ivBuf = encBuf;
  }

  return blockBufs;
};

Cbc.pkcs7Pad = function (buf, blockSize) {
  const bytesize = blockSize / 8;
  const padbytesize = bytesize - buf.length;
  const pad = Buffer.alloc(padbytesize);
  pad.fill(padbytesize);
  const paddedbuf = Buffer.concat([buf, pad]);
  return paddedbuf;
};

Cbc.pkcs7Unpad = function (paddedbuf) {
  const padlength = paddedbuf[paddedbuf.length - 1];
  const padbuf = paddedbuf.slice(paddedbuf.length - padlength, paddedbuf.length);
  const padbuf2 = Buffer.alloc(padlength);
  padbuf2.fill(padlength);

  if (!cmp(padbuf, padbuf2)) {
    throw new Error('invalid padding');
  }

  return paddedbuf.slice(0, paddedbuf.length - padlength);
};

Cbc.xorBufs = function (buf1, buf2) {
  if (buf1.length !== buf2.length) {
    throw new Error('bufs must have the same length');
  }

  const buf = Buffer.alloc(buf1.length);

  for (let i = 0; i < buf1.length; i++) {
    buf[i] = buf1[i] ^ buf2[i];
  }

  return buf;
};

/**
 * Aescbc (experimental)
 * =====================
 *
 * This is a convenience class for using Aes with Cbc. This is a low-level tool
 * that does not include authentication. You should only use this if you are
 * authenticating your data somehow else.
 */

class Aescbc {}

Aescbc.encrypt = function (messageBuf, cipherKeyBuf, ivBuf, concatIvBuf = true) {
  ivBuf = ivBuf || Random.getRandomBuffer(128 / 8);
  const ctBuf = Cbc.encrypt(messageBuf, ivBuf, Aes, cipherKeyBuf);

  if (concatIvBuf) {
    return Buffer.concat([ivBuf, ctBuf]);
  } else {
    return ctBuf;
  }
};

Aescbc.decrypt = function (encBuf, cipherKeyBuf, ivBuf = false) {
  if (!ivBuf) {
    const ivBuf = encBuf.slice(0, 128 / 8);
    const ctBuf = encBuf.slice(128 / 8);
    return Cbc.decrypt(ctBuf, ivBuf, Aes, cipherKeyBuf);
  } else {
    const ctBuf = encBuf;
    return Cbc.decrypt(ctBuf, ivBuf, Aes, cipherKeyBuf);
  }
};

/**
 * Ach (Aes+Cbc+Hmac) (experimental)
 * =================================
 *
 * An "encrypt-then-MAC" that uses Aes, Cbc and SHA256 Hmac. This is suitable
 * for general encryption of data.
 *
 * The encrypted data takes the form:
 * (256 bit hmac)(128 bit iv)(128+ bits Aes+Cbc encrypted message)
 */

class Ach {}

Ach.encrypt = function (messageBuf, cipherKeyBuf, ivBuf) {
  const encBuf = Aescbc.encrypt(messageBuf, cipherKeyBuf, ivBuf);
  const hmacbuf = Hash.sha256Hmac(encBuf, cipherKeyBuf);
  return Buffer.concat([hmacbuf, encBuf]);
};

Ach.asyncEncrypt = async function (messageBuf, cipherKeyBuf, ivBuf) {
  if (!ivBuf) {
    ivBuf = Random.getRandomBuffer(128 / 8);
  }

  const args = [messageBuf, cipherKeyBuf, ivBuf];
  const workersResult = await Workers.asyncClassMethod(Ach, 'encrypt', args);
  return workersResult.resbuf;
};

Ach.decrypt = function (encBuf, cipherKeyBuf) {
  if (encBuf.length < (256 + 128 + 128) / 8) {
    throw new Error('The encrypted data must be at least 256+128+128 bits, which is the length of the Hmac plus the iv plus the smallest encrypted data size');
  }

  const hmacbuf = encBuf.slice(0, 256 / 8);
  encBuf = encBuf.slice(256 / 8, encBuf.length);
  const hmacbuf2 = Hash.sha256Hmac(encBuf, cipherKeyBuf);

  if (!cmp(hmacbuf, hmacbuf2)) {
    throw new Error('Message authentication failed - Hmacs are not equivalent');
  }

  return Aescbc.decrypt(encBuf, cipherKeyBuf);
};

Ach.asyncDecrypt = async function (encBuf, cipherKeyBuf) {
  const args = [encBuf, cipherKeyBuf];
  const workersResult = await Workers.asyncClassMethod(Ach, 'decrypt', args);
  return workersResult.resbuf;
};

/**
 * Ecies
 * =====
 */

class Ecies {}

Ecies.ivkEkM = function (privKey, pubKey) {
  const r = privKey.bn;
  const KB = pubKey.point;
  const P = KB.mul(r);
  const S = new PubKey(P);
  const Sbuf = S.toBuffer();
  const hash = Hash.sha512(Sbuf);
  return {
    iv: hash.slice(0, 16),
    kE: hash.slice(16, 32),
    kM: hash.slice(32, 64)
  };
};

Ecies.electrumEncrypt = function (messageBuf, toPubKey, fromKeyPair, noKey = false) {
  if (!Buffer.isBuffer(messageBuf)) {
    throw new Error('messageBuf must be a buffer');
  }

  let Rbuf;

  if (fromKeyPair === null) {
    fromKeyPair = KeyPair.fromRandom();
  }

  if (!noKey) {
    Rbuf = fromKeyPair.pubKey.toDer(true);
  }

  const {
    iv,
    kE,
    kM
  } = Ecies.ivkEkM(fromKeyPair.privKey, toPubKey);
  const ciphertext = Aescbc.encrypt(messageBuf, kE, iv, false);
  const BIE1 = Buffer.from('BIE1');
  let encBuf;

  if (Rbuf) {
    encBuf = Buffer.concat([BIE1, Rbuf, ciphertext]);
  } else {
    encBuf = Buffer.concat([BIE1, ciphertext]);
  }

  const hmac = Hash.sha256Hmac(encBuf, kM);
  return Buffer.concat([encBuf, hmac]);
};

Ecies.electrumDecrypt = function (encBuf, toPrivKey, fromPubKey = null) {
  if (!Buffer.isBuffer(encBuf)) {
    throw new Error('encBuf must be a buffer');
  }

  const tagLength = 32;
  const magic = encBuf.slice(0, 4);

  if (!magic.equals(Buffer.from('BIE1'))) {
    throw new Error('Invalid Magic');
  }

  let offset = 4;

  if (fromPubKey === null) {
    // BIE1 use compressed public key, length is always 33.
    const pub = encBuf.slice(4, 37);
    fromPubKey = PubKey.fromDer(pub);
    offset = 37;
  }

  const {
    iv,
    kE,
    kM
  } = Ecies.ivkEkM(toPrivKey, fromPubKey);
  const ciphertext = encBuf.slice(offset, encBuf.length - tagLength);
  const hmac = encBuf.slice(encBuf.length - tagLength, encBuf.length);
  const hmac2 = Hash.sha256Hmac(encBuf.slice(0, encBuf.length - tagLength), kM);

  if (!hmac.equals(hmac2)) {
    throw new Error('Invalid checksum');
  }

  return Aescbc.decrypt(ciphertext, kE, iv);
};

Ecies.bitcoreEncrypt = function (messageBuf, toPubKey, fromKeyPair, ivBuf) {
  if (!fromKeyPair) {
    fromKeyPair = KeyPair.fromRandom();
  }

  const r = fromKeyPair.privKey.bn;
  const RPubKey = fromKeyPair.pubKey;
  const RBuf = RPubKey.toDer(true);
  const KB = toPubKey.point;
  const P = KB.mul(r);
  const S = P.getX();
  const Sbuf = S.toBuffer({
    size: 32
  });
  const kEkM = Hash.sha512(Sbuf);
  const kE = kEkM.slice(0, 32);
  const kM = kEkM.slice(32, 64);
  const c = Aescbc.encrypt(messageBuf, kE, ivBuf);
  const d = Hash.sha256Hmac(c, kM);
  const encBuf = Buffer.concat([RBuf, c, d]);
  return encBuf;
};

Ecies.asyncBitcoreEncrypt = async function (messageBuf, toPubKey, fromKeyPair, ivBuf) {
  if (!fromKeyPair) {
    fromKeyPair = await KeyPair.asyncFromRandom();
  }

  if (!ivBuf) {
    ivBuf = Random.getRandomBuffer(128 / 8);
  }

  const args = [messageBuf, toPubKey, fromKeyPair, ivBuf];
  const workersResult = await Workers.asyncClassMethod(Ecies, 'bitcoreEncrypt', args);
  return workersResult.resbuf;
};

Ecies.bitcoreDecrypt = function (encBuf, toPrivKey) {
  const kB = toPrivKey.bn;
  const fromPubKey = PubKey.fromDer(encBuf.slice(0, 33));
  const R = fromPubKey.point;
  const P = R.mul(kB);

  if (P.eq(new Point())) {
    throw new Error('P equals 0');
  }

  const S = P.getX();
  const Sbuf = S.toBuffer({
    size: 32
  });
  const kEkM = Hash.sha512(Sbuf);
  const kE = kEkM.slice(0, 32);
  const kM = kEkM.slice(32, 64);
  const c = encBuf.slice(33, encBuf.length - 32);
  const d = encBuf.slice(encBuf.length - 32, encBuf.length);
  const d2 = Hash.sha256Hmac(c, kM);

  if (!cmp(d, d2)) {
    throw new Error('Invalid checksum');
  }

  const messageBuf = Aescbc.decrypt(c, kE);
  return messageBuf;
};

Ecies.asyncBitcoreDecrypt = async function (encBuf, toPrivKey) {
  const args = [encBuf, toPrivKey];
  const workersResult = await Workers.asyncClassMethod(Ecies, 'bitcoreDecrypt', args);
  return workersResult.resbuf;
};

/**
 * bsv
 * ===
 *
 * entry.js is the entry point for a the js bundlers.
 * Webpack and microbundlers, both start use this file as
 * the entry point to bundle the entire library.
 */

const deps = {
  aes: _Aes,
  bnjs: _Bn,
  bs58,
  elliptic,
  hashjs,
  pbkdf2
};

exports.Ach = Ach;
exports.Address = Address;
exports.Aes = Aes;
exports.Aescbc = Aescbc;
exports.Base58 = Base58;
exports.Base58Check = Base58Check;
exports.Bip32 = Bip32;
exports.Bip39 = Bip39;
exports.Block = Block;
exports.BlockHeader = BlockHeader;
exports.Bn = Bn;
exports.Br = Br;
exports.Bsm = Bsm;
exports.Bw = Bw;
exports.Cbc = Cbc;
exports.Constants = Constants;
exports.Ecdsa = Ecdsa;
exports.Ecies = Ecies;
exports.Hash = Hash;
exports.Interp = Interp;
exports.KeyPair = KeyPair;
exports.OpCode = OpCode;
exports.Point = Point;
exports.PrivKey = PrivKey;
exports.PubKey = PubKey;
exports.Random = Random;
exports.Script = Script;
exports.Sig = Sig;
exports.SigOperations = SigOperations;
exports.Struct = Struct;
exports.Tx = Tx;
exports.TxBuilder = TxBuilder;
exports.TxIn = TxIn;
exports.TxOut = TxOut;
exports.TxOutMap = TxOutMap;
exports.TxVerifier = TxVerifier;
exports.VarInt = VarInt;
exports.Workers = Workers;
exports.WorkersResult = WorkersResult;
exports.cmp = cmp;
exports.deps = deps;
exports.en = wordList;
exports.getConstants = getConstants;
exports.jp = wordList$1;
exports.version = version;
//# sourceMappingURL=bsv.js.map
