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

  it('should generate a mnemonic phrase that passes the check', function() {
    var mnemonic;

    // should be able to make a mnemonic with or without the default wordlist
    mnemonic = BIP39.mnemonic(128);
    BIP39.check(mnemonic).should.equal(true);
    mnemonic = BIP39.mnemonic(128, BIP39.wordlist_en);
    BIP39.check(mnemonic, BIP39.wordlist_en).should.equal(true);

    var entropy = new Buffer(32);
    entropy.fill(0);
    mnemonic = BIP39.entropy2mnemonic(entropy);
    BIP39.check(mnemonic, BIP39.wordlist_en).should.equal(true);

    // mnemonics with extra whitespace do not pass the check
    BIP39.check(mnemonic + ' ', BIP39.wordlist_en).should.equal(false);

    // mnemonics with a word replaced do not pass the check
    words = mnemonic.split(' ');
    words[words.length - 1].should.not.equal('zoo');
    words[words.length - 1] = 'zoo';
    mnemonic = words.join(' ');
    BIP39.check(mnemonic).should.equal(false);
  });

  describe('@mnemonic', function() {
    
    it('should throw an error if bits is too low', function() {
      (function() {
        BIP39.mnemonic(127);
      }).should.throw('bits must be multiple of 32');
    });

    it('should throw an error if bits is not a multiple of 32', function() {
      (function() {
        BIP39.mnemonic(256 - 1);
      }).should.throw('bits must be multiple of 32');
    });

  });

  describe('@entropy2mnemonic', function() {

    it('should throw an error if you do not use enough entropy', function() {
      var buf = new Buffer(128 / 8 - 1);
      buf.fill(0);
      (function() {
        BIP39.entropy2mnemonic(buf);
      }).should.throw('Entropy is less than 128 bits. It must be 128 bits or more.');
    });

    it('should work with and without the wordlist', function() {
      var buf = new Buffer(128 / 8);
      buf.fill(0);
      var mnemonic1 = BIP39.entropy2mnemonic(buf);
      var mnemonic2 = BIP39.entropy2mnemonic(buf, BIP39.wordlist_en);
      mnemonic1.should.equal(mnemonic2);
    });

  });

  describe('@check', function() {

    it('should work with or without optional wordlist', function() {
      var buf = new Buffer(128 / 8);
      buf.fill(0);
      var mnemonic = BIP39.entropy2mnemonic(buf);
      BIP39.check(mnemonic).should.equal(true);
      BIP39.check(mnemonic, BIP39.wordlist_en).should.equal(true);
    });

  });

  describe('@mnemonic2seed', function() {

    it('should throw an error in invalid mnemonic', function() {
      (function() {
        BIP39.mnemonic2seed("invalid mnemonic");
      }).should.throw('Mnemonic does not pass the check - was the mnemonic typed incorrectly? Are there extra spaces?');
    });

  });

  describe('vectors', function() {

    vectors.english.forEach(function(vector, v) {
      it('should pass test vector ' + v, function() {
        var code = vector[0];
        var mnemonic = vector[1];
        var seed = vector[2];
        var mnemonic1 = BIP39.entropy2mnemonic(new Buffer(code, 'hex'));
        var seed1 = BIP39.mnemonic2seed(mnemonic, 'TREZOR');
        BIP39.check(mnemonic).should.be.true;
        BIP39.check(mnemonic, BIP39.wordlist_en).should.be.true;
        mnemonic1.should.equal(mnemonic);
        seed1.toString('hex').should.equal(seed)
      });
    });

  });

});
