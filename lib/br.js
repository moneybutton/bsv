/**
 * Buffer Reader
 * =============
 *
 * This is a convenience class for reading Varints and other basic types from a
 * buffer. This class is most useful for reading Varints, and also for signed
 * or unsigned integers of various types. It can also read a buffer in reverse
 * order, which is useful in bitcoin which uses little endian numbers a lot so
 * you find that you must reverse things. You probably want to use it like:
 * varint = BR(buf).readVarint()
 */
"use strict";
let dependencies = {
  BN: require('./bn')
};

function inject(deps) {
  let BN = deps.BN;

  function BR(buf) {
    if (!(this instanceof BR))
      return new BR(buf);
    if (Buffer.isBuffer(buf)) {
      this.fromObject({buf: buf});
    }
    else if (buf) {
      let obj = buf;
      this.fromObject(obj);
    }
  };

  BR.prototype.fromObject = function(obj) {
    this.buf = obj.buf || this.buf || undefined;
    this.pos = obj.pos || this.pos || 0;
    return this;
  };

  BR.prototype.eof = function() {
    return this.pos >= this.buf.length;
  };

  BR.prototype.read = function(len) {
    if (len === undefined)
      len = this.buf.length;
    let buf = this.buf.slice(this.pos, this.pos + len);
    this.pos = this.pos + len;
    return buf;
  };

  BR.prototype.readReverse = function(len) {
    if (len === undefined)
      len = this.buf.length;
    let buf = this.buf.slice(this.pos, this.pos + len);
    this.pos = this.pos + len;
    let buf2 = new Buffer(buf.length);
    for (let i = 0; i < buf2.length; i++)
      buf2[i] = buf[buf.length - 1 - i];
    return buf2;
  };

  BR.prototype.readUInt8 = function() {
    let val = this.buf.readUInt8(this.pos);
    this.pos = this.pos + 1;
    return val;
  };

  BR.prototype.readInt8 = function() {
    let val = this.buf.readInt8(this.pos);
    this.pos = this.pos + 1;
    return val;
  };

  BR.prototype.readUInt16BE = function() {
    let val = this.buf.readUInt16BE(this.pos);
    this.pos = this.pos + 2;
    return val;
  };

  BR.prototype.readInt16BE = function() {
    let val = this.buf.readInt16BE(this.pos);
    this.pos = this.pos + 2;
    return val;
  };

  BR.prototype.readUInt16LE = function() {
    let val = this.buf.readUInt16LE(this.pos);
    this.pos = this.pos + 2;
    return val;
  };

  BR.prototype.readInt16LE = function() {
    let val = this.buf.readInt16LE(this.pos);
    this.pos = this.pos + 2;
    return val;
  };

  BR.prototype.readUInt32BE = function() {
    let val = this.buf.readUInt32BE(this.pos);
    this.pos = this.pos + 4;
    return val;
  };

  BR.prototype.readInt32BE = function() {
    let val = this.buf.readInt32BE(this.pos);
    this.pos = this.pos + 4;
    return val;
  };

  BR.prototype.readUInt32LE = function() {
    let val = this.buf.readUInt32LE(this.pos);
    this.pos = this.pos + 4;
    return val;
  };

  BR.prototype.readInt32LE = function() {
    let val = this.buf.readInt32LE(this.pos);
    this.pos = this.pos + 4;
    return val;
  };

  BR.prototype.readUInt64BEBN = function() {
    let buf = this.buf.slice(this.pos, this.pos + 8);
    let bn = BN().fromBuffer(buf);
    this.pos = this.pos + 8;
    return bn;
  };

  BR.prototype.readUInt64LEBN = function() {
    let buf = this.readReverse(8);
    let bn = BN().fromBuffer(buf);
    return bn;
  };

  BR.prototype.readVarintNum = function() {
    let first = this.readUInt8();
    let bn, n;
    switch (first) {
      case 0xFD:
        return this.readUInt16LE();
      case 0xFE:
        return this.readUInt32LE();
      case 0xFF:
        bn = this.readUInt64LEBN();
        n = bn.toNumber();
        if (n <= Math.pow(2, 53))
          return n;
        else
          throw new Error('number too large to retain precision - use readVarintBN');
      default:
        return first;
    }
  };

  BR.prototype.readVarintBuf = function() {
    let first = this.buf.readUInt8(this.pos);
    switch (first) {
      case 0xFD:
        return this.read(1 + 2);
      case 0xFE:
        return this.read(1 + 4);
      case 0xFF:
        return this.read(1 + 8);
      default:
        return this.read(1);
    }
  };

  BR.prototype.readVarintBN = function() {
    let first = this.readUInt8();
    switch (first) {
      case 0xFD:
        return BN(this.readUInt16LE());
      case 0xFE:
        return BN(this.readUInt32LE());
      case 0xFF:
        return this.readUInt64LEBN();
      default:
        return BN(first);
    }
  };

  return BR;
}

inject = require('./injector')(inject, dependencies);
let BR = inject();
module.exports = BR;
