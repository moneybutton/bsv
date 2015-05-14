"use strict";
let BN = require('../lib/bn');
let should = require('chai').should();
let BR = require('../lib/br');
let BW = require('../lib/bw');
let Varint = require('../lib/varint');

describe('Varint', function() {

  it('should make a new varint', function() {
    let buf = new Buffer('00', 'hex');
    let varint = new Varint(buf);
    should.exist(varint);
    varint.buf.toString('hex').should.equal('00');
    varint = Varint(buf);
    should.exist(varint);
    varint.buf.toString('hex').should.equal('00');

    //various ways to use the constructor
    Varint(Varint(0).toBuffer()).toNumber().should.equal(0);
    Varint(0).toNumber().should.equal(0);
    Varint(BN(0)).toNumber().should.equal(0);

    //varints can have multiple buffer representations
    Varint(0).toNumber().should.equal(Varint(new Buffer([0xFD, 0, 0])).toNumber())
    Varint(0).toBuffer().toString('hex').should.not.equal(Varint().fromBuffer(new Buffer([0xFD, 0, 0])).toBuffer().toString('hex'))
  });

  describe('#set', function() {
    
    it('should set a buffer', function() {
      let buf = new Buffer('00', 'hex');
      let varint = Varint().set({buf: buf});
      varint.buf.toString('hex').should.equal('00');
      varint.set({});
      varint.buf.toString('hex').should.equal('00');
    });

  });

  describe('#fromJSON', function() {
    
    it('should set a buffer', function() {
      let buf = BW().writeVarintNum(5).concat();
      let varint = Varint().fromJSON(buf.toString('hex'));
      varint.toNumber().should.equal(5);
    });

  });

  describe('#toJSON', function() {
    
    it('should return a buffer', function() {
      let buf = BW().writeVarintNum(5).concat();
      let varint = Varint().fromJSON(buf.toString('hex'));
      varint.toJSON().should.equal('05');
    });

  });

  describe('#fromBuffer', function() {
    
    it('should set a buffer', function() {
      let buf = BW().writeVarintNum(5).concat();
      let varint = Varint().fromBuffer(buf);
      varint.toNumber().should.equal(5);
    });

  });

  describe('#fromBR', function() {
    
    it('should set a buffer reader', function() {
      let buf = BW().writeVarintNum(5).concat();
      let br = BR(buf);
      let varint = Varint().fromBR(br);
      varint.toNumber().should.equal(5);
    });

  });

  describe('#fromBN', function() {
    
    it('should set a number', function() {
      let varint = Varint().fromBN(BN(5));
      varint.toNumber().should.equal(5);
    });

  });

  describe('#fromNumber', function() {
    
    it('should set a number', function() {
      let varint = Varint().fromNumber(5);
      varint.toNumber().should.equal(5);
    });

  });

  describe('#toBuffer', function() {
    
    it('should return a buffer', function() {
      let buf = BW().writeVarintNum(5).concat();
      let varint = Varint(buf);
      varint.toBuffer().toString('hex').should.equal(buf.toString('hex'));
    });

  });

  describe('#toBN', function() {
    
    it('should return a buffer', function() {
      let varint = Varint(5);
      varint.toBN().toString().should.equal(BN(5).toString());
    });

  });

  describe('#toNumber', function() {
    
    it('should return a buffer', function() {
      let varint = Varint(5);
      varint.toNumber().should.equal(5);
    });

  });

});
