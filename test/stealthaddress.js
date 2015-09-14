'use strict';
let StealthAddress = require('../lib/stealthaddress');
let should = require('chai').should();
let StealthKey = require('../lib/stealthkey');
let Keypair = require('../lib/keypair');
let Privkey = require('../lib/privkey');
let Pubkey = require('../lib/pubkey');
let BN = require('../lib/bn');
let Hash = require('../lib/hash');
let Base58check = require('../lib/base58check');

describe('StealthAddress', function () {
  let stealthkey = StealthKey();
  stealthkey.payloadKeypair = Keypair().fromPrivkey(Privkey().fromBN(BN().fromBuffer(Hash.sha256(new Buffer('test 1')))));
  stealthkey.scanKeypair = Keypair().fromPrivkey(Privkey().fromBN(BN().fromBuffer(Hash.sha256(new Buffer('test 2')))));
  let senderKeypair = Keypair().fromPrivkey(Privkey().fromBN(BN().fromBuffer(Hash.sha256(new Buffer('test 3')))));

  let addressString = 'vJmtuUb8ysKiM1HtHQF23FGfjGAKu5sM94UyyjknqhJHNdj5CZzwtpGzeyaATQ2HvuzomNVtiwsTJSWzzCBgCTtUZbRFpzKVq9MAUr';
  let dwhex = '2a0002697763d7e9becb0c180083738c32c05b0e2fee26d6278020c06bbb04d5f66b32010362408459041e0473298af3824dbabe4d2b7f846825ed4d1c2e2c670c07cb275d0100';
  let dwbuf = new Buffer(dwhex, 'hex');

  it('should make a new stealth address', function () {
    let sa = new StealthAddress();
    should.exist(sa);
    sa = StealthAddress();
    should.exist(sa);
    sa = StealthAddress(addressString);
    should.exist(sa);
    sa = StealthAddress(Base58check.decode(addressString));
    should.exist(sa);
  });

  describe('#fromJSON', function () {
    it('should give a stealthkey address with the right pubkeys', function () {
      let sa = new StealthAddress();
      sa.fromJSON(addressString);
      sa.payloadPubkey.toString().should.equal(stealthkey.payloadKeypair.pubkey.toString());
      sa.scanPubkey.toString().should.equal(stealthkey.scanKeypair.pubkey.toString());
    });

  });

  describe('#toJSON', function () {
    it('should return this known address string', function () {
      StealthAddress().fromJSON(addressString).toJSON().should.equal(addressString);
    });

  });

  describe('#fromBuffer', function () {
    it('should parse this DW buffer', function () {
      StealthAddress().fromBuffer(new Buffer(dwhex, 'hex')).toBuffer().toString('hex').should.equal(dwhex);
    });

  });

  describe('#fromString', function () {
    it('should parse this DW buffer', function () {
      StealthAddress().fromString(Base58check(new Buffer(dwhex, 'hex')).toString()).toBuffer().toString('hex').should.equal(dwhex);
    });

  });

  describe('#getSharedKeypair', function () {
    it('should return a key', function () {
      let sa = new StealthAddress();
      sa.payloadPubkey = stealthkey.payloadKeypair.pubkey;
      sa.scanPubkey = stealthkey.scanKeypair.pubkey;
      let key = sa.getSharedKeypair(senderKeypair);(key instanceof Keypair).should.equal(true);
    });

    it('should return the same key as StealthKey.prototype.getSharedKeypair', function () {
      let sa = new StealthAddress();
      sa.payloadPubkey = stealthkey.payloadKeypair.pubkey;
      sa.scanPubkey = stealthkey.scanKeypair.pubkey;
      let key = sa.getSharedKeypair(senderKeypair);

      let key2 = stealthkey.getSharedKeypair(senderKeypair.pubkey);
      key.toString().should.equal(key2.toString());
    });

  });

  describe('#getReceivePubkey', function () {
    it('should return a pubkey', function () {
      let pubkey = StealthAddress().fromStealthKey(stealthkey).getReceivePubkey(senderKeypair);(pubkey instanceof Pubkey).should.equal(true);
    });

    it('should return the same pubkey as getReceivePubkey', function () {
      let pubkey = StealthAddress().fromStealthKey(stealthkey).getReceivePubkey(senderKeypair);
      let pubkey2 = stealthkey.getReceivePubkey(senderKeypair.pubkey);
      pubkey2.toString().should.equal(pubkey.toString());
    });

  });

  describe('#toBuffer', function () {
    it('should return this known address buffer', function () {
      let buf = Base58check.decode(addressString);
      StealthAddress().fromBuffer(dwbuf).toBuffer().toString('hex').should.equal(dwhex);
    });

  });

  describe('#toString', function () {
    it('should return this known address buffer', function () {
      let buf = Base58check.decode(addressString);
      StealthAddress().fromBuffer(buf).toString().should.equal(Base58check(new Buffer(dwhex, 'hex')).toString());
    });

  });

  describe('@parseDWBuffer', function () {
    it('should parse this known DW buffer', function () {
      let buf = new Buffer(dwhex, 'hex');
      let parsed = StealthAddress.parseDWBuffer(buf);
      parsed.version.should.equal(42);
      parsed.options.should.equal(0);
      parsed.scanPubkey.toString().should.equal('02697763d7e9becb0c180083738c32c05b0e2fee26d6278020c06bbb04d5f66b32');
      parsed.nPayloadPubkeys.should.equal(1);
      parsed.payloadPubkeys[0].toString().should.equal('0362408459041e0473298af3824dbabe4d2b7f846825ed4d1c2e2c670c07cb275d');
      parsed.nSigs.should.equal(1);
      parsed.prefix.toString().should.equal('');
    });

  });

});
