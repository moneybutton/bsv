'use strict';
let should = require('chai').should();
let Txout = require('../lib/txout');
let StealthKey = require('../lib/stealthkey');
let StealthTx = require('../lib/stealthtx');
let Tx = require('../lib/tx');
let Varint = require('../lib/varint');

describe('StealthTx', function () {
  let txhex = '0100000001c828ccce36eca04f96321ad488528af86c7598e67157c4f8e2f462a9e0e3af5f010000006a47304402204525eef6a56cc57fb184e53efdfdc1086d5265da21480d55c2184536440a64f70220349cdc6c66a8507dde0d172fe64aeb57ae56e014b50315f615086a6b85c5424e012102c0633ddb6bf2a8686e2ba4ce8026c94e1e27ef12e73f8fed6d6d2b97199f9b74ffffffff020000000000000000286a2606deadbeef0365b5a5b0ba059666e907b0b5e07b37fdb162d1399ed829315491fe1f30c87b3f905f0100000000001976a9142042d5e7ef9e82346419fbfe7df5ae52fe4bea3c88ac00000000';
  let txbuf = new Buffer(txhex, 'hex');
  let txidhex = '66da969fff214c329e27062beaf3baf20ed035801559b31f3e868c2de4cdfc5b';
  let tx = Tx(txbuf);

  it('should make a new StealthTx', function () {
    let stx = new StealthTx();
    should.exist(stx);
    stx = StealthTx();
    should.exist(stx);
  });

  describe('#isForMe', function () {
    it('should return false for this known tx and random stealthkey', function () {
      let sk = StealthKey().fromRandom();
      let stx = StealthTx().fromObject({sk: sk, tx: tx});
      stx.isForMe().should.equal(false);
    });

  });

  describe('#notMine', function () {
    it('should return true for this known tx and random stealthkey', function () {
      let sk = StealthKey().fromRandom();
      let stx = StealthTx().fromObject({sk: sk, tx: tx});
      stx.notMine().should.equal('StealthTx not mine');
    });

  });

  describe('#notStealth', function () {
    it('should know this is a stealth tx', function () {
      let stx = StealthTx().fromObject({tx: tx});
      stx.notStealth().should.equal(false);
    });

    it('should know this is not a stealth tx', function () {
      let tx2 = Tx(tx);
      tx2.txouts.pop();
      tx2.txoutsvi = Varint(1);
      let stx = StealthTx().fromObject({tx: tx2});
      stx.notStealth().should.equal('Not enough txouts');
    });

  });

  describe('@parseOpReturnData', function () {
    let txout = tx.txouts[0];
    let buf = txout.script.chunks[1].buf;
    let parsed = StealthTx.parseOpReturnData(buf);(typeof parsed.version).should.equal('number');
    parsed.noncebuf.length.should.be.above(0);
    parsed.pubkey.toBuffer().length.should.equal(33);
  });

});
