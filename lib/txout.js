/**
 * Transaction Output
 * ==================
 *
 * An output to a transaction. The way you normally want to make one is with
 * Txout(valuebn, script) (i.e., just as with Txin, you can leave out the
 * scriptvi, since it can be computed automatically.
*/
var BN = require('./bn');
var BR = require('./br');
var BW = require('./bw');
var Varint = require('./varint');
var Script = require('./script');

var Txout = function Txout(valuebn, scriptvi, script) {
  if (!(this instanceof Txout))
    return new Txout(valuebn, scriptvi, script);
  if (valuebn instanceof BN) {
    if (scriptvi instanceof Script) {
      script = scriptvi;
      this.set({
        valuebn: valuebn
      });
      this.setScript(script);
    } else {
      this.set({
        valuebn: valuebn,
        scriptvi: scriptvi,
        script: script
      });
    }
  } else if (valuebn) {
    var obj = valuebn;
    this.set(obj);
  }
};

Txout.prototype.set = function(obj) {
  this.valuebn = obj.valuebn || this.valuebn;
  this.scriptvi = obj.scriptvi || this.scriptvi;
  this.script = obj.script || this.script;
  return this;
};

Txout.prototype.setScript = function(script) {
  this.scriptvi = Varint(script.toBuffer().length);
  this.script = script;
  return this;
};

Txout.prototype.fromJSON = function(json) {
  this.set({
    valuebn: BN().fromJSON(json.valuebn),
    scriptvi: Varint().fromJSON(json.scriptvi),
    script: Script().fromJSON(json.script)
  });
  return this;
};

Txout.prototype.toJSON = function() {
  return {
    valuebn: this.valuebn.toJSON(),
    scriptvi: this.scriptvi.toJSON(),
    script: this.script.toJSON()
  };
};

Txout.prototype.fromBuffer = function(buf) {
  return this.fromBR(BR(buf));
};

Txout.prototype.fromBR = function(br) {
  this.valuebn = br.readUInt64LEBN();
  this.scriptvi = Varint(br.readVarintNum());
  this.script = Script().fromBuffer(br.read(this.scriptvi.toNumber()));
  return this;
};

Txout.prototype.toBuffer = function() {
  var bw = new BW();
  return this.toBW(bw).concat();
};

Txout.prototype.toBW = function(bw) {
  if (!bw)
    bw = new BW();
  bw.writeUInt64LEBN(this.valuebn);
  bw.write(this.scriptvi.buf);
  bw.write(this.script.toBuffer());
  return bw;
};

module.exports = Txout;
