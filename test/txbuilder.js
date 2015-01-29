var should = require('chai').should();
var Txbuilder = require('../lib/txbuilder');
var Tx = require('../lib/tx');
var Txout = require('../lib/txout');
var Address = require('../lib/address');
var BN = require('../lib/bn');
var Interp = require('../lib/interp');
var BR = require('../lib/br');
var Script = require('../lib/script');
var Pubkey = require('../lib/pubkey');
var Privkey = require('../lib/privkey');
var Keypair = require('../lib/keypair');
var tx_valid = require('./vectors/bitcoind/tx_valid');
var tx_invalid = require('./vectors/bitcoind/tx_invalid');

describe('Txbuilder', function() {
  
  it('should make a new txbuilder', function() {
    var txb = new Txbuilder();
    (txb instanceof Txbuilder).should.equal(true);
    should.exist(txb.tx);
    txb = Txbuilder();
    (txb instanceof Txbuilder).should.equal(true);
    should.exist(txb.tx);
    txb = Txbuilder({
      tx: Tx()
    });
    should.exist(txb.tx);
  });

  it('should make a new tx following this API', function() {
    var txb = new Txbuilder();

    // make change address
    var privkey = Privkey().fromBN(BN(1));
    var keypair = Keypair().fromPrivkey(privkey);
    var changeaddr = Address().fromPubkey(keypair.pubkey);

    // make addresses to send from
    var privkey1 = Privkey().fromBN(BN(2));
    var keypair1 = Keypair().fromPrivkey(privkey1);
    var addr1 = Address().fromPubkey(keypair1.pubkey);

    var privkey2 = Privkey().fromBN(BN(3));
    var keypair2 = Keypair().fromPrivkey(privkey2);
    var addr2 = Address().fromPubkey(keypair2.pubkey);

    // make addresses to send to
    var saddr1 = addr1;
    var saddr2 = Address().fromScript(Script().fromString('OP_RETURN')); // fake, unredeemable p2sh address

    // txouts that we are spending
    var scriptout1 = Script().fromString('OP_DUP OP_HASH160 20 0x' + addr1.hashbuf.toString('hex') + ' OP_EQUALVERIFY OP_CHECKSIG');
    var scriptout2 = Script().fromString('OP_DUP OP_HASH160 20 0x' + addr2.hashbuf.toString('hex') + ' OP_EQUALVERIFY OP_CHECKSIG');
    var txout1 = Txout(BN(1e8), scriptout1);
    var txout2 = Txout(BN(1e8 + 0.001e8), scriptout2); // contains extra that we will use for the fee

    var utxoutmap = {
      // pubkeyhash ("normal" output)
      '0000000000000000000000000000000000000000000000000000000000000000:0': {txout: txout1, pubkey: keypair1.pubkey},
      '0100000000000000000000000000000000000000000000000000000000000000:0': {txout: txout2, pubkey: keypair2.pubkey}

      // p2sh multisig
      //'0000000000000000000000000000000000000000000000000000000000000000:1': {txout: Txout(), redeemScript: Script()}
    };

    txb.set({
      utxoutmap: utxoutmap,
      changeaddr: changeaddr,
      feebn: BN(0.001e8)
    });

    txb.addTo(BN(1e8), saddr1); // pubkeyhash address
    txb.addTo(BN(1e8), saddr2); // p2sh address

    txb.build();
    txb.sign(0, keypair1);
    txb.sign(1, keypair2);

    txb.verifytx(Interp.SCRIPT_VERIFY_P2SH).should.equal(true);
  });

  describe('#addTo', function() {
    
    it('should add a scripthash address', function() {
      var hashbuf = new Buffer(20);
      hashbuf.fill(0);
      var address = Address().fromScript(Script().fromScripthash(hashbuf));
      var txb = Txbuilder();
      txb.addTo(BN(0), address);
      txb.toTxouts.length.should.equal(1);
    });

    it('should add a pubkeyhash address', function() {
      var pubkey = Pubkey().fromPrivkey(Privkey().fromRandom());
      var address = Address().fromPubkey(pubkey);
      var txb = Txbuilder();
      txb.addTo(BN(0), address);
      txb.toTxouts.length.should.equal(1);
    });

  });

  describe('vectors', function() {

    var c = 0;
    tx_valid.forEach(function(vector, i) {
      if (vector.length === 1)
        return;
      c++;
      it('should verify tx_valid vector ' + c, function() {
        var inputs = vector[0];
        var txhex = vector[1];
        var flags = Interp.getFlags(vector[2]);

        var map = {};
        inputs.forEach(function(input) {
          var txoutnum = input[1];
          if (txoutnum === -1)
            txoutnum = 0xffffffff; //bitcoind casts -1 to an unsigned int
          map[input[0] + ":" + txoutnum] = {txout: Txout().setScript(Script().fromBitcoindString(input[2]))};
        });

        var tx = Tx().fromBuffer(new Buffer(txhex, 'hex'));
        var txb = Txbuilder().set({
          tx: tx,
          utxoutmap: map
        });

        txb.verifytx(flags).should.equal(true);
      });
    });

    var c = 0;
    tx_invalid.forEach(function(vector, i) {
      if (vector.length === 1)
        return;
      c++;
      it('should unverify tx_invalid vector ' + c, function() {
        var inputs = vector[0];
        var txhex = vector[1];
        var flags = Interp.getFlags(vector[2]);

        var map = {};
        inputs.forEach(function(input) {
          var txoutnum = input[1];
          if (txoutnum === -1)
            txoutnum = 0xffffffff; //bitcoind casts -1 to an unsigned int
          map[input[0] + ":" + txoutnum] = {txout: Txout().setScript(Script().fromBitcoindString(input[2]))};
        });

        var tx = Tx().fromBuffer(new Buffer(txhex, 'hex'));
        var txb = Txbuilder().set({
          tx: tx,
          utxoutmap: map
        });

        txb.verifytx(flags).should.equal(false);
      });
    });

  });

});
