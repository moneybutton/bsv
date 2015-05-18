/**
 * Base58 Encoding
 * ===============
 *
 * Base58 (no check)
 */
"use strict";
let bs58 = require('bs58');

let Base58 = function Base58(obj) {
  if (!(this instanceof Base58))
    return new Base58(obj);
  if (Buffer.isBuffer(obj)) {
    let buf = obj;
    this.fromBuffer(buf);
  } else if (typeof obj === 'string') {
    let str = obj;
    this.fromString(str);
  } else if (obj) {
    this.fromObject(obj);
  }
};

Base58.prototype.fromObject = function(obj) {
  this.buf = obj.buf || this.buf || undefined;
  return this;
};

Base58.prototype.fromHex = function(hex) {
  return this.fromBuffer(new Buffer(hex, 'hex'));
};

Base58.prototype.toHex = function() {
  return this.toBuffer().toString('hex');
};

Base58.encode = function(buf) {
  if (!Buffer.isBuffer(buf))
    throw new Error('Input should be a buffer');
  return bs58.encode(buf);
};

Base58.decode = function(str) {
  if (typeof str !== 'string')
    throw new Error('Input should be a string');
  return bs58.decode(str);
};

Base58.prototype.fromBuffer = function(buf) {
  this.buf = buf;
  return this;
};

Base58.prototype.fromString = function(str) {
  let buf = Base58.decode(str);
  this.buf = buf;
  return this;
};

Base58.prototype.toBuffer = function() {
  return this.buf;
};

Base58.prototype.toString = function() {
  return Base58.encode(this.buf);
};

module.exports = Base58;
