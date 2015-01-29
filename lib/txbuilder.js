/**
 * Transaction Builder
 * ===================
 *
 * Transaction Builder. This is a, yet unfinished, convenience class for
 * building pubkeyhash and p2sh transactions, and also for verifying arbitrary
 * transactions (and their inputs). You can (or will be able to) pay to
 * pubkeyhash to p2sh and can spend pubkeyhash or p2sh-pubkeyhash or
 * p2sh-multisig.
 */
var Tx = require('./tx');
var Txout = require('./txout');
var Address = require('./address');
var Script = require('./script');
var BN = require('./bn');
var Block = require('./block');
var BR = require('./br');
var Interp = require('./interp');
var Sig = require('./sig');
var Varint = require('./varint');

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
  this.utxoutmap = {};
  this.toTxouts = [];
  return this;
};

Txbuilder.prototype.set = function(obj) {
  this.tx = obj.tx || this.tx;
  this.utxoutmap = obj.utxoutmap || this.utxoutmap;
  this.toTxouts = obj.toTxouts || this.toTxouts;
  this.changeaddr = obj.changeaddr || this.changeaddr;
  this.feebn = obj.feebn || this.feebn;
  return this;
};

Txbuilder.prototype.setFee = function(feebn) {
  this.feebn = feebn;
  return this;
};

Txbuilder.prototype.setChangeAddress = function(changeaddr) {
  this.changeaddr = changeaddr;
  return this;
};

Txbuilder.prototype.setUTxoutMap = function(utxoutmap) {
  this.utxoutmap = utxoutmap;
  return this;
};

/**
 * An an address to send funds to, along with the amount. The amount should be
 * denominated in satoshis, not bitcoins.
 */
Txbuilder.prototype.to = function(valuebn, addr) {
  if (!(addr instanceof Address) || !(valuebn instanceof BN))
    throw new Error('addr must be an Address, and valuebn must be a BN');
  if (addr.type() === 'scripthash') {
    var script = Script().fromScripthash(addr.hashbuf);
  } else if (addr.type() === 'pubkeyhash') {
    var script = Script().fromPubkeyhash(addr.hashbuf);
  } else {
    throw new Error('invalid address type');
  }
  var txout = Txout(valuebn, script);
  this.toTxouts.push(txout);
  return this;
};

Txbuilder.prototype.buildOutputs = function() {
  var outamount = BN(0);
  for (var i = 0; i < this.toTxouts.length; i++) {
    var txout = this.toTxouts[i];
    this.tx.addTxout(txout);
    outamount = outamount.add(txout.valuebn);
  }

  return outamount;
};

Txbuilder.prototype.buildInputs = function(outamount) {
  var inamount = BN(0);
  for (var id in this.utxoutmap) {
    if (!this.utxoutmap.hasOwnProperty(id))
      continue;

    var obj = this.utxoutmap[id];
    var txout = obj.txout;

    inamount = inamount.add(txout.valuebn);
    var split = id.split(':');
    var txidbuf = new Buffer(split[0], 'hex');
    var txhashbuf = BR(txidbuf).readReverse();
    var txoutnum = parseInt(split[1]);

    var script = Script();
    if (txout.script.isPubkeyhashOut()) {
      var pubkey = obj.pubkey;
      script.write('OP_0'); // blank signature
      script.write(pubkey.toBuffer());
    } else if (txout.script.isScripthashOut()) { // assume p2sh multisig
      var redeemScript = obj.redeemScript;
      var nsigs = redeemScript.chunks[0].opcodenum - 80;
      script.write('OP_0'); // extra OP_0; famous multisig bug in bitcoin pops one too many items from the stack
      for (var i = 0; i < nsigs; i++)
        script.write('OP_0'); // one blank per signature
      script.write(redeemScript.toBuffer());
    } else {
      continue; // not something we can spend
    }

    this.tx.addTxin(txhashbuf, txoutnum, script, 0xffffffff);

    if (inamount.geq(outamount))
      return inamount;
  }

  throw new Error('Not enough spendable funds');
};

Txbuilder.prototype.build = function() {
  if (typeof this.changeaddr === 'undefined')
    throw new Error('Must specify change address');

  if (typeof this.feebn === 'undefined')
    throw new Error('Must specify fee');

  if (this.toTxouts.length === 0)
    throw new Error('Must specify toTxouts');

  var outamount = this.buildOutputs();
  outamount = outamount.add(this.feebn);
  var inamount = this.buildInputs(outamount);

  // TODO: Confirm change amount is above dust
  var changeamount = inamount.sub(outamount);
  if (changeamount.gt(0)) {
    var txout = Txbuilder().to(changeamount, this.changeaddr).toTxouts[0];
    this.tx.addTxout(txout);
  }

  return this;
};

/**
 * sign ith input with keypair
 */
Txbuilder.prototype.sign = function(i, keypair) {
  var txin = this.tx.txins[i];
  var script = txin.script;
  var txhashbuf = txin.txhashbuf;
  var txidbuf = BR(txhashbuf).readReverse();
  var txoutnum = txin.txoutnum;
  var id = txidbuf.toString('hex') + ":" + txoutnum;
  var obj = this.utxoutmap[id];
  var outscript = obj.txout.script;
  var subscript = outscript; // true for standard script types
  var sig = this.tx.sign(keypair, Sig.SIGHASH_ALL, i, subscript);
  if (script.isPubkeyhashIn()) {
    txin.script.chunks[0] = Script().write(sig.toTxFormat()).chunks[0];
    txin.scriptvi = Varint(txin.script.toBuffer().length);
  } else if (script.isScripthashIn()) {
    txin.script.chunks[1 + obj.n] = Script().write(sig.toTxFormat()).chunks[0];
    txin.scriptvi = Varint(txin.script.toBuffer().length);
  } else {
    throw new Error('cannot sign unknown script type for input ' + i);
  }
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
    var inputid = txin.txhashbuf.toString('hex') + ':' + txin.txoutnum;
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
  var txidbuf = BR(txin.txhashbuf).readReverse();
  var txidhex = txidbuf.toString('hex');
  var mapid = txidhex + ":" + txoutnum;
  var scriptPubkey = this.utxoutmap[mapid].txout.script;
  var interp = Interp();
  var verified = interp.verify(scriptSig, scriptPubkey, this.tx, nin, flags);
  return verified;
};
