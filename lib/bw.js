/**
 * Buffer Writer
 * =============
 *
 * This is the writing complement of the BR. You can easily write
 * Varints and other basic number types. The way to use it is: buf =
 * BW().write(buf1).write(buf2).concat()
 */
"use strict";
var BN = require('./bn');

var BW = function BW(obj) {
  if (!(this instanceof BW))
    return new BW(obj);
  if (obj)
    this.set(obj);
  else
    this.bufs = [];
};

BW.prototype.set = function(obj) {
  this.bufs = obj.bufs || this.bufs || [];
  return this;
};

BW.prototype.toBuffer = function() {
  return this.concat();
};

BW.prototype.concat = function() {
  return Buffer.concat(this.bufs);
};

BW.prototype.write = function(buf) {
  this.bufs.push(buf);
  return this;
};

BW.prototype.writeReverse = function(buf) {
  var buf2 = new Buffer(buf.length);
  for (var i = 0; i < buf2.length; i++)
    buf2[i] = buf[buf.length - 1 - i];
  this.bufs.push(buf2);
  return this;
};

BW.prototype.writeUInt8 = function(n) {
  var buf = new Buffer(1);
  buf.writeUInt8(n, 0);
  this.write(buf);
  return this;
};

BW.prototype.writeInt8 = function(n) {
  var buf = new Buffer(1);
  buf.writeInt8(n, 0);
  this.write(buf);
  return this;
};

BW.prototype.writeUInt16BE = function(n) {
  var buf = new Buffer(2);
  buf.writeUInt16BE(n, 0);
  this.write(buf);
  return this;
};

BW.prototype.writeInt16BE = function(n) {
  var buf = new Buffer(2);
  buf.writeInt16BE(n, 0);
  this.write(buf);
  return this;
};

BW.prototype.writeUInt16LE = function(n) {
  var buf = new Buffer(2);
  buf.writeUInt16LE(n, 0);
  this.write(buf);
  return this;
};

BW.prototype.writeInt16LE = function(n) {
  var buf = new Buffer(2);
  buf.writeInt16LE(n, 0);
  this.write(buf);
  return this;
};

BW.prototype.writeUInt32BE = function(n) {
  var buf = new Buffer(4);
  buf.writeUInt32BE(n, 0);
  this.write(buf);
  return this;
};

BW.prototype.writeInt32BE = function(n) {
  var buf = new Buffer(4);
  buf.writeInt32BE(n, 0);
  this.write(buf);
  return this;
};

BW.prototype.writeUInt32LE = function(n) {
  var buf = new Buffer(4);
  buf.writeUInt32LE(n, 0);
  this.write(buf);
  return this;
};

BW.prototype.writeInt32LE = function(n) {
  var buf = new Buffer(4);
  buf.writeInt32LE(n, 0);
  this.write(buf);
  return this;
};

BW.prototype.writeUInt64BEBN = function(bn) {
  var buf = bn.toBuffer({size: 8});
  this.write(buf);
  return this;
};

BW.prototype.writeUInt64LEBN = function(bn) {
  var buf = bn.toBuffer({size: 8});
  this.writeReverse(buf);
  return this;
};

BW.prototype.writeVarintNum = function(n) {
  var buf = BW.varintBufNum(n);
  this.write(buf);
  return this;
};

BW.prototype.writeVarintBN = function(bn) {
  var buf = BW.varintBufBN(bn);
  this.write(buf);
  return this;
};

BW.varintBufNum = function(n) {
  var buf = undefined;
  if (n < 253) {
    buf = new Buffer(1);
    buf.writeUInt8(n, 0);
  } else if (n < 0x10000) {
    buf = new Buffer(1 + 2);
    buf.writeUInt8(253, 0);
    buf.writeUInt16LE(n, 1);
  } else if (n < 0x100000000) {
    buf = new Buffer(1 + 4);
    buf.writeUInt8(254, 0);
    buf.writeUInt32LE(n, 1);
  } else {
    buf = new Buffer(1 + 8);
    buf.writeUInt8(255, 0);
    buf.writeInt32LE(n & -1, 1);
    buf.writeUInt32LE(Math.floor(n / 0x100000000), 5);
  }
  return buf;
};

BW.varintBufBN = function(bn) {
  var buf = undefined;
  var n = bn.toNumber();
  if (n < 253) {
    buf = new Buffer(1);
    buf.writeUInt8(n, 0);
  } else if (n < 0x10000) {
    buf = new Buffer(1 + 2);
    buf.writeUInt8(253, 0);
    buf.writeUInt16LE(n, 1);
  } else if (n < 0x100000000) {
    buf = new Buffer(1 + 4);
    buf.writeUInt8(254, 0);
    buf.writeUInt32LE(n, 1);
  } else {
    var bw = new BW();
    bw.writeUInt8(255);
    bw.writeUInt64LEBN(bn);
    var buf = bw.concat();
  }
  return buf;
};

module.exports = BW;
