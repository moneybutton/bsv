var should = require('chai').should();
var Txbuilder = require('../lib/txbuilder');
var Tx = require('../lib/tx');
var Address = require('../lib/address');
var BN = require('../lib/bn');

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

});
