"use strict";
let should = require('chai').should();
let StealthKey = require('../lib/stealthkey');
let Keypair = require('../lib/keypair');
let Privkey = require('../lib/privkey');
let Pubkey = require('../lib/pubkey');
let BN = require('../lib/bn');
let Hash = require('../lib/hash');

describe('StealthKey', function() {
  
  let stealthkey = StealthKey();
  stealthkey.payloadKeypair = Keypair().fromPrivkey(Privkey().fromBN(BN().fromBuffer(Hash.sha256(new Buffer('test 1')))));
  stealthkey.scanKeypair = Keypair().fromPrivkey(Privkey().fromBN(BN().fromBuffer(Hash.sha256(new Buffer('test 2')))));
  let senderKeypair = Keypair().fromPrivkey(Privkey().fromBN(BN().fromBuffer(Hash.sha256(new Buffer('test 3')))));

  it('should create a new stealthkey', function() {
    let stealthkey = new StealthKey();
    should.exist(stealthkey);
  });

  it('should create a new stealthkey without using "new"', function() {
    let stealthkey = StealthKey();
    should.exist(stealthkey);
  });

  it('should create a new stealthkey with both keypairs in the constructor', function() {
    let keypair1 = Keypair();
    let keypair2 = Keypair();
    let stealthkey = StealthKey(keypair1, keypair2);
    should.exist(stealthkey.payloadKeypair);
    should.exist(stealthkey.scanKeypair);
  });

  describe('#set', function() {

    it('should set payload key', function() {
      should.exist(StealthKey().fromObject({payloadKeypair: stealthkey.payloadKeypair}).payloadKeypair);
    });

  });

  describe('#fromJSON', function() {
    
    it('should make a stealthkey from this JSON', function() {
      let sk = StealthKey().fromJSON({
        payloadKeypair: stealthkey.payloadKeypair.toJSON(),
        scanKeypair: stealthkey.scanKeypair.toJSON()
      });
      sk.payloadKeypair.toString().should.equal(stealthkey.payloadKeypair.toString());
      sk.scanKeypair.toString().should.equal(stealthkey.scanKeypair.toString());
    });

  });

  describe('#toJSON', function() {
    
    it('should convert this stealthkey to json', function() {
      let json = stealthkey.toJSON()
      let json2 = StealthKey().fromJSON(json).toJSON();
      json.payloadKeypair.privkey.should.equal(json2.payloadKeypair.privkey);
      json.scanKeypair.privkey.should.equal(json2.scanKeypair.privkey);
    });

  });

  describe('#fromRandom', function() {

    it('should create a new stealthkey from random', function() {
      let stealthkey = StealthKey().fromRandom();
      should.exist(stealthkey.payloadKeypair.privkey.bn.gt(0));
      should.exist(stealthkey.scanKeypair.privkey.bn.gt(0));
    });

  });

  describe('#getSharedKeypair', function() {

    it('should return a key', function() {
      let key = stealthkey.getSharedKeypair(senderKeypair.pubkey);
      (key instanceof Keypair).should.equal(true);
    });

  });

  describe('#getReceivePubkey', function() {
    
    it('should return a pubkey', function() {
      let pubkey = stealthkey.getReceivePubkey(senderKeypair.pubkey);
      (pubkey instanceof Pubkey).should.equal(true);
    });

  });

  describe('#getReceiveKeypair', function() {

    it('should return a key', function() {
      let key = stealthkey.getReceiveKeypair(senderKeypair.pubkey);
      (key instanceof Keypair).should.equal(true);
    });

    it('should return a key with the same pubkey as getReceivePubkey', function() {
      let key = stealthkey.getReceiveKeypair(senderKeypair.pubkey);
      let pubkey = stealthkey.getReceivePubkey(senderKeypair.pubkey);
      key.pubkey.toString().should.equal(pubkey.toString());
    });

    it('should return private key with length 32 or less', function() {
      let key = stealthkey.getReceiveKeypair(senderKeypair.pubkey);
      key.privkey.bn.toBuffer().length.should.be.below(33);
    });

  });

  describe('#isForMe', function() {

    it('should return true if it (the transaction or message) is for me', function() {
      let pubkeyhash = new Buffer('3cb64fa6ee9b3e8754e3e2bd033bf61048604a99', 'hex');
      stealthkey.isForMe(senderKeypair.pubkey, pubkeyhash).should.equal(true);
    });

    it('should return false if it (the transaction or message) is not for me', function() {
      let pubkeyhash = new Buffer('00b64fa6ee9b3e8754e3e2bd033bf61048604a99', 'hex');
      stealthkey.isForMe(senderKeypair.pubkey, pubkeyhash).should.equal(false);
    });

  });

});
