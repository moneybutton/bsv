/**
 * Transaction Output Map
 * ======================
 *
 * A map from a transaction hash and output number to that particular output.
 * Note that the map is from the transaction *hash*, which is the value that
 * occurs in the blockchain, not the id, which is the reverse of the hash.
 */
"use strict";
let BR = require('./br');

let Txoutmap = function Txoutmap(obj) {
  if (!(this instanceof Txoutmap))
    return new Txoutmap(obj);
  this.map = new Map();
  if (obj)
    this.fromObject(obj);
};

Txoutmap.prototype.fromObject = function(obj) {
  if (obj.map) {
    for (let label of obj.map.keys()) {
      this.map.set(label, obj.map.get(label));
    }
  }
  return this;
};

Txoutmap.prototype.add = function(txhashbuf, txoutnum, txout) {
  let label = txhashbuf.toString('hex') + ':' + txoutnum;
  this.map.set(label, txout);
  return this;
};

Txoutmap.prototype.get = function(txhashbuf, txoutnum) {
  let label = txhashbuf.toString('hex') + ':' + txoutnum;
  return this.map.get(label);
};

Txoutmap.prototype.addTx = function(tx) {
  let txhashhex = tx.hash().toString('hex');
  tx.txouts.forEach(function(txout, index) {
    let label = txhashhex + ':' + index;
    this.map.set(label, txout);
  }.bind(this));
  return this;
};

module.exports = Txoutmap;
