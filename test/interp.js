"use strict";
var should = require('chai').should();
var Interp = require('../lib/interp');
var Tx = require('../lib/tx');
var Txin = require('../lib/txin');
var Txout = require('../lib/txout');
var Script = require('../lib/script');
var BN = require('../lib/bn');
var Keypair = require('../lib/keypair');
var Privkey = require('../lib/privkey');
var Pubkey = require('../lib/pubkey');
var Sig = require('../lib/sig');
var BR = require('../lib/br');
var script_valid = require('./vectors/bitcoind/script_valid');
var script_invalid = require('./vectors/bitcoind/script_invalid');

describe('Interp', function() {

  it('should make a new interp', function() {
    var interp = new Interp();
    (interp instanceof Interp).should.equal(true);
    interp.stack.length.should.equal(0);
    interp.altstack.length.should.equal(0);
    interp.pc.should.equal(0);
    interp.pbegincodehash.should.equal(0);
    interp.nOpCount.should.equal(0);
    interp.ifstack.length.should.equal(0);
    interp.errstr.should.equal("");
    interp.flags.should.equal(0);
    var interp = Interp();
    (interp instanceof Interp).should.equal(true);
    interp.stack.length.should.equal(0);
    interp.altstack.length.should.equal(0);
    interp.pc.should.equal(0);
    interp.pbegincodehash.should.equal(0);
    interp.nOpCount.should.equal(0);
    interp.ifstack.length.should.equal(0);
    interp.errstr.should.equal("");
    interp.flags.should.equal(0);
  });

  describe('#toJSON', function() {
    
    it('should convert an interp to json', function() {
      var interp = Interp().set({script: Script()});
      var json = interp.toJSON();
      should.exist(json.script);
      should.not.exist(json.tx);
    });

  });

  describe('#fromJSON', function() {
    
    it('should convert a json to an interp', function() {
      var interp = Interp().set({script: Script()});
      var json = interp.toJSON();
      var interp2 = Interp().fromJSON(json);
      should.exist(interp2.script);
    });

  });

  describe('@castToBool', function() {

    it('should cast these bufs to bool correctly', function() {
      Interp.castToBool(BN(0).toSM({endian: 'little'})).should.equal(false);
      Interp.castToBool(new Buffer('0080', 'hex')).should.equal(false); //negative 0
      Interp.castToBool(BN(1).toSM({endian: 'little'})).should.equal(true);
      Interp.castToBool(BN(-1).toSM({endian: 'little'})).should.equal(true);

      var buf = new Buffer('00', 'hex');
      var bool = BN().fromSM(buf, {endian: 'little'}).cmp(0) !== 0;
      Interp.castToBool(buf).should.equal(bool);
    });

  });

  describe('#verify', function() {

    it('should verify or unverify these trivial scripts from script_valid.json', function() {
      var verified = Interp().verify(Script('OP_1'), Script('OP_1'), Tx(), 0);
      verified.should.equal(true);
      var verified = Interp().verify(Script('OP_1'), Script('OP_0'), Tx(), 0);
      verified.should.equal(false);
      var verified = Interp().verify(Script('OP_0'), Script('OP_1'), Tx(), 0);
      verified.should.equal(true);
      var verified = Interp().verify(Script('OP_CODESEPARATOR'), Script('OP_1'), Tx(), 0);
      verified.should.equal(true);
      var verified = Interp().verify(Script(''), Script('OP_DEPTH OP_0 OP_EQUAL'), Tx(), 0);
      verified.should.equal(true);
      var verified = Interp().verify(Script('OP_1 OP_2'), Script('OP_2 OP_EQUALVERIFY OP_1 OP_EQUAL'), Tx(), 0);
      verified.should.equal(true);
      var verified = Interp().verify(Script('9 0x000000000000000010'), Script(''), Tx(), 0);
      verified.should.equal(true);
      var verified = Interp().verify(Script('OP_1'), Script('OP_15 OP_ADD OP_16 OP_EQUAL'), Tx(), 0);
      verified.should.equal(true);
      var verified = Interp().verify(Script('OP_0'), Script('OP_IF OP_VER OP_ELSE OP_1 OP_ENDIF'), Tx(), 0);
      verified.should.equal(true);
    });

    it('should verify this new pay-to-pubkey script', function() {
      var keypair = Keypair().fromRandom();
      var scriptPubkey = Script().writeBuffer(keypair.pubkey.toDER(true)).writeOp('OP_CHECKSIG');

      var hashbuf = new Buffer(32);
      hashbuf.fill(0);
      var credtx = Tx();
      credtx.addTxin(hashbuf, 0xffffffff, Script('OP_0 OP_0'), 0xffffffff);
      credtx.addTxout(BN(0), scriptPubkey);

      var idbuf = credtx.hash();
      var spendtx = Tx();
      spendtx.addTxin(idbuf, 0, Script(), 0xffffffff);
      spendtx.addTxout(BN(0), Script());

      var sig = spendtx.sign(keypair, Sig.SIGHASH_ALL, 0, scriptPubkey);
      var scriptSig = Script().writeBuffer(sig.toTxFormat());
      spendtx.txins[0].setScript(scriptSig);

      var interp = Interp();
      var verified = interp.verify(scriptSig, scriptPubkey, spendtx, 0);
      verified.should.equal(true);
    });

    it('should verify this pay-to-pubkey script from script_valid.json', function() {
      var scriptSig = Script().fromBitcoindString("0x47 0x3044022007415aa37ce7eaa6146001ac8bdefca0ddcba0e37c5dc08c4ac99392124ebac802207d382307fd53f65778b07b9c63b6e196edeadf0be719130c5db21ff1e700d67501");
      var scriptPubkey = Script().fromBitcoindString("0x41 0x0479be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8 CHECKSIG");

      var hashbuf = new Buffer(32);
      hashbuf.fill(0);
      var credtx = Tx();
      credtx.addTxin(hashbuf, 0xffffffff, Script('OP_0 OP_0'), 0xffffffff);
      credtx.addTxout(BN(0), scriptPubkey);

      var idbuf = credtx.hash();
      var spendtx = Tx();
      spendtx.addTxin(idbuf, 0, scriptSig, 0xffffffff);
      spendtx.addTxout(BN(0), Script());

      var interp = Interp();
      var verified = interp.verify(scriptSig, scriptPubkey, spendtx, 0, 0);
      verified.should.equal(true);
    });

  });

  describe('vectors', function() {

    var c = 0;
    script_valid.forEach(function(vector, i) {
      if (vector.length === 1)
        return;
      c++;
      it('should verify script_valid vector ' + c, function() {
        var scriptSig = Script().fromBitcoindString(vector[0]);
        var scriptPubkey = Script().fromBitcoindString(vector[1]);
        var flags = Interp.getFlags(vector[2]);
        var descstr = vector[3];

        var hashbuf = new Buffer(32);
        hashbuf.fill(0);
        var credtx = Tx();
        credtx.addTxin(hashbuf, 0xffffffff, Script('OP_0 OP_0'), 0xffffffff);
        credtx.addTxout(BN(0), scriptPubkey);

        var idbuf = credtx.hash();
        var spendtx = Tx();
        spendtx.addTxin(idbuf, 0, scriptSig, 0xffffffff);
        spendtx.addTxout(BN(0), Script());

        var interp = Interp();
        var verified = interp.verify(scriptSig, scriptPubkey, spendtx, 0, flags);
        verified.should.equal(true);
      });
    });

    var c = 0;
    script_invalid.forEach(function(vector, i) {
      if (vector.length === 1)
        return;
      c++;
      it('should unverify script_invalid vector ' + c, function() {
        var scriptSig = Script().fromBitcoindString(vector[0]);
        var scriptPubkey = Script().fromBitcoindString(vector[1]);
        var flags = Interp.getFlags(vector[2]);
        var descstr = vector[3];

        var hashbuf = new Buffer(32);
        hashbuf.fill(0);
        var credtx = Tx();
        credtx.addTxin(hashbuf, 0xffffffff, Script('OP_0 OP_0'), 0xffffffff);
        credtx.addTxout(BN(0), scriptPubkey);

        var idbuf = credtx.hash();
        var spendtx = Tx();
        spendtx.addTxin(idbuf, 0, scriptSig, 0xffffffff);
        spendtx.addTxout(BN(0), Script());

        var interp = Interp();
        var verified = interp.verify(scriptSig, scriptPubkey, spendtx, 0, flags);
        verified.should.equal(false);
      });
    });

  });

});
