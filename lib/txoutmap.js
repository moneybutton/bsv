/**
 * Transaction Output Map
 * ======================
 *
 * A map from a transaction hash and output number to that particular output.
 * Note that the map is from the transaction *hash*, which is the value that
 * occurs in the blockchain, not the id, which is the reverse of the hash.
 */
"use strict";
let dependencies = {
  BR: require('./br'),
  Struct: require('./struct')
};

function inject(deps) {
  let BR = deps.BR;
  let Struct = deps.Struct;

  function Txoutmap(obj) {
    if (!(this instanceof Txoutmap))
      return new Txoutmap(obj);
    this.map = new Map();
    if (obj)
      this.fromObject(obj);
  };

  Txoutmap.prototype = Object.create(Struct.prototype);
  Txoutmap.prototype.constructor = Txoutmap;

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

  return Txoutmap;
}

inject = require('./injector')(inject, dependencies);
let Txoutmap = inject();
module.exports = Txoutmap;
