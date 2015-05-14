/**
 * Block
 * =====
 *
 * A block, of course, is a collection of transactions. This class is somewhat
 * incomplete at the moment. In the future, it should support the ability to
 * check to see if a transaction is in a block (thanks to the magic of merkle
 * trees). You will probably never use fullnode to create a block, since almost
 * everyone will use bitcoind for that. As such, the primary way to use this is
 * Block().fromBuffer(buf), which will parse the block and prepare its insides
 * for you to inspect.
 */
"use strict";
var Tx = require('./tx');
var BR = require('./br');
var BW = require('./bw');
var Blockheader = require('./blockheader');
var Varint = require('./varint');
var Hash = require('./hash');

var Block = function Block(magicnum, blocksize, blockheader, txsvi, txs) {
  if (!(this instanceof Block))
    return new Block(magicnum, blocksize, blockheader, txsvi, txs);
  if (typeof magicnum === 'number') {
    this.set({
      magicnum: magicnum,
      blocksize: blocksize,
      blockheader: blockheader,
      txsvi: txsvi,
      txs: txs
    });
  } else if (Buffer.isBuffer(magicnum)) {
    var blockbuf = magicnum;
    this.fromBuffer(blockbuf);
  } else if (magicnum) {
    var obj = magicnum;
  }
};

Block.MAX_BLOCK_SIZE = 1000000;

Block.prototype.set = function(obj) {
  this.magicnum = typeof obj.magicnum !== 'undefined' ? obj.magicnum : this.magicnum;
  this.blocksize = typeof obj.blocksize !== 'undefined' ? obj.blocksize : this.blocksize;
  this.blockheader = obj.blockheader || this.blockheader;
  this.txsvi = obj.txsvi || this.txsvi;
  this.txs = obj.txs || this.txs;
  return this;
};

Block.prototype.fromHex = function(hex) {
  return this.fromBuffer(new Buffer(hex, 'hex'));
};

Block.prototype.toHex = function() {
  return this.toBuffer().toString('hex');
};

Block.prototype.fromJSON = function(json) {
  var txs = [];
  json.txs.forEach(function(tx) {
    txs.push(Tx().fromJSON(tx));
  });
  this.set({
    magicnum: json.magicnum,
    blocksize: json.blocksize,
    blockheader: Blockheader().fromJSON(json.blockheader),
    txsvi: Varint().fromJSON(json.txsvi),
    txs: txs
  });
  return this;
};

Block.prototype.toJSON = function() {
  var txs = [];
  this.txs.forEach(function(tx) {
    txs.push(tx.toJSON());
  });
  return {
    magicnum: this.magicnum,
    blocksize: this.blocksize,
    blockheader: this.blockheader.toJSON(),
    txsvi: this.txsvi.toJSON(),
    txs: txs
  };
};

Block.prototype.fromBuffer = function(buf) {
  return this.fromBR(BR(buf));
};

Block.prototype.fromBR = function(br) {
  this.magicnum = br.readUInt32LE();
  this.blocksize = br.readUInt32LE();
  this.blockheader = Blockheader().fromBR(br);
  this.txsvi = Varint(br.readVarintBuf());
  var txslen = this.txsvi.toNumber();
  this.txs = [];
  for (var i = 0; i < txslen; i++) {
    this.txs.push(Tx().fromBR(br));
  }
  return this;
};

Block.prototype.toBuffer = function() {
  return this.toBW().concat();
};

Block.prototype.toBW = function(bw) {
  if (!bw)
    bw = new BW();
  bw.writeUInt32LE(this.magicnum);
  bw.writeUInt32LE(this.blocksize);
  bw.write(this.blockheader.toBuffer());
  bw.write(this.txsvi.buf);
  var txslen = this.txsvi.toNumber();
  for (var i = 0; i < txslen; i++) {
    this.txs[i].toBW(bw);
  }
  return bw;
};

Block.prototype.hash = function() {
  return Hash.sha256sha256(this.blockheader.toBuffer());
};

Block.prototype.id = function() {
  return BR(this.hash()).readReverse();
};

module.exports = Block;
