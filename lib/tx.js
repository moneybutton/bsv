var Txin = require('./txin');
var Txout = require('./txout');
var BufferWriter = require('./bufferwriter');
var BufferReader = require('./bufferreader');
var Varint = require('./varint');
var Hash = require('./hash');
var Script = require('./script');
var Signature = require('./signature');
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

Tx.prototype.initialize = function() {
  this.version = 1;
  this.txinsvi = Varint(0);
  this.txins = [];
  this.txoutsvi = Varint(0);
  this.txouts = [];
  this.nlocktime = 0xffffffff;
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
  return this.fromBufferReader(BufferReader(buf));
};

Tx.prototype.fromBufferReader = function(br) {
  this.version = br.readUInt32LE();
  this.txinsvi = Varint(br.readVarintBuf());
  var txinsnum = this.txinsvi.toNumber();
  this.txins = [];
  for (var i = 0; i < txinsnum; i++) {
    this.txins.push(Txin().fromBufferReader(br));
  }
  this.txoutsvi = Varint(br.readVarintBuf());
  var txoutsnum = this.txoutsvi.toNumber();
  this.txouts = [];
  for (var i = 0; i < txoutsnum; i++) {
    this.txouts.push(Txout().fromBufferReader(br));
  }
  this.nlocktime = br.readUInt32LE();
  return this;
};

Tx.prototype.toBuffer = function() {
  return this.toBufferWriter().concat();
};

Tx.prototype.toBufferWriter = function(bw) {
  if (!bw)
    bw = new BufferWriter();
  bw.writeUInt32LE(this.version);
  bw.write(this.txinsvi.buf);
  for (var i = 0; i < this.txins.length; i++) {
    this.txins[i].toBufferWriter(bw);
  }
  bw.write(this.txoutsvi.buf)
  for (var i = 0; i < this.txouts.length; i++) {
    this.txouts[i].toBufferWriter(bw);
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

  if ((nhashtype & 31) === Signature.SIGHASH_NONE) {
    txcopy.txouts.length = 0;
    txcopy.txoutsvi = Varint(0);

    for (var i = 0; i < txcopy.txins.length; i++) {
      if (i !== nin)
        txcopy.txins[i].seqnum = 0;
    }
  } else if ((nhashtype & 31) === Signature.SIGHASH_SINGLE) {
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

  if (nhashtype & Signature.SIGHASH_ANYONECANPAY) {
    txcopy.txins[0] = txcopy.txins[nin];
    txcopy.txins.length = 1;
    txcopy.txinsvi = Varint(1);
  }

  var buf = BufferWriter().write(txcopy.toBuffer()).writeInt32LE(nhashtype).concat();
  return BufferReader(Hash.sha256sha256(buf)).readReverse();
};

// This function returns a signature but does not update any inputs
Tx.prototype.sign = function(keypair, nhashtype, nin, subscript) {
  var hashbuf = this.sighash(nhashtype, nin, subscript);
  var sig = ECDSA.sign(hashbuf, keypair).set({nhashtype: nhashtype});
  return sig;
};

// This function takes a signature as input and does not parse any inputs
Tx.prototype.verify = function(sig, pubkey, nin, subscript) {
  var hashbuf = this.sighash(sig.nhashtype, nin, subscript);
  return ECDSA.verify(hashbuf, sig, pubkey);
};

Tx.prototype.hash = function() {
  return Hash.sha256sha256(this.toBuffer());
};

Tx.prototype.id = function() {
  return BufferReader(this.hash()).readReverse();
};

Tx.prototype.addTxin = function(txin) {
  this.txins.push(txin);
  this.txinsvi = Varint(this.txinsvi.toNumber() + 1);
  return this;
};

Tx.prototype.addTxout = function(txout) {
  this.txouts.push(txout);
  this.txoutsvi = Varint(this.txoutsvi.toNumber() + 1);
  return this;
};

module.exports = Tx;
