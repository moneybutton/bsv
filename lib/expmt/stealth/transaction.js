var Transaction = require('../../transaction');
var Pubkey = require('../../pubkey');

var STransaction = function STransaction(tx, sa, sk) {
  if (!(this instanceof STransaction))
    return new STransaction(tx, sa, sk);
  if (tx instanceof Transaction) {
    this.tx = tx;
    this.sa = sa;
    this.sk = sk;
  } else if (tx) {
    var obj = tx;
    this.set(obj);
  }
};

STransaction.prototype.set = function(obj) {
  this.sk = obj.sk || this.sk;
  this.sa = obj.sa || this.sa;
  this.tx = obj.tx || this.tx;
  return this;
};

STransaction.prototype.isForMe = function() {
  if (!this.notMine())
    return true;
  else
    return false;
};

STransaction.prototype.notMine = function() {
  var err;
  if (err = this.notStealth())
    return "Not stealth: " + err;
  var txopbuf = this.tx.txouts[0].script.chunks[1].buf;
  var parsed = STransaction.parseOpReturnData(txopbuf);
  var pubkey = parsed.pubkey;
  var pubkeyhashbuf = this.tx.txouts[1].script.chunks[2].buf;
  var sk = this.sk;
  if (sk.isForMe(pubkey, pubkeyhashbuf)) {
    return false;
  } else {
    return "STransaction not mine";
  }
};

//For now, we only support a very limited variety of stealth tx
STransaction.prototype.notStealth = function() {
  var txouts = this.tx.txouts;
  if (!(txouts.length >= 2))
    return "Not enough txouts";
  if (!txouts[0].script.isOpReturn())
    return "First txout is not OP_RETURN";
  if (!txouts[1].script.isPubkeyhashOut())
    return "Second txout is not pubkeyhash";
  return false;
};

STransaction.parseOpReturnData = function(buf) {
  var parsed = {};
  parsed.version = buf[0];
  parsed.noncebuf = buf.slice(1, 5);
  parsed.pubkey = Pubkey().fromBuffer(buf.slice(5, 5 + 33));
  return parsed;
};

module.exports = STransaction;
