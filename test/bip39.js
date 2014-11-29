var should = require('chai').should();
var BIP39 = require('../lib/bip39');
var vectors = require('./vectors/bip39');

describe('BIP39', function() {

  it('should initialize the class', function() {
    should.exist(BIP39);
  });

  it('should have a wordlist of length 2048', function() {
    BIP39.wordlist_en.length.should.equal(2048);
  });

  it('should generate a mnemonic phrase', function() {
    var phrase = BIP39.mnemonic(BIP39.wordlist_en, 128);
  });

  describe('vectors', function() {

    vectors.english.forEach(function(vector, v) {
      it('should pass test vector ' + v, function() {
        var code = vector[0];
        var mnemonic = vector[1];
        var seed = vector[2];
        var mnemonic1 = BIP39.entropy2mnemonic(BIP39.wordlist_en, new Buffer(code, 'hex'));
        var seed1 = BIP39.mnemonic2seed(mnemonic, 'TREZOR');
        BIP39.check(BIP39.wordlist_en, mnemonic).should.be.true;
        mnemonic1.should.equal(mnemonic);
        seed1.toString('hex').should.equal(seed)
      });
    });

  });

});
