"use strict";
let Address = require('../lib/address');
let BSM = require('../lib/bsm');
let Keypair = require('../lib/keypair');
let should = require('chai').should();

describe('BSM', function() {
  
  it('should make a new bsm', function() {
    let bsm = new BSM();
    should.exist(bsm);
  });

  it('should make a new bsm when called without "new"', function() {
    let bsm = BSM();
    should.exist(bsm);
  });
  
  describe('#fromObject', function() {

    it('should set the messagebuf', function() {
      let messagebuf = new Buffer('message');
      should.exist(BSM().fromObject({messagebuf: messagebuf}).messagebuf);
    });

  });

  describe('@sign', function() {
    let messagebuf = new Buffer('this is my message');
    let keypair = Keypair().fromRandom();

    it('should return a base64 string', function() {
      let sigstr = BSM.sign(messagebuf, keypair);
      let sigbuf = new Buffer(sigstr, 'base64');
      sigbuf.length.should.equal(1 + 32 + 32);
    });

    it('should sign with a compressed pubkey', function() {
      let keypair = Keypair().fromRandom();
      keypair.pubkey.compressed = true;
      let sigstr = BSM.sign(messagebuf, keypair);
      let sigbuf = new Buffer(sigstr, 'base64');
      sigbuf[0].should.be.above(27 + 4 - 1);
      sigbuf[0].should.be.below(27 + 4 + 4 - 1);
    });

    it('should sign with an uncompressed pubkey', function() {
      let keypair = Keypair().fromRandom();
      keypair.pubkey.compressed = false;
      let sigstr = BSM.sign(messagebuf, keypair);
      let sigbuf = new Buffer(sigstr, 'base64');
      sigbuf[0].should.be.above(27 - 1);
      sigbuf[0].should.be.below(27 + 4 - 1);
    });

  });

  describe('@verify', function() {
    let messagebuf = new Buffer('this is my message');
    let keypair = Keypair().fromRandom();

    it('should verify a signed message', function() {
      let sigstr = BSM.sign(messagebuf, keypair);
      let addr = Address().fromPubkey(keypair.pubkey);
      BSM.verify(messagebuf, sigstr, addr).should.equal(true);
    });

    it('should verify this known good signature', function() {
      let addrstr = '1CKTmxj6DjGrGTfbZzVxnY4Besbv8oxSZb';
      let address = Address().fromString(addrstr);
      let sigstr = 'IOrTlbNBI0QO990xOw4HAjnvRl/1zR+oBMS6HOjJgfJqXp/1EnFrcJly0UcNelqJNIAH4f0abxOZiSpYmenMH4M=';
      BSM.verify(messagebuf, sigstr, address);
    });

  });

  describe('#sign', function() {
    let messagebuf = new Buffer('this is my message');
    let keypair = Keypair().fromRandom();

    it('should sign a message', function() {
      let bsm = new BSM();
      bsm.messagebuf = messagebuf;
      bsm.keypair = keypair;
      bsm.sign();
      let sig = bsm.sig;
      should.exist(sig);
    });

  });

  describe('#verify', function() {
    let messagebuf = new Buffer('this is my message');
    let keypair = Keypair().fromRandom();

    it('should verify a message that was just signed', function() {
      let bsm = new BSM();
      bsm.messagebuf = messagebuf;
      bsm.keypair = keypair;
      bsm.address = Address().fromPubkey(keypair.pubkey);
      bsm.sign();
      bsm.verify();
      bsm.verified.should.equal(true);
    });

  });

});
