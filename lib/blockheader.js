/**
 * Block Header
 * ============
 *
 * Every block contains a blockheader. This is probably not something you will
 * personally use, but it's here if you need it.
 */
"use strict";
let BR = require('./br');
let BW = require('./bw');
let Struct = require('./struct');

let Blockheader = function Blockheader(version, prevblockidbuf, merklerootbuf, time, bits, nonce) {
  if (!(this instanceof Blockheader))
    return new Blockheader(version, prevblockidbuf, merklerootbuf, time, bits, nonce);
  if (typeof version === 'number') {
    this.fromObject({
      version: version,
      prevblockidbuf: prevblockidbuf,
      merklerootbuf: merklerootbuf,
      time: time,
      bits: bits,
      nonce: nonce
    });
  } else if (Buffer.isBuffer(version)) {
    let bhbuf = version;
    this.fromBuffer(bhbuf);
  } else if (version) {
    let obj = version;
    this.fromObject(obj);
  }
}

Blockheader.prototype = Object.create(Struct.prototype);

Blockheader.prototype.fromJSON = function(json) {
  this.fromObject({
    version: json.version,
    prevblockidbuf: new Buffer(json.prevblockidbuf, 'hex'),
    merklerootbuf: new Buffer(json.merklerootbuf, 'hex'),
    time: json.time,
    bits: json.bits,
    nonce: json.nonce
  });
  return this;
};

Blockheader.prototype.toJSON = function() {
  return {
    version: this.version,
    prevblockidbuf: this.prevblockidbuf.toString('hex'),
    merklerootbuf: this.merklerootbuf.toString('hex'),
    time: this.time,
    bits: this.bits,
    nonce: this.nonce
  };
};

Blockheader.prototype.fromBR = function(br) {
  this.version = br.readUInt32LE();
  this.prevblockidbuf = br.read(32);
  this.merklerootbuf = br.read(32);
  this.time = br.readUInt32LE();
  this.bits = br.readUInt32LE();
  this.nonce = br.readUInt32LE();
  return this;
};

Blockheader.prototype.toBW = function(bw) {
  if (!bw)
    bw = new BW();
  bw.writeUInt32LE(this.version);
  bw.write(this.prevblockidbuf);
  bw.write(this.merklerootbuf);
  bw.writeUInt32LE(this.time);
  bw.writeUInt32LE(this.bits);
  bw.writeUInt32LE(this.nonce);
  return bw;
};

module.exports = Blockheader;
