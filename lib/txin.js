/*
 * Transaction Input
 * =================
 *
 * An input to a transaction. The way you probably want to use this is through
 * the convenient method of Txin(txhashbuf, txoutnum, script, seqnum) (i.e., you
 * can leave out the scriptvi, which is computed automatically if you leave it
 * out.)
 */
"use strict";
let dependencies = {
  BR: require('./br'),
  BW: require('./bw'),
  Varint: require('./varint'),
  Script: require('./script'),
  Struct: require('./struct')
};

function inject(deps) {
  let BR = deps.BR;
  let BW = deps.BW;
  let Varint = deps.Varint;
  let Script = deps.Script;
  let Struct = deps.Struct;

  function Txin(txhashbuf, txoutnum, scriptvi, script, seqnum) {
    if (!(this instanceof Txin))
      return new Txin(txhashbuf, txoutnum, scriptvi, script, seqnum);
    if (Buffer.isBuffer(txhashbuf) && txoutnum !== undefined) {
      if (txhashbuf.length !== 32)
        throw new Error('txhashbuf must be 32 bytes');
      if (scriptvi instanceof Script) {
        seqnum = script;
        script = scriptvi;
        this.fromObject({
          txhashbuf: txhashbuf,
          txoutnum: txoutnum,
          seqnum: seqnum
        });
        this.setScript(script);
      } else {
        this.fromObject({
          txhashbuf: txhashbuf,
          txoutnum: txoutnum,
          scriptvi: scriptvi,
          script: script,
          seqnum: seqnum
        });
      }
    } else if (Buffer.isBuffer(txhashbuf)) {
      let txinbuf = txhashbuf;
      this.fromBuffer(txinbuf);
    } else if (txhashbuf) {
      let obj = txhashbuf;
      this.fromObject(obj);
    }
  };

  Txin.prototype = Object.create(Struct.prototype);
  Txin.prototype.constructor = Txin;

  Txin.prototype.setScript = function(script) {
    this.scriptvi = Varint(script.toBuffer().length);
    this.script = script;
    return this;
  };

  Txin.prototype.fromJSON = function(json) {
    this.fromObject({
      txhashbuf: new Buffer(json.txhashbuf, 'hex'),
      txoutnum: json.txoutnum,
      scriptvi: Varint().fromJSON(json.scriptvi),
      script: Script().fromJSON(json.script),
      seqnum: json.seqnum
    });
    return this;
  };

  Txin.prototype.toJSON = function() {
    return {
      txhashbuf: this.txhashbuf.toString('hex'),
      txoutnum: this.txoutnum,
      scriptvi: this.scriptvi.toJSON(),
      script: this.script.toJSON(),
      seqnum: this.seqnum
    };
  };

  Txin.prototype.fromBR = function(br) {
    this.txhashbuf = br.read(32);
    this.txoutnum = br.readUInt32LE();
    this.scriptvi = Varint(br.readVarintBuf());
    this.script = Script().fromBuffer(br.read(this.scriptvi.toNumber()));
    this.seqnum = br.readUInt32LE();
    return this;
  };

  Txin.prototype.toBW = function(bw) {
    if (!bw)
      bw = new BW();
    bw.write(this.txhashbuf);
    bw.writeUInt32LE(this.txoutnum);
    bw.write(this.scriptvi.buf);
    bw.write(this.script.toBuffer());
    bw.writeUInt32LE(this.seqnum);
    return bw;
  };

  Txin.prototype.hasNullInput = function() {
    let hex = this.txhashbuf.toString('hex');
    if (hex === '0000000000000000000000000000000000000000000000000000000000000000' && this.txoutnum === 0xffffffff)
      return true;
    return false;
  };

  /**
   * Analagous to bitcoind's SetNull in COutPoint
   */
  Txin.prototype.setNullInput = function() {
    this.txhashbuf = new Buffer(32);
    this.txhashbuf.fill(0);
    this.txoutnum = 0xffffffff; // -1 cast to unsigned int
  };

  return Txin;
}

inject = require('./injector')(inject, dependencies);
let Txin = inject();
module.exports = Txin;
