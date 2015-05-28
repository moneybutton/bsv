/**
 * Varint (a.k.a. Compact Size)
 * ============================
 *
 * A varint is a varible sized integer, and it is a format that is unique to
 * bitcoin, and used throughout bitcoin to represent the length of binary data
 * in a compact format that can take up as little as 1 byte or as much as 9
 * bytes.
 */
"use strict";
let BR = require('./br');
let BW = require('./bw');
let BN = require('./bn');
let Struct = require('./struct');

let Varint = function Varint(buf) {
  if (!(this instanceof Varint))
    return new Varint(buf);
  if (Buffer.isBuffer(buf)) {
    this.buf = buf;
  } else if (typeof buf === 'number') {
    let num = buf;
    this.fromNumber(num);
  } else if (buf instanceof BN) {
    let bn = buf;
    this.fromBN(bn);
  } else if (buf) {
    let obj = buf;
    this.fromObject(obj);
  }
};

Varint.prototype = Object.create(Struct.prototype);
Varint.prototype.constructor = Varint;

Varint.prototype.fromJSON = function(json) {
  this.fromObject({
    buf: new Buffer(json, 'hex')
  });
  return this;
};

Varint.prototype.toJSON = function() {
  return this.buf.toString('hex');
};

Varint.prototype.fromBuffer = function(buf) {
  this.buf = buf;
  return this;
};

Varint.prototype.fromBR = function(br) {
  this.buf = br.readVarintBuf();
  return this;
};

Varint.prototype.fromBN = function(bn) {
  this.buf = BW().writeVarintBN(bn).toBuffer();
  return this;
};

Varint.prototype.fromNumber = function(num) {
  this.buf = BW().writeVarintNum(num).toBuffer();
  return this;
};

Varint.prototype.toBuffer = function() {
  return this.buf;
};

Varint.prototype.toBN = function() {
  return BR(this.buf).readVarintBN();
};

Varint.prototype.toNumber = function() {
  return BR(this.buf).readVarintNum();
};

module.exports = Varint;
