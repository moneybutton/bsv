"use strict";
var should = require('chai').should();
var BIP39 = require('../lib/bip39');
var BIP32 = require('../lib/bip32');
var vectors = require('./vectors/bip39');

describe('BIP39', function() {

  it('should initialize the class', function() {
    should.exist(BIP39);
    should.exist(BIP39());
    should.exist(BIP39('en'));
    should.exist(BIP39('jp'));
  });

  it('should have a wordlist of length 2048', function() {
    BIP39.wordlist_en.length.should.equal(2048);
  });

  it('should generate a mnemonic phrase that passes the check', function() {
    var mnemonic;

    // should be able to make a mnemonic with or without the default wordlist
    var bip39 = BIP39('en').fromRandom(128);
    bip39.check().should.equal(true);
    var bip39 = BIP39().fromRandom(128);
    bip39.check().should.equal(true);

    var entropy = new Buffer(32);
    entropy.fill(0);
    var bip39 = BIP39('en').fromEntropy(entropy);
    bip39.check().should.equal(true);

    var mnemonic = bip39.mnemonic;

    // mnemonics with extra whitespace do not pass the check
    var bip39 = BIP39('en').fromMnemonic(mnemonic + ' ');
    bip39.check().should.equal(false);

    // mnemonics with a word replaced do not pass the check
    var words = mnemonic.split(' ');
    words[words.length - 1].should.not.equal('zoo');
    words[words.length - 1] = 'zoo';
    mnemonic = words.join(' ');
    BIP39('en').fromMnemonic(mnemonic).check().should.equal(false);
  });

  describe('#fromRandom', function() {
    
    it('should throw an error if bits is too low', function() {
      (function() {
        BIP39().fromRandom(127);
      }).should.throw('bits must be multiple of 32');
    });

    it('should throw an error if bits is not a multiple of 32', function() {
      (function() {
        BIP39().fromRandom(256 - 1);
      }).should.throw('bits must be multiple of 32');
    });

  });

  describe('#entropy2mnemonic', function() {

    it('should throw an error if you do not use enough entropy', function() {
      var buf = new Buffer(128 / 8 - 1);
      buf.fill(0);
      (function() {
        BIP39().entropy2mnemonic(buf);
      }).should.throw('Entropy is less than 128 bits. It must be 128 bits or more.');
    });

    it('should work with or without the wordlist', function() {
      var buf = new Buffer(128 / 8);
      buf.fill(0);
      var mnemonic1 = BIP39().entropy2mnemonic(buf).mnemonic;
      var mnemonic2 = BIP39('en').entropy2mnemonic(buf).mnemonic;
      mnemonic1.should.equal(mnemonic2);
    });

  });

  describe('#check', function() {

    it('should work with or without optional wordlist', function() {
      var buf = new Buffer(128 / 8);
      buf.fill(0);
      var mnemonic = BIP39().entropy2mnemonic(buf).mnemonic;
      BIP39().fromMnemonic(mnemonic).check().should.equal(true);
      BIP39('en').fromMnemonic(mnemonic).check().should.equal(true);
    });

  });

  describe('#fromMnemonic', function() {

    it('should throw an error in invalid mnemonic', function() {
      (function() {
        BIP39().fromMnemonic("invalid mnemonic").toSeed();
      }).should.throw('Mnemonic does not pass the check - was the mnemonic typed incorrectly? Are there extra spaces?');
    });

  });

  describe('vectors', function() {

    vectors.english.forEach(function(vector, v) {
      it('should pass english test vector ' + v, function() {
        var entropy = new Buffer(vector.entropy, 'hex');
        var bip39 = BIP39('en').fromEntropy(entropy)
        bip39.toMnemonic().should.equal(vector.mnemonic);
        bip39.check().should.equal(true);
        var seed = bip39.toSeed(vector.passphrase);
        seed.toString('hex').should.equal(vector.seed);
        BIP32().fromSeed(seed).toString().should.equal(vector.bip32_xprv);
      });
    });

    vectors.japanese.forEach(function(vector, v) {
      it('should pass japanese test vector ' + v, function() {
        var entropy = new Buffer(vector.entropy, 'hex');
        var bip39 = BIP39('jp').fromEntropy(entropy)
        bip39.toMnemonic().should.equal(vector.mnemonic);
        bip39.check().should.equal(true);
        var seed = bip39.toSeed(vector.passphrase);
        seed.toString('hex').should.equal(vector.seed);
        BIP32().fromSeed(seed).toString().should.equal(vector.bip32_xprv);
      });
    });

  });

});
