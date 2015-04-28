var should = require('chai').should();
var Txverifier = require('../lib/txverifier');
var Txoutmap = require('../lib/txoutmap');
var Tx = require('../lib/tx');
var Txout = require('../lib/txout');
//var Address = require('../lib/address');
var BN = require('../lib/bn');
var Interp = require('../lib/interp');
var BR = require('../lib/br');
var Script = require('../lib/script');
//var Pubkey = require('../lib/pubkey');
//var Privkey = require('../lib/privkey');
//var Keypair = require('../lib/keypair');
var tx_valid = require('./vectors/bitcoind/tx_valid');
var tx_invalid = require('./vectors/bitcoind/tx_invalid');

describe('Txverifier', function() {
  
  it('should make a new txverifier', function() {
    var txverifier = new Txverifier();
    (txverifier instanceof Txverifier).should.equal(true);
    txverifier = Txverifier();
    (txverifier instanceof Txverifier).should.equal(true);
    txverifier = Txverifier({
      tx: Tx()
    });
    should.exist(txverifier.tx);
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

        var txoutmap = Txoutmap();
        inputs.forEach(function(input) {
          var txoutnum = input[1];
          if (txoutnum === -1)
            txoutnum = 0xffffffff; //bitcoind casts -1 to an unsigned int
          var txout = Txout(BN(0), Script().fromBitcoindString(input[2]));
          var txhashbuf = BR(new Buffer(input[0], 'hex')).readReverse();
          txoutmap.add(txhashbuf, txoutnum, txout);
        });

        var tx = Tx().fromBuffer(new Buffer(txhex, 'hex'));
        Txverifier.verify(tx, txoutmap, flags).should.equal(true);
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

        var txoutmap = Txoutmap();
        inputs.forEach(function(input) {
          var txoutnum = input[1];
          if (txoutnum === -1)
            txoutnum = 0xffffffff; //bitcoind casts -1 to an unsigned int
          var txout = Txout(BN(0), Script().fromBitcoindString(input[2]));
          var txhashbuf = BR(new Buffer(input[0], 'hex')).readReverse();
          txoutmap.add(txhashbuf, txoutnum, txout);
        });

        var tx = Tx().fromBuffer(new Buffer(txhex, 'hex'));

        Txverifier.verify(tx, txoutmap, flags).should.equal(false);
      });
    });

  });

});
