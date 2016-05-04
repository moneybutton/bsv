/* global describe,it */
'use strict'
let BIP32 = require('../lib/bip32')
let BIP39 = require('../lib/bip39')
let Random = require('../lib/random')
let asink = require('asink')
let should = require('chai').should()
let vectors = require('./vectors/bip39')

describe('BIP39', function () {
  this.timeout(5000)

  it('should initialize the class', function () {
    should.exist(BIP39)
    should.exist(BIP39())
    should.exist(BIP39.en)
    should.exist(BIP39.jp)
  })

  it('should have a wordlist of length 2048', function () {
    require('../lib/bip39-en').length.should.equal(2048)
    require('../lib/bip39-jp').length.should.equal(2048)
  })

  it('should generate a mnemonic phrase that passes the check', function () {
    let mnemonic

    // should be able to make a mnemonic with or without the default wordlist
    let bip39 = BIP39.en().fromRandom(128)
    bip39.check().should.equal(true)
    bip39 = BIP39().fromRandom(128)
    bip39.check().should.equal(true)

    let entropy = new Buffer(32)
    entropy.fill(0)
    bip39 = BIP39.en().fromEntropy(entropy)
    bip39.check().should.equal(true)

    mnemonic = bip39.mnemonic

    // mnemonics with extra whitespace do not pass the check
    bip39 = BIP39.en().fromString(mnemonic + ' ')
    bip39.check().should.equal(false)

    // mnemonics with a word replaced do not pass the check
    let words = mnemonic.split(' ')
    words[words.length - 1].should.not.equal('zoo')
    words[words.length - 1] = 'zoo'
    mnemonic = words.join(' ')
    BIP39.en().fromString(mnemonic).check().should.equal(false)
  })

  describe('#toFastBuffer', function () {
    it('should convert to a buffer', function () {
      let bip39 = BIP39().fromRandom()
      should.exist(bip39.seed)
      should.exist(bip39.mnemonic)
      let buf = bip39.toFastBuffer()
      buf.length.should.greaterThan(512 / 8 + 1 + 1)
    })
  })

  describe('#fromFastBuffer', function () {
    it('should convert from a buffer', function () {
      let bip39a = BIP39().fromRandom()
      let bip39b = BIP39().fromFastBuffer(bip39a.toFastBuffer())
      bip39a.mnemonic.should.equal(bip39b.mnemonic)
      bip39b.seed.toString('hex').should.equal(bip39b.seed.toString('hex'))
    })
  })

  describe('#fromRandom', function () {
    it('should throw an error if bits is too low', function () {
      (function () {
        BIP39().fromRandom(127)
      }).should.throw('bits must be multiple of 32')
    })

    it('should throw an error if bits is not a multiple of 32', function () {
      (function () {
        BIP39().fromRandom(256 - 1)
      }).should.throw('bits must be multiple of 32')
    })
  })

  describe('#asyncFromRandom', function () {
    it('should have a seed and a mnemonic', function () {
      return asink(function * () {
        let bip39 = yield BIP39().asyncFromRandom()
        should.exist(bip39.mnemonic)
        should.exist(bip39.seed)
        let seed = bip39.seed
        bip39.mnemonic2seed()
        seed.toString('hex').should.equal(bip39.seed.toString('hex'))
      }, this)
    })
  })

  describe('#asyncFromEntropy', function () {
    it('should return same as fromEntropy', function () {
      return asink(function * () {
        let entropy = Random.getRandomBuffer(32)
        let bip39a = yield BIP39().asyncFromEntropy(entropy)
        let bip39b = yield BIP39().fromEntropy(entropy)
        bip39a.toSeed().toString('hex').should.equal(bip39b.toSeed().toString('hex'))
      })
    })
  })

  describe('#entropy2mnemonic', function () {
    it('should throw an error if you do not use enough entropy', function () {
      let buf = new Buffer(128 / 8 - 1)
      buf.fill(0)
      ;(function () {
        BIP39().entropy2mnemonic(buf)
      }).should.throw('Entropy is less than 128 bits. It must be 128 bits or more.')
    })

    it('should work with or without the wordlist', function () {
      let buf = new Buffer(128 / 8)
      buf.fill(0)
      let mnemonic1 = BIP39().entropy2mnemonic(buf).mnemonic
      let mnemonic2 = BIP39.en().entropy2mnemonic(buf).mnemonic
      mnemonic1.should.equal(mnemonic2)
    })
  })

  describe('#check', function () {
    it('should work with or without optional wordlist', function () {
      let buf = new Buffer(128 / 8)
      buf.fill(0)
      let mnemonic = BIP39().entropy2mnemonic(buf).mnemonic
      BIP39().fromString(mnemonic).check().should.equal(true)
      BIP39.en().fromString(mnemonic).check().should.equal(true)
    })
  })

  describe('#fromString', function () {
    it('should throw an error in invalid mnemonic', function () {
      (function () {
        BIP39().fromString('invalid mnemonic').toSeed()
      }).should.throw('Mnemonic does not pass the check - was the mnemonic typed incorrectly? Are there extra spaces?')
    })
  })

  describe('#asyncToSeed', function () {
    it('should result the same as toSeed', function () {
      return asink(function * () {
        let bip39 = BIP39().fromRandom()
        let seed1a = bip39.toSeed()
        let seed2a = yield bip39.asyncToSeed()
        seed1a.toString('hex').should.equal(seed2a.toString('hex'))
        let seed1b = bip39.toSeed('pass')
        let seed2b = yield bip39.asyncToSeed('pass')
        seed1b.toString('hex').should.equal(seed2b.toString('hex'))
      }, this)
    })
  })

  describe('vectors', function () {
    vectors.english.forEach(function (vector, v) {
      it('should pass english test vector ' + v, function () {
        let entropy = new Buffer(vector.entropy, 'hex')
        let bip39 = BIP39.en().fromEntropy(entropy)
        bip39.toString().should.equal(vector.mnemonic)
        bip39.check().should.equal(true)
        let seed = bip39.toSeed(vector.passphrase)
        seed.toString('hex').should.equal(vector.seed)
        BIP32().fromSeed(seed).toString().should.equal(vector.bip32_xprv)
      })
    })

    vectors.japanese.forEach(function (vector, v) {
      it('should pass japanese test vector ' + v, function () {
        let entropy = new Buffer(vector.entropy, 'hex')
        let bip39 = BIP39.jp().fromEntropy(entropy)
        bip39.toString().should.equal(vector.mnemonic)
        bip39.check().should.equal(true)
        let seed = bip39.toSeed(vector.passphrase)
        seed.toString('hex').should.equal(vector.seed)
        BIP32().fromSeed(seed).toString().should.equal(vector.bip32_xprv)
      })
    })
  })
})
