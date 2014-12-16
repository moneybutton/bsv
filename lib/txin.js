/*
 * An input to a transaction. The way you probably want to use this is through
 * the convenient method of Txin(txidbuf, txoutnum, script, seqnum) (i.e., you
 * can leave out the scriptvi, which is computed automatically if you leave it
 * out.)
 */
var BufR = require('./bufr');
var BufW = require('./bufw');
var Varint = require('./varint');
var Script = require('./script');

var Txin = function Txin(txidbuf, txoutnum, scriptvi, script, seqnum) {
  if (!(this instanceof Txin))
    return new Txin(txidbuf, txoutnum, scriptvi, script, seqnum);
  if (Buffer.isBuffer(txidbuf) && typeof txoutnum !== 'undefined') {
    if (txidbuf.length !== 32)
      throw new Error('txidbuf must be 32 bytes');
    if (scriptvi instanceof Script) {
      seqnum = script;
      script = scriptvi;
      this.set({
        txidbuf: txidbuf,
        txoutnum: txoutnum,
        seqnum: seqnum
      });
      this.setScript(script);
    } else {
      this.set({
        txidbuf: txidbuf,
        txoutnum: txoutnum,
        scriptvi: scriptvi,
        script: script,
        seqnum: seqnum
      });
    }
  } else if (Buffer.isBuffer(txidbuf)) {
    var txinbuf = txidbuf;
    this.fromBuffer(txinbuf);
  } else if (txidbuf) {
    var obj = txidbuf;
    this.set(obj);
  }
};

Txin.prototype.set = function(obj) {
  this.txidbuf = obj.txidbuf || this.txidbuf;
  this.txoutnum = typeof obj.txoutnum !== 'undefined' ? obj.txoutnum : this.txoutnum;
  this.scriptvi = typeof obj.scriptvi !== 'undefined' ? obj.scriptvi : this.scriptvi;
  this.script = obj.script || this.script;
  this.seqnum = typeof obj.seqnum !== 'undefined' ? obj.seqnum : this.seqnum;
  return this;
};

Txin.prototype.setScript = function(script) {
  this.scriptvi = Varint(script.toBuffer().length);
  this.script = script;
  return this;
};

Txin.prototype.fromJSON = function(json) {
  this.set({
    txidbuf: new Buffer(json.txidbuf, 'hex'),
    txoutnum: json.txoutnum,
    scriptvi: Varint().fromJSON(json.scriptvi),
    script: Script().fromJSON(json.script),
    seqnum: json.seqnum
  });
  return this;
};

Txin.prototype.toJSON = function() {
  return {
    txidbuf: this.txidbuf.toString('hex'),
    txoutnum: this.txoutnum,
    scriptvi: this.scriptvi.toJSON(),
    script: this.script.toJSON(),
    seqnum: this.seqnum
  };
};

Txin.prototype.fromBuffer = function(buf) {
  return this.fromBufR(BufR(buf));
};

Txin.prototype.fromBufR = function(br) {
  this.txidbuf = br.read(32);
  this.txoutnum = br.readUInt32LE();
  this.scriptvi = Varint(br.readVarintBuf());
  this.script = Script().fromBuffer(br.read(this.scriptvi.toNumber()));
  this.seqnum = br.readUInt32LE();
  return this;
};

Txin.prototype.toBuffer = function() {
  return this.toBufW().concat();
};

Txin.prototype.toBufW = function(bw) {
  if (!bw)
    bw = new BufW();
  bw.write(this.txidbuf);
  bw.writeUInt32LE(this.txoutnum);
  bw.write(this.scriptvi.buf);
  bw.write(this.script.toBuffer());
  bw.writeUInt32LE(this.seqnum);
  return bw;
};

Txin.prototype.hasNullInput = function() {
  var hex = this.txidbuf.toString('hex');
  if (hex === '0000000000000000000000000000000000000000000000000000000000000000' && this.txoutnum === 0xffffffff)
    return true;
  return false;
};

/**
 * Analagous to bitcoind's SetNull in COutPoint
 */
Txin.prototype.setNullInput = function() {
  this.txidbuf = new Buffer(32);
  this.txidbuf.fill(0);
  this.txoutnum = 0xffffffff; // -1 cast to unsigned int
};

module.exports = Txin;
