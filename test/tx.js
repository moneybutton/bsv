"use strict";
var Varint = require('../lib/varint');
var Tx = require('../lib/tx');
var Txin = require('../lib/txin');
var Txout = require('../lib/txout');
var should = require('chai').should();
var BR = require('../lib/br');
var BW = require('../lib/bw');
var Script = require('../lib/script');
var Sig = require('../lib/sig');
var Keypair = require('../lib/keypair');
var vectors_sighash = require('./vectors/bitcoind/sighash');
var vectors_tx_valid = require('./vectors/bitcoind/tx_valid');
var vectors_tx_invalid = require('./vectors/bitcoind/tx_invalid');

describe('Tx', function() {

  var txin = Txin().fromBuffer(new Buffer('00000000000000000000000000000000000000000000000000000000000000000000000001ae00000000', 'hex'));
  var txout = Txout().fromBuffer(new Buffer('050000000000000001ae', 'hex'));
  var tx = Tx().set({
    version: 0,
    txinsvi: Varint(1),
    txins: [txin],
    txoutsvi: Varint(1),
    txouts: [txout],
    nlocktime: 0
  });
  var txhex = '000000000100000000000000000000000000000000000000000000000000000000000000000000000001ae0000000001050000000000000001ae00000000';
  var txbuf = new Buffer(txhex, 'hex');

  var tx2idhex = '8c9aa966d35bfeaf031409e0001b90ccdafd8d859799eb945a3c515b8260bcf2';
  var tx2hex = '01000000029e8d016a7b0dc49a325922d05da1f916d1e4d4f0cb840c9727f3d22ce8d1363f000000008c493046022100e9318720bee5425378b4763b0427158b1051eec8b08442ce3fbfbf7b30202a44022100d4172239ebd701dae2fbaaccd9f038e7ca166707333427e3fb2a2865b19a7f27014104510c67f46d2cbb29476d1f0b794be4cb549ea59ab9cc1e731969a7bf5be95f7ad5e7f904e5ccf50a9dc1714df00fbeb794aa27aaff33260c1032d931a75c56f2ffffffffa3195e7a1ab665473ff717814f6881485dc8759bebe97e31c301ffe7933a656f020000008b48304502201c282f35f3e02a1f32d2089265ad4b561f07ea3c288169dedcf2f785e6065efa022100e8db18aadacb382eed13ee04708f00ba0a9c40e3b21cf91da8859d0f7d99e0c50141042b409e1ebbb43875be5edde9c452c82c01e3903d38fa4fd89f3887a52cb8aea9dc8aec7e2c9d5b3609c03eb16259a2537135a1bf0f9c5fbbcbdbaf83ba402442ffffffff02206b1000000000001976a91420bb5c3bfaef0231dc05190e7f1c8e22e098991e88acf0ca0100000000001976a9149e3e2d23973a04ec1b02be97c30ab9f2f27c3b2c88ac00000000';
  var tx2buf = new Buffer(tx2hex, 'hex');

  it('should make a new transaction', function() {
    var tx = new Tx();
    should.exist(tx);
    tx = Tx();
    should.exist(tx);

    Tx(txbuf).toBuffer().toString('hex').should.equal(txhex);
    
    //should set known defaults
    tx.version.should.equal(1);
    tx.txinsvi.toNumber().should.equal(0);
    tx.txins.length.should.equal(0);
    tx.txoutsvi.toNumber().should.equal(0);
    tx.txouts.length.should.equal(0);
    tx.nlocktime.should.equal(0);
  });

  describe('#initialize', function() {
    
    it('should set these known defaults', function() {
      var tx = new Tx();
      tx.initialize();
      tx.version.should.equal(1);
      tx.txinsvi.toNumber().should.equal(0);
      tx.txins.length.should.equal(0);
      tx.txoutsvi.toNumber().should.equal(0);
      tx.txouts.length.should.equal(0);
      tx.nlocktime.should.equal(0);
    });

  });

  describe('#set', function() {

    it('should set all the basic parameters', function() {
      var tx = Tx().set({
        version: 0,
        txinsvi: Varint(1),
        txins: [txin],
        txoutsvi: Varint(1),
        txouts: [txout],
        nlocktime: 0
      });
      should.exist(tx.version);
      should.exist(tx.txinsvi);
      should.exist(tx.txins);
      should.exist(tx.txoutsvi);
      should.exist(tx.txouts);
      should.exist(tx.nlocktime);
    });

  });

  describe('#fromJSON', function() {

    it('should set all the basic parameters', function() {
      var tx = Tx().fromJSON({
        version: 0,
        txinsvi: Varint(1).toJSON(),
        txins: [txin.toJSON()],
        txoutsvi: Varint(1).toJSON(),
        txouts: [txout.toJSON()],
        nlocktime: 0
      });
      should.exist(tx.version);
      should.exist(tx.txinsvi);
      should.exist(tx.txins);
      should.exist(tx.txoutsvi);
      should.exist(tx.txouts);
      should.exist(tx.nlocktime);
    });

  });

  describe('#toJSON', function() {

    it('should recover all the basic parameters', function() {
      var json = tx.toJSON();
      should.exist(json.version);
      should.exist(json.txinsvi);
      should.exist(json.txins);
      should.exist(json.txoutsvi);
      should.exist(json.txouts);
      should.exist(json.nlocktime);
    });

  });

  describe('#fromHex', function() {
    
    it('should recover from this known tx', function() {
      Tx().fromHex(txhex).toHex().should.equal(txhex);
    });

    it('should recover from this known tx from the blockchain', function() {
      Tx().fromHex(tx2hex).toHex().should.equal(tx2hex);
    });

  });

  describe('#fromBuffer', function() {
    
    it('should recover from this known tx', function() {
      Tx().fromBuffer(txbuf).toBuffer().toString('hex').should.equal(txhex);
    });

    it('should recover from this known tx from the blockchain', function() {
      Tx().fromBuffer(tx2buf).toBuffer().toString('hex').should.equal(tx2hex);
    });

  });

  describe('#fromBR', function() {
    
    it('should recover from this known tx', function() {
      Tx().fromBR(BR(txbuf)).toBuffer().toString('hex').should.equal(txhex);
    });

  });

  describe('#toHex', function() {
    
    it('should produce this known tx', function() {
      Tx().fromHex(txhex).toHex().should.equal(txhex);
    });

  });

  describe('#toBuffer', function() {
    
    it('should produce this known tx', function() {
      Tx().fromBuffer(txbuf).toBuffer().toString('hex').should.equal(txhex);
    });

  });

  describe('#toBW', function() {
    
    it('should produce this known tx', function() {
      Tx().fromBuffer(txbuf).toBW().concat().toString('hex').should.equal(txhex);
    });

  });

  describe('#sighash', function() {

    it('should hash this transaction', function() {
      tx.sighash(0, 0, Script('')).length.should.equal(32);
    });

    it('should return 1 for the SIGHASH_SINGLE bug', function() {
      var tx = Tx(tx2buf);
      tx.txouts.length = 1;
      tx.txoutsvi = Varint(1);
      tx.sighash(Sig.SIGHASH_SINGLE, 1, Script('')).toString('hex').should.equal('0000000000000000000000000000000000000000000000000000000000000001');
    });

  });

  describe('#sign', function() {

    it('should return a signature', function() {
      var keypair = Keypair().fromRandom();
      var sig1 = tx.sign(keypair, Sig.SIGHASH_ALL, 0, Script(''));
      should.exist(sig1);
      var sig2 = tx.sign(keypair, Sig.SIGHASH_SINGLE, 0, Script(''));
      var sig3 = tx.sign(keypair, Sig.SIGHASH_ALL, 0, Script('OP_RETURN'));
      sig1.toString(should.not.equal(sig2.toString()));
      sig1.toString(should.not.equal(sig3.toString()));
    });

  });

  describe('#verify', function() {

    it('should return a signature', function() {
      var keypair = Keypair().fromRandom();
      var sig1 = tx.sign(keypair, Sig.SIGHASH_ALL, 0, Script(''));
      tx.verify(sig1, keypair.pubkey, 0, Script('')).should.equal(true);
    });

  });

  describe('#hash', function() {

    it('should correctly calculate the hash of this known transaction', function() {
      var tx = Tx().fromBuffer(tx2buf);
      var txhashbuf = new Buffer(Array.apply([], new Buffer(tx2idhex, 'hex')).reverse());
      tx.hash().toString('hex').should.equal(txhashbuf.toString('hex'));
    });

  });

  describe('#id', function() {

    it('should correctly calculate the id of this known transaction', function() {
      var tx = Tx().fromBuffer(tx2buf);
      tx.id().toString('hex').should.equal(tx2idhex);
    });

  });

  describe('#addTxin', function() {
    
    it('should add an input', function() {
      var txin = Txin();
      var tx = Tx();
      tx.txinsvi.toNumber().should.equal(0);
      tx.addTxin(txin);
      tx.txinsvi.toNumber().should.equal(1);
      tx.txins.length.should.equal(1);
    });

  });

  describe('#addTxout', function() {
    
    it('should add an output', function() {
      var txout = Txout();
      var tx = Tx();
      tx.txoutsvi.toNumber().should.equal(0);
      tx.addTxout(txout);
      tx.txoutsvi.toNumber().should.equal(1);
      tx.txouts.length.should.equal(1);
    });

  });

  describe('vectors', function() {

    vectors_sighash.forEach(function(vector, i) {
      if (i === 0)
        return;
      it('should pass sighash test vector ' + i, function() {
        var txbuf = new Buffer(vector[0], 'hex');
        var scriptbuf = new Buffer(vector[1], 'hex');
        var subscript = Script(scriptbuf);
        var nin = vector[2];
        var nhashtype = vector[3];
        var sighashbuf = new Buffer(vector[4], 'hex');
        var tx = Tx().fromBuffer(txbuf);

        //make sure transacion to/from buffer is isomorphic
        tx.toBuffer().toString('hex').should.equal(txbuf.toString('hex'));

        //sighash ought to be correct
        tx.sighash(nhashtype, nin, subscript).toString('hex').should.equal(sighashbuf.toString('hex'))
      });
    });
    
    var j = 0;
    vectors_tx_valid.forEach(function(vector, i) {
      if (vector.length === 1)
        return;
      it('should correctly serialized/deserialize tx_valid test vector ' + j, function() {
        var txhex = vector[1];
        var txbuf = new Buffer(vector[1], 'hex');
        var tx = Tx(txbuf);
        tx.toBuffer().toString('hex').should.equal(txhex);
      });
      j++;
    });

    var j = 0;
    vectors_tx_invalid.forEach(function(vector, i) {
      if (vector.length === 1)
        return;
      it('should correctly serialized/deserialize tx_invalid test vector ' + j, function() {
        var txhex = vector[1];
        var txbuf = new Buffer(vector[1], 'hex');
        var tx = Tx(txbuf);
        tx.toBuffer().toString('hex').should.equal(txhex);
      });
      j++;
    });

  });

});
