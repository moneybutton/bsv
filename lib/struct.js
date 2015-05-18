/**
 * Binary Data Structure
 * =====================
 *
 * Bitcoin has quite a few data structures where it is convenient to be able to
 * parse them to or from buffers, strings, hex strings, or JSON objects. Struct
 * provides a basic framework that these data structures can derive from. That
 * is, it provides default methods for:
 * - fromObject
 * - fromBR
 * - toBW
 * - fromBuffer
 * - toBuffer
 * - fromHex
 * - toHex
 * - fromString
 * - toString
 */
"use strict";

let BR = require('./br');
let BW = require('./bw');

let Struct = function Struct() {
  if (!(this instanceof Struct))
    return new Struct();
};

Struct.prototype.fromObject = function(obj) {
  for (let key of Object.keys(obj)) {
    this[key] = obj[key];
  }
  return this;
};

Struct.prototype.fromBR = function(br/*, ...rest*/) {
  if (!(br instanceof BR))
    throw new Error('br must be a buffer reader');
  throw new Error('not implemented');
};

Struct.prototype.toBW = function(bw/*...rest*/) {
  throw new Error('not implemented');
};

Struct.prototype.fromBuffer = function(buf/*, ...rest*/) {
  if (!Buffer.isBuffer(buf))
    throw new Error('buf must be a buffer');
  let rest = Array.prototype.slice.call(arguments, 1);
  let br = BR(buf);
  let args = [br].concat(rest);
  return this.fromBR.apply(this, args);
};

Struct.prototype.toBuffer = function(/*...rest*/) {
  return this.toBW.apply(this, arguments).concat();
};

Struct.prototype.fromHex = function(hex/*, ...rest*/) {
  let rest = Array.prototype.slice.call(arguments, 1);
  let buf;
  try {
    buf = new Buffer(hex, 'hex');
  } catch (e) {
    throw new Error('invalid hex string');
  }
  let args = [buf].concat(rest);
  return this.fromBuffer.apply(this, args);
};

Struct.prototype.toHex = function(/*...rest*/) {
  return this.toBuffer.apply(this, arguments).toString('hex');
};

Struct.prototype.fromString = function(str/*, ...rest*/) {
  if (typeof str !== 'string')
    throw new Error('str must be a string');
  return this.fromHex.apply(this, arguments);
};

Struct.prototype.toString = function(/*...rest*/) {
  return this.toHex.apply(this, arguments);
};

Struct.prototype.fromJSON = function(json/*, ...rest*/) {
  throw new Error('not implemented');
};

Struct.prototype.toJSON = function(/*...rest*/) {
  throw new Error('not implemented');
};

module.exports = Struct;
