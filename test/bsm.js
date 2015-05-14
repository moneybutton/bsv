"use strict";
var Address = require('../lib/address');
var BSM = require('../lib/bsm');
var Keypair = require('../lib/keypair');
var should = require('chai').should();

describe('BSM', function() {
  
  it('should make a new bsm', function() {
    var bsm = new BSM();
    should.exist(bsm);
  });

  it('should make a new bsm when called without "new"', function() {
    var bsm = BSM();
    should.exist(bsm);
  });
  
  describe('#set', function() {

    it('should set the messagebuf', function() {
      var messagebuf = new Buffer('message');
      should.exist(BSM().set({messagebuf: messagebuf}).messagebuf);
    });

  });

  describe('@sign', function() {
    var messagebuf = new Buffer('this is my message');
    var keypair = Keypair().fromRandom();

    it('should return a base64 string', function() {
      var sigstr = BSM.sign(messagebuf, keypair);
      var sigbuf = new Buffer(sigstr, 'base64');
      sigbuf.length.should.equal(1 + 32 + 32);
    });

    it('should sign with a compressed pubkey', function() {
      var keypair = Keypair().fromRandom();
      keypair.pubkey.compressed = true;
      var sigstr = BSM.sign(messagebuf, keypair);
      var sigbuf = new Buffer(sigstr, 'base64');
      sigbuf[0].should.be.above(27 + 4 - 1);
      sigbuf[0].should.be.below(27 + 4 + 4 - 1);
    });

    it('should sign with an uncompressed pubkey', function() {
      var keypair = Keypair().fromRandom();
      keypair.pubkey.compressed = false;
      var sigstr = BSM.sign(messagebuf, keypair);
      var sigbuf = new Buffer(sigstr, 'base64');
      sigbuf[0].should.be.above(27 - 1);
      sigbuf[0].should.be.below(27 + 4 - 1);
    });

  });

  describe('@verify', function() {
    var messagebuf = new Buffer('this is my message');
    var keypair = Keypair().fromRandom();

    it('should verify a signed message', function() {
      var sigstr = BSM.sign(messagebuf, keypair);
      var addr = Address().fromPubkey(keypair.pubkey);
      BSM.verify(messagebuf, sigstr, addr).should.equal(true);
    });

    it('should verify this known good signature', function() {
      var addrstr = '1CKTmxj6DjGrGTfbZzVxnY4Besbv8oxSZb';
      var address = Address().fromString(addrstr);
      var sigstr = 'IOrTlbNBI0QO990xOw4HAjnvRl/1zR+oBMS6HOjJgfJqXp/1EnFrcJly0UcNelqJNIAH4f0abxOZiSpYmenMH4M=';
      BSM.verify(messagebuf, sigstr, address);
    });

  });

  describe('#sign', function() {
    var messagebuf = new Buffer('this is my message');
    var keypair = Keypair().fromRandom();

    it('should sign a message', function() {
      var bsm = new BSM();
      bsm.messagebuf = messagebuf;
      bsm.keypair = keypair;
      bsm.sign();
      var sig = bsm.sig;
      should.exist(sig);
    });

  });

  describe('#verify', function() {
    var messagebuf = new Buffer('this is my message');
    var keypair = Keypair().fromRandom();

    it('should verify a message that was just signed', function() {
      var bsm = new BSM();
      bsm.messagebuf = messagebuf;
      bsm.keypair = keypair;
      bsm.address = Address().fromPubkey(keypair.pubkey);
      bsm.sign();
      bsm.verify();
      bsm.verified.should.equal(true);
    });

  });

});
