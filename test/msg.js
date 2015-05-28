"use strict";
let Msg = require('../lib/msg');
let BR = require('../lib/br');
let BW = require('../lib/bw');
let should = require('chai').should();

describe('Msg', function() {
  let msgjsonstr = '{"magicnum":4190024921,"cmdbuf":"696e76000000000000000000","datasize":0,"checksumbuf":"5df6e0e2","databuf":""}';
  let msgjson = JSON.parse(msgjsonstr);
  let msghex = "f9beb4d9696e76000000000000000000000000005df6e0e2";
  let msgbuf = new Buffer(msghex, 'hex');
  let msg = Msg().fromJSON(JSON.parse(msgjsonstr));

  it('should satisfy this basic API', function() {
    let msg = new Msg();
    should.exist(msg);
    msg = Msg();
    should.exist(msg);
  });

  describe('#fromBR', function() {

    it('should parse this known message', function() {
      let br = BR(msgbuf);
      let msg = Msg().fromBR(br);
      msg.toHex().should.equal(msghex);
    });

  });

  describe('#toBW', function() {

    it('should create this known message', function() {
      let bw = BW();
      Msg().fromHex(msghex).toBW(bw).toBuffer().toString('hex').should.equal(msghex);
      Msg().fromHex(msghex).toBW().toBuffer().toString('hex').should.equal(msghex);
    });

  });

  describe('#fromJSON', function() {

    it('should parse this known json msg', function() {
      Msg().fromJSON(msgjson).toHex().should.equal(msghex);
    });

  });

  describe('#toJSON', function() {

    it('should create this known message', function() {
      JSON.stringify(Msg().fromHex(msghex).toJSON()).should.equal(msgjsonstr);
    });

  });

});
