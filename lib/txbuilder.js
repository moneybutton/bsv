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
"use strict";
let Tx = require('./tx');
let Txout = require('./txout');
let Address = require('./address');
let Script = require('./script');
let BN = require('./bn');
let Block = require('./block');
let BR = require('./br');
let Interp = require('./interp');
let Sig = require('./sig');
let Varint = require('./varint');
let Struct = require('./struct');

let Txbuilder = function Txbuilder(obj) {
  if (!(this instanceof Txbuilder))
    return new Txbuilder(obj);
  if (obj) {
    this.initialize();
    this.fromObject(obj);
  } else {
    this.initialize();
  }
};

module.exports = Txbuilder;

Txbuilder.prototype = Object.create(Struct.prototype);

Txbuilder.prototype.initialize = function() {
  this.tx = Tx();
  this.utxoutmap = {};
  this.toTxouts = [];
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
  let script;
  if (addr.type() === 'scripthash') {
    script = Script().fromScripthash(addr.hashbuf);
  } else if (addr.type() === 'pubkeyhash') {
    script = Script().fromPubkeyhash(addr.hashbuf);
  } else {
    throw new Error('invalid address type');
  }
  let txout = Txout(valuebn, script);
  this.toTxouts.push(txout);
  return this;
};

Txbuilder.prototype.buildOutputs = function() {
  let outamount = BN(0);
  for (let i = 0; i < this.toTxouts.length; i++) {
    let txout = this.toTxouts[i];
    this.tx.addTxout(txout);
    outamount = outamount.add(txout.valuebn);
  }

  return outamount;
};

Txbuilder.prototype.buildInputs = function(outamount) {
  let inamount = BN(0);
  for (let id in this.utxoutmap) {
    if (!this.utxoutmap.hasOwnProperty(id))
      continue;

    let obj = this.utxoutmap[id];
    let txout = obj.txout;

    inamount = inamount.add(txout.valuebn);
    let split = id.split(':');
    let txidbuf = new Buffer(split[0], 'hex');
    let txhashbuf = BR(txidbuf).readReverse();
    let txoutnum = parseInt(split[1]);

    let script = Script();
    if (txout.script.isPubkeyhashOut()) {
      let pubkey = obj.pubkey;
      script.write('OP_0'); // blank signature
      script.write(pubkey.toBuffer());
    } else if (txout.script.isScripthashOut()) { // assume p2sh multisig
      let redeemScript = obj.redeemScript;
      let nsigs = redeemScript.chunks[0].opcodenum - 80;
      script.write('OP_0'); // extra OP_0; famous multisig bug in bitcoin pops one too many items from the stack
      for (let i = 0; i < nsigs; i++)
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

  let outamount = this.buildOutputs();
  outamount = outamount.add(this.feebn);
  let inamount = this.buildInputs(outamount);

  // TODO: Confirm change amount is above dust
  let changeamount = inamount.sub(outamount);
  if (changeamount.gt(0)) {
    let txout = Txbuilder().to(changeamount, this.changeaddr).toTxouts[0];
    this.tx.addTxout(txout);
  }

  return this;
};

/**
 * sign ith input with keypair
 */
Txbuilder.prototype.sign = function(i, keypair) {
  let txin = this.tx.txins[i];
  let script = txin.script;
  let txhashbuf = txin.txhashbuf;
  let txidbuf = BR(txhashbuf).readReverse();
  let txoutnum = txin.txoutnum;
  let id = txidbuf.toString('hex') + ":" + txoutnum;
  let obj = this.utxoutmap[id];
  let outscript = obj.txout.script;
  let subscript = outscript; // true for standard script types
  let sig = this.tx.sign(keypair, Sig.SIGHASH_ALL, i, subscript);
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
