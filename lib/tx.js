/**
 * Transaction
 * ===========
 *
 * A bitcoin transaction.
 */
var Txin = require('./txin');
var Txout = require('./txout');
var BW = require('./bw');
var BR = require('./br');
var Varint = require('./varint');
var Hash = require('./hash');
var Script = require('./script');
var Sig = require('./sig');
var BN = require('./bn');
var ECDSA = require('./ecdsa');

var Tx = function Tx(version, txinsvi, txins, txoutsvi, txouts, nlocktime) {
  if (!(this instanceof Tx))
    return new Tx(version, txinsvi, txins, txoutsvi, txouts, nlocktime);
  if (typeof version === 'number') {
    this.initialize();
    this.set({
      version: version,
      txinsvi: txinsvi,
      txins: txins,
      txoutsvi: txoutsvi,
      txouts: txouts,
      nlocktime: nlocktime
    });
  } else if (Buffer.isBuffer(version)) {
    //not necessary to initialize, since everything should be overwritten
    var txbuf = version;
    this.fromBuffer(txbuf);
  } else if (version) {
    this.initialize();
    var obj = version;
    this.set(obj);
  } else {
    this.initialize();
  }
};

Tx.MAX_MONEY = 21000000 * 1e8;

Tx.prototype.initialize = function() {
  this.version = 1;
  this.txinsvi = Varint(0);
  this.txins = [];
  this.txoutsvi = Varint(0);
  this.txouts = [];
  this.nlocktime = 0;
  return this;
};

Tx.prototype.set = function(obj) {
  this.version = typeof obj.version !== 'undefined' ? obj.version : this.version;
  this.txinsvi = obj.txinsvi || this.txinsvi;
  this.txins = obj.txins || this.txins;
  this.txoutsvi = obj.txoutsvi || this.txoutsvi;
  this.txouts = obj.txouts || this.txouts;
  this.nlocktime = typeof obj.nlocktime !== 'undefined' ? obj.nlocktime : this.nlocktime;
  return this;
};

Tx.prototype.fromHex = function(hex) {
  return this.fromBuffer(new Buffer(hex, 'hex'));
};

Tx.prototype.toHex = function() {
  return this.toBuffer().toString('hex');
};

Tx.prototype.fromJSON = function(json) {
  var txins = [];
  json.txins.forEach(function(txin) {
    txins.push(Txin().fromJSON(txin));
  });
  var txouts = [];
  json.txouts.forEach(function(txout) {
    txouts.push(Txout().fromJSON(txout));
  });
  this.set({
    version: json.version,
    txinsvi: Varint().fromJSON(json.txinsvi),
    txins: txins,
    txoutsvi: Varint().fromJSON(json.txoutsvi),
    txouts: txouts,
    nlocktime: json.nlocktime
  });
  return this;
};

Tx.prototype.toJSON = function() {
  var txins = [];
  this.txins.forEach(function(txin) {
    txins.push(txin.toJSON());
  });
  var txouts = [];
  this.txouts.forEach(function(txout) {
    txouts.push(txout.toJSON());
  });
  return {
    version: this.version,
    txinsvi: this.txinsvi.toJSON(),
    txins: txins,
    txoutsvi: this.txoutsvi.toJSON(),
    txouts: txouts,
    nlocktime: this.nlocktime
  };
};

Tx.prototype.fromBuffer = function(buf) {
  return this.fromBR(BR(buf));
};

Tx.prototype.fromBR = function(br) {
  this.version = br.readUInt32LE();
  this.txinsvi = Varint(br.readVarintBuf());
  var txinsnum = this.txinsvi.toNumber();
  this.txins = [];
  for (var i = 0; i < txinsnum; i++) {
    this.txins.push(Txin().fromBR(br));
  }
  this.txoutsvi = Varint(br.readVarintBuf());
  var txoutsnum = this.txoutsvi.toNumber();
  this.txouts = [];
  for (var i = 0; i < txoutsnum; i++) {
    this.txouts.push(Txout().fromBR(br));
  }
  this.nlocktime = br.readUInt32LE();
  return this;
};

Tx.prototype.toBuffer = function() {
  return this.toBW().concat();
};

