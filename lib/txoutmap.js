/**
 * Transaction Output Map
 * ======================
 *
 * A map from a transaction hash and output number to that particular output.
 * Note that the map is from the transaction *hash*, which is the value that
 * occurs in the blockchain, not the id, which is the reverse of the hash.
 */
var BR = require('./br');

var Txoutmap = function Txoutmap(obj) {
  if (!(this instanceof Txoutmap))
    return new Txoutmap(obj);
  this.map = {};
  if (obj)
    this.set(obj);
};

Txoutmap.prototype.set = function(obj) {
  if (obj.map) {
    for (var label in obj.map) {
      if (obj.map.hasOwnProperty(label))
        this.map[label] = obj.map[label];
    }
  }
  return this;
};

Txoutmap.prototype.add = function(txhashbuf, txoutnum, txout) {
  var label = txhashbuf.toString('hex') + ':' + txoutnum;
  this.map[label] = txout;
  return this;
};

Txoutmap.prototype.get = function(txhashbuf, txoutnum) {
  var label = txhashbuf.toString('hex') + ':' + txoutnum;
  return this.map[label];
};

Txoutmap.prototype.addTx = function(tx) {
  var self = this;
  var txhashhex = tx.hash().toString('hex');
  tx.txouts.forEach(function(txout, index) {
    var label = txhashhex + ':' + index;
    self.map[label] = txout;
  });
  return this;
};

module.exports = Txoutmap;
