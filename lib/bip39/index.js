/**
 * BIP39: Mnemonic Seeds
 * =====================
 *
 * BIP39 is a way to turn random entropy into a mnemonic (a string of words
 * from a wordlist), and then that mnemonic into a seed. The seed can then be
 * used in BIP32 to derive hierarchical deterministic keys. It does not go the
 * other way around (i.e., you cannot turn a seed into a mnemonic). The usual
 * way to use it is either to generate a new one, like this:
 *
 * let mnemonic = BIP39().fromRandom().toString();
 *
 * or from a known mnemonic:
 *
 * let seed = BIP39().fromString(mnemonic).toSeed();
 */
'use strict';
let dependencies = {
  Hash: require('../hash'),
  KDF: require('../kdf'),
  Random: require('../random'),
  Struct: require('../struct'),
  unorm: require('unorm'),
  Wordlist: require('./en')
};

function inject (deps) {
  let Hash = deps.Hash;
  let KDF = deps.KDF;
  let Random = deps.Random;
  let Struct = deps.Struct;
  let unorm = deps.unorm;
  let wordlist = deps.Wordlist;

  function BIP39 (mnemonic) {
    if (!(this instanceof BIP39))
      return new BIP39(mnemonic);
    this.fromObject({
      mnemonic: mnemonic
    });
  }

  BIP39.prototype = Object.create(Struct.prototype);
  BIP39.prototype.constructor = BIP39;

  /**
   * Generate a random new mnemonic from the wordlist.
   */
  BIP39.prototype.fromRandom = function (bits) {
    if (!bits)
      bits = 128;
    if (bits % 32 != 0)
      throw new Error('bits must be multiple of 32');
    if (bits < 128)
      throw new Error('bits must be at least 128');
    let buf = Random.getRandomBuffer(bits / 8);
    this.entropy2mnemonic(buf);
    this.mnemonic2seed();
    return this;
  };

  BIP39.prototype.fromEntropy = function (buf) {
    this.entropy2mnemonic(buf);
    return this;
  };

  BIP39.prototype.fromString = function (mnemonic) {
    this.mnemonic = mnemonic;
    return this;
  };

  BIP39.prototype.toString = function () {
    return this.mnemonic;
  };

  BIP39.prototype.toSeed = function (passphrase) {
    this.mnemonic2seed(passphrase);
    return this.seed;
  };

  /**
   * Generate a new mnemonic from some entropy generated somewhere else. The
   * entropy must be at least 128 bits.
   */
  BIP39.prototype.entropy2mnemonic = function (buf) {
    if (!Buffer.isBuffer(buf) || buf.length < 128 / 8)
      throw new Error('Entropy is less than 128 bits. It must be 128 bits or more.');

    let hash = Hash.sha256(buf);
    let bin = '';
    let bits = buf.length * 8;
    for (let i = 0; i < buf.length; i++) {
      bin = bin + ('00000000' + buf[i].toString(2)).slice(-8);
    }
    let hashbits = hash[0].toString(2);
    hashbits = ('00000000' + hashbits).slice(-8).slice(0, bits / 32);
    bin = bin + hashbits;

    if (bin.length % 11 != 0)
      throw new Error('internal error - entropy not an even multiple of 11 bits - ' + bin.length);

    let mnemonic = '';
    for (let i = 0; i < bin.length / 11; i++) {
      if (mnemonic != '')
        mnemonic = mnemonic + wordlist.space;
      let wi = parseInt(bin.slice(i * 11, (i + 1) * 11), 2);
      mnemonic = mnemonic + wordlist[wi];
    }

    this.mnemonic = mnemonic;
    return this;
  };

  /**
   * Check that a mnemonic is valid. This means there should be no superfluous
   * whitespace, no invalid words, and the checksum should match.
   */
  BIP39.prototype.check = function () {
    let mnemonic = this.mnemonic;

    // confirm no invalid words
    let words = mnemonic.split(wordlist.space);
    let bin = '';
    for (let i = 0; i < words.length; i++) {
      let ind = wordlist.indexOf(words[i]);
      if (ind < 0)
        return false;
      bin = bin + ('00000000000' + ind.toString(2)).slice(-11);
    }

    if (bin.length % 11 != 0)
      throw new Error('internal error - entropy not an even multiple of 11 bits - ' + bin.length);

    // confirm checksum
    let cs = bin.length / 33;
    let hash_bits = bin.slice(-cs);
    let nonhash_bits = bin.slice(0, bin.length - cs);
    let buf = new Buffer(nonhash_bits.length / 8);
    for (let i = 0; i < nonhash_bits.length / 8; i++) {
      buf.writeUInt8(parseInt(bin.slice(i * 8, (i + 1) * 8), 2), i);
    }
    let hash = Hash.sha256(buf);
    let expected_hash_bits = hash[0].toString(2);
    expected_hash_bits = ('00000000' + expected_hash_bits).slice(-8).slice(0, cs);

    return expected_hash_bits === hash_bits;
  };

  /**
   * Convert a mnemonic to a seed. Does not check for validity of the mnemonic -
   * for that, you should manually run check() first.
   */
  BIP39.prototype.mnemonic2seed = function (passphrase) {
    let mnemonic = this.mnemonic;
    if (!this.check())
      throw new Error('Mnemonic does not pass the check - was the mnemonic typed incorrectly? Are there extra spaces?');
    if (passphrase === undefined)
      passphrase = '';
    else if (typeof passphrase !== 'string')
      throw new Error('passphrase must be a string or undefined');
    mnemonic = unorm.nfkd(mnemonic);
    passphrase = unorm.nfkd(passphrase);
    let mbuf = new Buffer(mnemonic);
    let pbuf = Buffer.concat([new Buffer('mnemonic'), new Buffer(passphrase)]);
    this.seed = KDF.PBKDF2(mbuf, pbuf, 2048, 64 * 8);
    return this;
  };

  return BIP39;
}

inject = require('../injector')(inject, dependencies);
let BIP39 = inject();
BIP39.en = inject({
  Wordlist: require('./en')
});
BIP39.jp = inject({
  Wordlist: require('./jp')
});
module.exports = BIP39;
