/**
 * Stealth Transaction (experimental)
 * ==================================
 */
"use strict";
let Tx = require('./tx');
let Pubkey = require('./pubkey');
let Struct = require('./struct');

let StealthTx = function StealthTx(tx, sa, sk) {
  if (!(this instanceof StealthTx))
    return new StealthTx(tx, sa, sk);
  if (tx instanceof Tx) {
    this.tx = tx;
    this.sa = sa;
    this.sk = sk;
  } else if (tx) {
    let obj = tx;
    this.fromObject(obj);
  }
};

StealthTx.prototype = Object.create(Struct.prototype);

StealthTx.prototype.isForMe = function() {
  if (!this.notMine())
    return true;
  else
    return false;
};

StealthTx.prototype.notMine = function() {
  let err;
  if (err = this.notStealth())
    return "Not stealth: " + err;
  let txopbuf = this.tx.txouts[0].script.chunks[1].buf;
  let parsed = StealthTx.parseOpReturnData(txopbuf);
  let pubkey = parsed.pubkey;
  let pubkeyhashbuf = this.tx.txouts[1].script.chunks[2].buf;
  let sk = this.sk;
  if (sk.isForMe(pubkey, pubkeyhashbuf)) {
    return false;
  } else {
    return "StealthTx not mine";
  }
};

//For now, we only support a very limited variety of stealth tx
StealthTx.prototype.notStealth = function() {
  let txouts = this.tx.txouts;
  if (!(txouts.length >= 2))
    return "Not enough txouts";
  if (!txouts[0].script.isOpReturn())
    return "First txout is not OP_RETURN";
  if (!txouts[1].script.isPubkeyhashOut())
    return "Second txout is not pubkeyhash";
  return false;
};

StealthTx.parseOpReturnData = function(buf) {
  let parsed = {};
  parsed.version = buf[0];
  parsed.noncebuf = buf.slice(1, 5);
  parsed.pubkey = Pubkey().fromBuffer(buf.slice(5, 5 + 33));
  return parsed;
};

module.exports = StealthTx;
