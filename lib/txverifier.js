"use strict";
let Tx = require('./tx');
let Txout = require('./txout');
let Txoutmap = require('./txoutmap');
let Address = require('./address');
let Script = require('./script');
let BN = require('./bn');
let Block = require('./block');
let BR = require('./br');
let Interp = require('./interp');
let Sig = require('./sig');
let Varint = require('./varint');
let Struct = require('./struct');

let Txverifier = function Txverifier(tx, txoutmap) {
  if (!(this instanceof Txverifier))
    return new Txverifier(tx, txoutmap);
  if (tx) {
    if (txoutmap) {
      this.fromObject({
        tx: tx,
        txoutmap: txoutmap
      });
    } else {
      let obj = tx;
      this.fromObject(obj);
    }
  }
};

module.exports = Txverifier;

Txverifier.prototype = Object.create(Struct.prototype);

/**
 * Verifies that the transaction is valid both by performing basic checks, such
 * as ensuring that no two inputs are the same, as well as by verifying every
 * script. The two checks are checkstr, which is analagous to bitcoind's
 * CheckTransaction, and verifystr, which runs the script interpreter.
 * 
 * This does NOT check that any possible claimed fees are accurate; checking
 * that the fees are accurate requires checking that the input transactions are
 * valid, which is not performed by this test. That check is done with the
 * normal verify function.
 */
Txverifier.prototype.verify = function(flags) {
  return !this.checkstr() && !this.verifystr(flags);
};

/**
 * Convenience method to verify a transaction.
 */
Txverifier.verify = function(tx, txoutmap, flags) {
  return Txverifier(tx, txoutmap).verify(flags);
};

/**
 * Check that a transaction passes basic sanity tests. If not, return a string
 * describing the error. This function contains the same logic as
 * CheckTransaction in bitcoin core.
 */
Txverifier.prototype.checkstr = function() {
  // Basic checks that don't depend on any context
  if (this.tx.txins.length === 0 || this.tx.txinsvi.toNumber() === 0)
    return "transaction txins empty";
  if (this.tx.txouts.length === 0 || this.tx.txoutsvi.toNumber() === 0)
    return "transaction txouts empty";

  // Size limits
  if (this.tx.toBuffer().length > Block.MAX_BLOCK_SIZE)
    return "transaction over the maximum block size";
  
  // Check for negative or overflow output values
  let valueoutbn = BN(0);
  for (let i = 0; i < this.tx.txouts.length; i++) {
    let txout = this.tx.txouts[i];
    if (txout.valuebn.lt(0))
      return "transaction txout " + i + " negative";
    if (txout.valuebn.gt(Tx.MAX_MONEY))
      return "transaction txout " + i + " greater than MAX_MONEY";
    valueoutbn = valueoutbn.add(txout.valuebn);
    if (valueoutbn.gt(Tx.MAX_MONEY))
      return "transaction txout " + i + " total output greater than MAX_MONEY";
  }

  // Check for duplicate inputs
  let txinmap = {};
  for (let i = 0; i < this.tx.txins.length; i++) {
    let txin = this.tx.txins[i];
    let inputid = txin.txhashbuf.toString('hex') + ':' + txin.txoutnum;
    if (typeof txinmap[inputid] !== 'undefined')
      return "transaction input " + i + " duplicate input";
    txinmap[inputid] = true;
  }

  if (this.tx.isCoinbase()) {
    let buf = this.tx.txins[0].script.toBuffer();
    if (buf.length < 2 || buf.length > 100)
      return "coinbase trasaction script size invalid";
  } else {
    for (let i = 0; i < this.tx.txins.length; i++) {
      if (this.tx.txins[i].hasNullInput())
        return "tranasction input " + i + " has null input";
    }
  }
  return false;
};

/**
 * verify the transaction inputs by running the script interpreter. Returns a
 * string of the script interpreter is invalid, otherwise returns false.
 */
Txverifier.prototype.verifystr = function(flags) {
  for (let i = 0; i < this.tx.txins.length; i++) {
    if (!this.verifynin(i, flags))
      return "input " + i + " failed script verify";
  }
  return false;
};

/**
 * Verify a particular input by running the script interpreter. Returns true if
 * the input is valid, false otherwise.
 */
Txverifier.prototype.verifynin = function(nin, flags) {
  let txin = this.tx.txins[nin];
  let scriptSig = txin.script;
  let scriptPubkey = this.txoutmap.get(txin.txhashbuf, txin.txoutnum).script;
  let interp = Interp();
  let verified = interp.verify(scriptSig, scriptPubkey, this.tx, nin, flags);
  return verified;
};
