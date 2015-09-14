'use strict';
let should = require('chai').should();
let Txoutmap = require('../lib/txoutmap');
let Tx = require('../lib/tx');
let Txout = require('../lib/txout');
let Script = require('../lib/script');
let BN = require('../lib/bn');

describe('Txoutmap', function () {
  let txhashbuf = new Buffer(32);
  txhashbuf.fill(0);
  let label = txhashbuf.toString('hex') + ':' + '0';
  let txout = Txout(BN(0), Script('OP_RETURN'));
  let map = new Map();
  map.set(label, txout);
  let tx = Tx().fromHex('0100000001795b88d47a74e3be0948fc9d1b4737f96097474d57151afa6f77c787961e47cc120000006a47304402202289f9e1ae2ed981cd0bf62f822f6ae4aea40c65c7339d90643cea90de93ad1502205c8a08b3265f9ba7e99057d030d5b91c889a1b99f94a3a5b79d7daaada2409b6012103798b51f980e7a3690af6b43ce3467db75bede190385702c4d9d48c0a735ff4a9ffffffff01c0a83200000000001976a91447b8e62e008f82d95d1f565055a8243cc243d32388ac00000000');

  it('should make a new txoutmap', function () {
    let txoutmap = new Txoutmap();
    txoutmap = Txoutmap();
    txoutmap = Txoutmap({map: map});
    should.exist(txoutmap);
    should.exist(txoutmap.map);
  });

  describe('#fromObject', function () {
    it('should set a map', function () {
      let txoutmap = Txoutmap().fromObject({map: map});
      txoutmap.map.get(label).toHex().should.equal(txout.toHex());
      txoutmap.fromObject({});
      txoutmap.map.get(label).toHex().should.equal(txout.toHex());
    });

  });

  describe('#add', function () {
    it('should add a txout to the txoutmap', function () {
      let txoutmap = Txoutmap().add(txhashbuf, 0, txout);
      should.exist(txoutmap.map.get(label));
    });

  });

  describe('#get', function () {
    it('should get a txout', function () {
      let txoutmap = Txoutmap().fromObject({map: map});
      txoutmap.get(txhashbuf, 0).toHex().should.equal(txout.toHex());
    });

  });

  describe('#addTx', function () {
    it('should add all outputs from a tx', function () {
      let txoutmap = Txoutmap().addTx(tx);
      let txhashbuf = tx.hash();
      let txout = tx.txouts[0];
      txoutmap.get(txhashbuf, 0).toHex().should.equal(txout.toHex());
    });

  });

});
