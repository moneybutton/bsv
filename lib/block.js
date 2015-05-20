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
let Tx = require('./tx');
let BR = require('./br');
let BW = require('./bw');
let Blockheader = require('./blockheader');
let Varint = require('./varint');
let Hash = require('./hash');
let Struct = require('./struct');

let Block = function Block(magicnum, blocksize, blockheader, txsvi, txs) {
  if (!(this instanceof Block))
    return new Block(magicnum, blocksize, blockheader, txsvi, txs);
  this.fromObject({
    magicnum: magicnum,
    blocksize: blocksize,
    blockheader: blockheader,
    txsvi: txsvi,
    txs: txs
  });
};

Block.prototype = Object.create(Struct.prototype);

Block.MAX_BLOCK_SIZE = 1000000;

Block.prototype.fromJSON = function(json) {
  let txs = [];
  json.txs.forEach(function(tx) {
    txs.push(Tx().fromJSON(tx));
  });
  this.fromObject({
    magicnum: json.magicnum,
    blocksize: json.blocksize,
    blockheader: Blockheader().fromJSON(json.blockheader),
    txsvi: Varint().fromJSON(json.txsvi),
    txs: txs
  });
  return this;
};

Block.prototype.toJSON = function() {
  let txs = [];
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

Block.prototype.fromBR = function(br) {
  this.magicnum = br.readUInt32LE();
  this.blocksize = br.readUInt32LE();
  this.blockheader = Blockheader().fromBR(br);
  this.txsvi = Varint(br.readVarintBuf());
  let txslen = this.txsvi.toNumber();
  this.txs = [];
  for (let i = 0; i < txslen; i++) {
    this.txs.push(Tx().fromBR(br));
  }
  return this;
};

Block.prototype.toBW = function(bw) {
  if (!bw)
    bw = new BW();
  bw.writeUInt32LE(this.magicnum);
  bw.writeUInt32LE(this.blocksize);
  bw.write(this.blockheader.toBuffer());
  bw.write(this.txsvi.buf);
  let txslen = this.txsvi.toNumber();
  for (let i = 0; i < txslen; i++) {
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
