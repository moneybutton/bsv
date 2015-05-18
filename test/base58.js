"use strict";
let Base58 = require('../lib/base58');
let should = require('chai').should();

describe('Base58', function() {
  let buf = new Buffer([0, 1, 2, 3, 253, 254, 255]);
  let enc = "1W7N4RuG";

  it('should make an instance with "new"', function() {
    let b58 = new Base58();
    should.exist(b58);
  });

  it('should make an instance without "new"', function() {
    let b58 = Base58();
    should.exist(b58);
  });

  it('should allow this handy syntax', function() {
    Base58(buf).toString().should.equal(enc);
    Base58(enc).toBuffer().toString('hex').should.equal(buf.toString('hex'))
  });

  describe('#set', function() {
    
    it('should set a blank buffer', function() {
      Base58().fromObject({buf: new Buffer([])});
    });

  });

  describe('@encode', function() {

    it('should encode the buffer accurately', function() {
      Base58.encode(buf).should.equal(enc);
    });

    it('should throw an error when the Input is not a buffer', function() {
      (function() {
        Base58.encode("string")
      }).should.throw('Input should be a buffer');
    });

  });

  describe('@decode', function() {

    it('should decode this encoded value correctly', function() {
      Base58.decode(enc).toString('hex').should.equal(buf.toString('hex'));
      Buffer.isBuffer(Base58.decode(enc)).should.equal(true);
    });

    it('should throw an error when Input is not a string', function() {
      (function() {
        Base58.decode(5);
      }).should.throw('Input should be a string');
    });

  });

  describe('#fromHex', function() {
    
    it('should set buffer', function() {
      let b58 = Base58().fromHex(buf.toString('hex'));
      b58.buf.toString('hex').should.equal(buf.toString('hex'));
    });

  });

  describe('#fromBuffer', function() {
    
    it('should not fail', function() {
      should.exist(Base58().fromBuffer(buf));
    });

    it('should set buffer', function() {
      let b58 = Base58().fromBuffer(buf);
      b58.buf.toString('hex').should.equal(buf.toString('hex'));
    });

  });

  describe('#fromString', function() {

    it('should convert this known string to a buffer', function() {
      Base58().fromString(enc).toBuffer().toString('hex').should.equal(buf.toString('hex'));
    });

  });

  describe('#toHex', function() {

    it('should return the buffer in hex', function() {
      let b58 = Base58({buf: buf});
      b58.toHex().should.equal(buf.toString('hex'));
    });

  });

  describe('#toBuffer', function() {

    it('should return the buffer', function() {
      let b58 = Base58({buf: buf});
      b58.toBuffer().toString('hex').should.equal(buf.toString('hex'));
    });

  });

  describe('#toString', function() {

    it('should return the buffer', function() {
      let b58 = Base58({buf: buf});
      b58.toString().should.equal(enc);
    });

  });

});