Tx.prototype.toBW = function(bw) {
  if (!bw)
    bw = new BW();
  bw.writeUInt32LE(this.version);
  bw.write(this.txinsvi.buf);
  for (var i = 0; i < this.txins.length; i++) {
    this.txins[i].toBW(bw);
  }
  bw.write(this.txoutsvi.buf)
  for (var i = 0; i < this.txouts.length; i++) {
    this.txouts[i].toBW(bw);
  }
  bw.writeUInt32LE(this.nlocktime);
  return bw;
};

Tx.prototype.sighash = function(nhashtype, nin, subscript) {
  var txcopy = Tx(this.toBuffer());

  subscript = Script(subscript.toBuffer());
  subscript.removeCodeseparators();

  for (var i = 0; i < txcopy.txins.length; i++) {
    txcopy.txins[i] = Txin(txcopy.txins[i].toBuffer()).setScript(Script(''));
  }
  
  txcopy.txins[nin] = Txin(txcopy.txins[nin].toBuffer()).setScript(subscript);

  if ((nhashtype & 31) === Sig.SIGHASH_NONE) {
    txcopy.txouts.length = 0;
    txcopy.txoutsvi = Varint(0);

    for (var i = 0; i < txcopy.txins.length; i++) {
      if (i !== nin)
        txcopy.txins[i].seqnum = 0;
    }
  } else if ((nhashtype & 31) === Sig.SIGHASH_SINGLE) {
    // The SIGHASH_SINGLE bug.
    // https://bitcointalk.org/index.php?topic=260595.0
    if (nin > txcopy.txouts.length - 1)
      return new Buffer('0000000000000000000000000000000000000000000000000000000000000001', 'hex');

    txcopy.txouts.length = nin + 1;
    txcopy.txoutsvi = Varint(nin + 1);

    for (var i = 0; i < txcopy.txouts.length; i++) {
      if (i < nin)
        txcopy.txouts[i] = Txout(BN().fromBuffer(new Buffer('ffffffffffffffff', 'hex')), Script(''));
    }

    for (var i = 0; i < txcopy.txins.length; i++) {
      if (i !== nin)
        txcopy.txins[i].seqnum = 0;
    }
  }
  //else, SIGHASH_ALL

  if (nhashtype & Sig.SIGHASH_ANYONECANPAY) {
    txcopy.txins[0] = txcopy.txins[nin];
    txcopy.txins.length = 1;
    txcopy.txinsvi = Varint(1);
  }

  var buf = BW().write(txcopy.toBuffer()).writeInt32LE(nhashtype).concat();
  return BR(Hash.sha256sha256(buf)).readReverse();
};

// This function returns a signature but does not update any inputs
Tx.prototype.sign = function(keypair, nhashtype, nin, subscript) {
  var hashbuf = this.sighash(nhashtype, nin, subscript);
  var sig = ECDSA.sign(hashbuf, keypair, 'little').set({nhashtype: nhashtype});
  return sig;
};

// This function takes a signature as input and does not parse any inputs
Tx.prototype.verify = function(sig, pubkey, nin, subscript) {
  var hashbuf = this.sighash(sig.nhashtype, nin, subscript);
  return ECDSA.verify(hashbuf, sig, pubkey, 'little');
};

Tx.prototype.hash = function() {
  return Hash.sha256sha256(this.toBuffer());
};

Tx.prototype.id = function() {
  return BR(this.hash()).readReverse();
};

Tx.prototype.addTxin = function(txhashbuf, txoutnum, script, seqnum) {
  var txin;
  if (txhashbuf instanceof Txin)
    txin = txhashbuf;
  else
    txin = Txin(txhashbuf, txoutnum, script, seqnum);
  this.txins.push(txin);
  this.txinsvi = Varint(this.txinsvi.toNumber() + 1);
  return this;
};

Tx.prototype.addTxout = function(valuebn, script) {
  var txout;
  if (valuebn instanceof Txout)
    txout = valuebn;
  else
    txout = Txout(valuebn, script);
  this.txouts.push(txout);
  this.txoutsvi = Varint(this.txoutsvi.toNumber() + 1);
  return this;
};

/**
 * Analagous to bitcoind's IsCoinBase function in transaction.h
 */
Tx.prototype.isCoinbase = function() {
  return (this.txins.length === 1 && this.txins[0].hasNullInput());
}

module.exports = Tx;
