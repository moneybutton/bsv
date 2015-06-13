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

  describe('#fromBuffers', function() {

    it('should parse this known message', function() {
      let msgassembler, msg, next;

      // test whole message at once
      msg = Msg();
      msgassembler = msg.fromBuffers();
      next = msgassembler.next(); // one blank .next() is necessary
      next = msgassembler.next(msgbuf);
      next.value.length.should.equal(0);
      next.done.should.equal(true);
      msg.toHex().should.equal(msghex);

      // test message one byte at a time
      msg = Msg();
      msgassembler = msg.fromBuffers();
      msgassembler.next(); // one blank .next() is necessary
      msgassembler.next(); // should be able to place in multiple undefined buffers
      msgassembler.next();
      for (let i = 0; i < msgbuf.length; i++) {
        let onebytebuf = msgbuf.slice(i, i + 1);
        next = msgassembler.next(onebytebuf);
      }
      msg.toHex().should.equal(msghex);
      next.done.should.equal(true);
      next.value.length.should.equal(0);

      // test message three bytes at a time
      msg = Msg();
      msgassembler = msg.fromBuffers();
      msgassembler.next(); // one blank .next() is necessary
      for (let i = 0; i < msgbuf.length; i += 3) {
        let three = msgbuf.slice(i, i + 3);
        next = msgassembler.next(three);
      }
      msg.toHex().should.equal(msghex);
      next.done.should.equal(true);
      next.value.length.should.equal(0);
    });

  });

  describe('#fromBuffer', function() {

    it('should parse this known message', function() {
      let msg = Msg().fromBuffer(msgbuf);
      msg.toHex().should.equal(msghex);
    });

  });

  describe('#toBuffer', function() {

    it('should parse this known message', function() {
      let msg = Msg().fromBuffer(msgbuf);
      msg.toBuffer().toString('hex').should.equal(msghex);
    });

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
