/**
 * Transaction Builder. This is a, yet unfinished, convenience class for
 * building pubkeyhash and p2sh transactions, and also for verifying them. You
 * can (or will be able to) pay to pubkeyhash to p2sh and can spend pubkeyhash
 * or p2sh-pubkeyhash or p2sh-multisig.
 */
var Tx = require('./tx');
var Address = require('./address');
var BN = require('./bn');
var Block = require('./block');
var BufR = require('./bufr');
var Interp = require('./interp');

var Txbuilder = function Txbuilder(obj) {
  if (!(this instanceof Txbuilder))
    return new Txbuilder(obj);
  if (obj) {
    this.initialize();
    this.set(obj);
  } else {
    this.initialize();
  }
};

module.exports = Txbuilder;

Txbuilder.prototype.initialize = function() {
  this.tx = Tx();
  this.txoutsmap = {};
  return this;
};

Txbuilder.prototype.set = function(obj) {
  this.tx = obj.tx || this.tx;
  this.txoutsmap = obj.txoutsmap || this.txoutsmap;
  return this;
};

/**
 * Verifies that the transaction is valid both by performing basic checks, such
 * as ensuring that no two inputs are the same, as well as by verifying every
 * script. The two checks are checktxstr, which is analagous to bitcoind's
 * CheckTransaction, and verifytxstr, which runs the script interpreter.
 * 
 * This does NOT check that any possible claimed fees are accurate; checking
 * that the fees are accurate requires checking that the input transactions are
 * valid, which is not performed by this test. That check is done with the
 * normal verify function.
 */
Txbuilder.prototype.verifytx = function(flags) {
  return !this.checktxstr() && !this.verifytxstr(flags);
};

/**
 * Check that a transaction passes basic sanity tests. If not, return a string
 * describing the error. This function contains the same logic as
 * CheckTransaction in bitcoin core.
 */
Txbuilder.prototype.checktxstr = function() {
  // Basic checks that don't depend on any context
  if (this.tx.txins.length === 0 || this.tx.txinsvi.toNumber() === 0)
    return "transaction txins empty";
  if (this.tx.txouts.length === 0 || this.tx.txoutsvi.toNumber() === 0)
    return "transaction txouts empty";

  // Size limits
  if (this.tx.toBuffer().length > Block.MAX_BLOCK_SIZE)
    return "transaction over the maximum block size";
  
  // Check for negative or overflow output values
  var valueoutbn = BN(0);
  for (var i = 0; i < this.tx.txouts.length; i++) {
    var txout = this.tx.txouts[i];
    if (txout.valuebn.lt(0))
      return "transaction txout " + i + " negative";
    if (txout.valuebn.gt(Tx.MAX_MONEY))
      return "transaction txout " + i + " greater than MAX_MONEY";
    valueoutbn = valueoutbn.add(txout.valuebn);
    if (valueoutbn.gt(Tx.MAX_MONEY))
      return "transaction txout " + i + " total output greater than MAX_MONEY";
  }

  // Check for duplicate inputs
  var txinmap = {};
  for (var i = 0; i < this.tx.txins.length; i++) {
    var txin = this.tx.txins[i];
    var inputid = txin.txidbuf.toString('hex') + ':' + txin.txoutnum;
    if (typeof txinmap[inputid] !== 'undefined')
      return "transaction input " + i + " duplicate input";
    txinmap[inputid] = true;
  }

  if (this.tx.isCoinbase()) {
    var buf = this.tx.txins[0].script.toBuffer();
    if (buf.length < 2 || buf.length > 100)
      return "coinbase trasaction script size invalid";
  } else {
    for (var i = 0; i < this.tx.txins.length; i++) {
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
Txbuilder.prototype.verifytxstr = function(flags) {
  for (var i = 0; i < this.tx.txins.length; i++) {
    if (!this.verifytxnin(i, flags))
      return "input " + i + " failed script verify";
  }
  return false;
};

/**
 * Verify a particular input by running the script interpreter. Returns true if
 * the input is valid, false otherwise.
 */
Txbuilder.prototype.verifytxnin = function(nin, flags) {
  var txin = this.tx.txins[nin];
  var scriptSig = txin.script;
  var txoutnum = txin.txoutnum;
  var txidbuf = BufR(txin.txidbuf).readReverse();
  var txidhex = txidbuf.toString('hex');
  var mapid = txidhex + ":" + txoutnum;
  var scriptPubkey = this.txoutsmap[mapid].script;
  var interp = Interp()
  var verified = interp.verify(scriptSig, scriptPubkey, this.tx, nin, flags);
  return verified;
};
