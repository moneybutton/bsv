/**
 * Network Message
 * ===============
 *
 * A message on the bitcoin p2p network.
 */
"use strict";
let dependencies = {
  BR: require('./br'),
  BW: require('./bw'),
  Constants: require('./constants').Default.Msg,
  Struct: require('./struct')
};

function inject(deps) {
  let BR = deps.BR;
  let BW = deps.BW;
  let Constants = deps.Constants;
  let Struct = deps.Struct;

  function Msg(magicnum, cmdbuf, datasize, checksumbuf, databuf) {
    if (!(this instanceof Msg))
      return new Msg(magicnum, cmdbuf, datasize, checksumbuf, databuf);
    this.fromObject({
      magicnum: magicnum,
      cmdbuf: cmdbuf,
      datasize: datasize,
      checksumbuf: checksumbuf,
      databuf: databuf
    });
  };

  Msg.prototype = Object.create(Struct.prototype);
  Msg.prototype.constructor = Msg;

  Msg.prototype.fromBuffers = function*() {
    let res;
    res = yield* this.expect(4);
    this.magicnum = BR(res.buf).readUInt32BE();
    res = yield* this.expect(12, res.remainderbuf);
    this.cmdbuf = BR(res.buf).read(12);
    res = yield* this.expect(4, res.remainderbuf);
    this.datasize = BR(res.buf).readUInt32BE();
    res = yield* this.expect(4, res.remainderbuf);
    this.checksumbuf = BR(res.buf).read(4);
    res = yield* this.expect(this.datasize, res.remainderbuf);
    this.databuf = BR(res.buf).read(this.datasize);
    return res.remainderbuf;
  };

  Msg.prototype.fromBR = function(br) {
    this.magicnum = br.readUInt32BE();
    this.cmdbuf = br.read(12);
    this.datasize = br.readUInt32BE();
    this.checksumbuf = br.read(4);
    this.databuf = br.read();
    return this;
  };

  Msg.prototype.toBW = function(bw) {
    if (!bw)
      bw = BW();
    bw.writeUInt32BE(this.magicnum);
    bw.write(this.cmdbuf);
    bw.writeUInt32BE(this.datasize);
    bw.write(this.checksumbuf);
    bw.write(this.databuf);
    return bw;
  };

  Msg.prototype.fromJSON = function(json) {
    this.magicnum = json.magicnum;
    this.cmdbuf = new Buffer(json.cmdbuf, 'hex');
    this.datasize = json.datasize;
    this.checksumbuf = new Buffer(json.checksumbuf, 'hex');
    this.databuf = new Buffer(json.databuf, 'hex');
    return this;
  };

  Msg.prototype.toJSON = function() {
    return {
      magicnum: this.magicnum,
      cmdbuf: this.cmdbuf.toString('hex'),
      datasize: this.datasize,
      checksumbuf: this.checksumbuf.toString('hex'),
      databuf: this.databuf.toString('hex')
    };
  };

  return Msg;
};

inject = require('./injector')(inject, dependencies);
let Msg = inject();
Msg.Mainnet = inject({
  Constants: require('./constants').Mainnet.Msg
});
Msg.Testnet = inject({
  Constants: require('./constants').Testnet.Msg
});
module.exports = Msg;
