/**
 * Public Key
 * ==========
 *
 * A public key corresponds to a private key. If you have a private key, you
 * can find the corresponding public key with Pubkey().fromPrivkey(privkey).
 */
"use strict";
let Point = require('./point');
let bn = require('./bn');
let privkey = require('./privkey');
let Struct = require('./struct');

let Pubkey = function Pubkey(point) {
  if (!(this instanceof Pubkey))
    return new Pubkey(point);
  if (point instanceof Point)
    this.point = point;
  else if (point) {
    let obj = point;
    this.set(obj);
  }
};

Pubkey.prototype = Object.create(Struct.prototype);

Pubkey.prototype.set = function(obj) {
  if (obj.point && !obj.point.getX() && !obj.point.getY())
    throw new Error('Invalid point');
  this.point = obj.point || this.point;
  this.compressed = typeof obj.compressed !== 'undefined' ? obj.compressed : this.compressed;
  return this;
};

Pubkey.prototype.fromJSON = function(json) {
  this.fromBuffer(new Buffer(json, 'hex'));
  return this;
};

Pubkey.prototype.toJSON = function() {
  return this.toBuffer().toString('hex');
};

Pubkey.prototype.fromPrivkey = function(privkey) {
  this.set({
    point: Point.getG().mul(privkey.bn),
    compressed: privkey.compressed}
  );
  return this;
};

Pubkey.prototype.fromBuffer = function(buf, strict) {
  return this.fromDER(buf, strict);
};

/**
 * In order to mimic the non-strict style of OpenSSL, set strict = false. For
 * information and what prefixes 0x06 and 0x07 mean, in addition to the normal
 * compressed and uncompressed public keys, see the message by Peter Wuille
 * where he discovered these "hybrid pubkeys" on the mailing list:
 * http://sourceforge.net/p/bitcoin/mailman/message/29416133/
 */
Pubkey.prototype.fromDER = function(buf, strict) {
  if (typeof strict === 'undefined')
    strict = true;
  else
    strict = false;
  if (buf[0] === 0x04 || (!strict && (buf[0] === 0x06 || buf[0] === 0x07))) {
    let xbuf = buf.slice(1, 33);
    let ybuf = buf.slice(33, 65);
    if (xbuf.length !== 32 || ybuf.length !== 32 || buf.length !== 65)
      throw new Error('Length of x and y must be 32 bytes');
    let x = bn(xbuf);
    let y = bn(ybuf);
    this.point = Point(x, y);
    this.compressed = false;
  } else if (buf[0] === 0x03) {
    let xbuf = buf.slice(1);
    let x = bn(xbuf);
    this.fromX(true, x);
    this.compressed = true;
  } else if (buf[0] === 0x02) {
    let xbuf = buf.slice(1);
    let x = bn(xbuf);
    this.fromX(false, x);
    this.compressed = true;
  } else {
    throw new Error('Invalid DER format pubkey');
  }
  return this;
};

Pubkey.prototype.fromString = function(str) {
  this.fromDER(new Buffer(str, 'hex'));
};

Pubkey.prototype.fromX = function(odd, x) {
  if (typeof odd !== 'boolean')
    throw new Error('Must specify whether y is odd or not (true or false)');
  this.point = Point.fromX(odd, x);
};

Pubkey.prototype.toBuffer = function() {
  let compressed = typeof this.compressed === 'undefined' ? true : this.compressed;
  return this.toDER(compressed);
};

Pubkey.prototype.toDER = function(compressed) {
  compressed = typeof this.compressed === 'undefined' ? compressed : this.compressed;
  if (typeof compressed !== 'boolean')
    throw new Error('Must specify whether the public key is compressed or not (true or false)');

  let x = this.point.getX();
  let y = this.point.getY();

  let xbuf = x.toBuffer({size: 32});
  let ybuf = y.toBuffer({size: 32});

  let prefix = undefined;
  if (!compressed) {
    prefix = new Buffer([0x04]);
    return Buffer.concat([prefix, xbuf, ybuf]);
  } else {
    let odd = ybuf[ybuf.length - 1] % 2;
    if (odd)
      prefix = new Buffer([0x03]);
    else
      prefix = new Buffer([0x02]);
    return Buffer.concat([prefix, xbuf]);
  }
};

Pubkey.prototype.toString = function() {
  let compressed = typeof this.compressed === 'undefined' ? true : this.compressed;
  return this.toDER(compressed).toString('hex');
};

/**
 * Translated from bitcoind's IsCompressedOrUncompressedPubKey
 */
Pubkey.isCompressedOrUncompressed = function(buf) {
  if (buf.length < 33) {
    //  Non-canonical public key: too short
    return false;
  }
  if (buf[0] === 0x04) {
    if (buf.length !== 65)
      //  Non-canonical public key: invalid length for uncompressed key
      return false;
  } else if (buf[0] === 0x02 || buf[0] === 0x03) {
    if (buf.length !== 33)
      //  Non-canonical public key: invalid length for compressed key
      return false;
  } else {
      //  Non-canonical public key: neither compressed nor uncompressed
      return false;
  }
  return true;
}

//https://www.iacr.org/archive/pkc2003/25670211/25670211.pdf
Pubkey.prototype.validate = function() {
  if (this.point.isInfinity())
    throw new Error('point: Point cannot be equal to Infinity');
  if (this.point.eq(Point(bn(0), bn(0))))
    throw new Error('point: Point cannot be equal to 0, 0');
  this.point.validate();
  return this;
};

module.exports = Pubkey;
