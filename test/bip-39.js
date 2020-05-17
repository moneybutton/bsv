/* global describe,it */
'use strict'
import { Address } from '../lib/address'
import { Bip32 } from '../lib/bip-32'
import { Bip39 } from '../lib/bip-39'
import { Bip39Jp } from '../lib/bip-39-jp'
import { Bip39En } from '../lib/bip-39-en'
import { Random } from '../lib/random'
import should from 'should'
import vectors from './vectors/bip39.json'
import { wordList as enWordList } from '../lib/bip-39-en-wordlist'
import { wordList as jpWordList } from '../lib/bip-39-jp-wordlist'

describe('Bip39', function () {
  this.timeout(5000)

  it('should initialize the class', function () {
    should.exist(Bip39)
    should.exist(new Bip39())
  })

  it('should have a wordlist of length 2048', function () {
    enWordList.length.should.equal(2048)
    jpWordList.length.should.equal(2048)
  })

  it('should handle this community-derived test vector', function () {
    // There was a bug in Copay and bip32jp about deriving addresses with bip39
    // and bip44. This confirms we are handling the situation correctly and
    // derive the correct value.
    //
    // More information here:
    // https://github.com/iancoleman/bip39/issues/58
    const seed = Bip39.fromString(
      'fruit wave dwarf banana earth journey tattoo true farm silk olive fence'
    ).toSeed('banana')
    let bip32 = Bip32.fromSeed(seed)
    bip32 = bip32.derive("m/44'/0'/0'/0/0")
    const address = Address.fromPubKey(bip32.pubKey)
    address.toString().should.equal('17rxURoF96VhmkcEGCj5LNQkmN9HVhWb7F')
  })

  it('should generate a mnemonic phrase that passes the check', function () {
    let mnemonic

    // should be able to make a mnemonic with or without the default wordlist
    let bip39 = new Bip39En().fromRandom(128)
    bip39.check().should.equal(true)
    bip39 = new Bip39().fromRandom(128)
    bip39.check().should.equal(true)

    const entropy = Buffer.alloc(32)
    entropy.fill(0)
    bip39 = new Bip39En().fromEntropy(entropy)
    bip39.check().should.equal(true)

    mnemonic = bip39.mnemonic

    // mnemonics with extra whitespace do not pass the check
    bip39 = new Bip39En().fromString(mnemonic + ' ')
    bip39.check().should.equal(false)

    // mnemonics with a word replaced do not pass the check
    const words = mnemonic.split(' ')
    words[words.length - 1].should.not.equal('zoo')
    words[words.length - 1] = 'zoo'
    mnemonic = words.join(' ')
    new Bip39En()
      .fromString(mnemonic)
      .check()
      .should.equal(false)
  })

  describe('#toFastBuffer', function () {
    it('should convert to a buffer', function () {
      const bip39 = new Bip39().fromRandom()
      should.exist(bip39.seed)
      should.exist(bip39.mnemonic)
      const buf = bip39.toFastBuffer()
      buf.length.should.greaterThan(512 / 8 + 1 + 1)
    })
  })

  describe('#fromFastBuffer', function () {
    it('should convert from a buffer', function () {
      const bip39a = new Bip39().fromRandom()
      const bip39b = new Bip39().fromFastBuffer(bip39a.toFastBuffer())
      bip39a.mnemonic.should.equal(bip39b.mnemonic)
      bip39b.seed.toString('hex').should.equal(bip39b.seed.toString('hex'))
    })
  })

  describe('#fromRandom', function () {
    it('should throw an error if bits is too low', function () {
      ;(function () {
        new Bip39().fromRandom(127)
      }.should.throw('bits must be multiple of 32'))
    })

    it('should throw an error if bits is not a multiple of 32', function () {
      ;(function () {
        new Bip39().fromRandom(256 - 1)
      }.should.throw('bits must be multiple of 32'))
    })
  })

  describe('@fromRandom', function () {
    it('should throw an error if bits is too low', function () {
      ;(function () {
        Bip39.fromRandom(127)
      }.should.throw('bits must be multiple of 32'))
    })

    it('should throw an error if bits is not a multiple of 32', function () {
      ;(function () {
        Bip39.fromRandom(256 - 1)
      }.should.throw('bits must be multiple of 32'))
    })
  })

  describe('#asyncFromRandom', function () {
    it('should have a seed and a mnemonic', async function () {
      const bip39 = await new Bip39().asyncFromRandom()
      should.exist(bip39.mnemonic)
      should.exist(bip39.seed)
      const seed = bip39.seed
      bip39.mnemonic2Seed()
      seed.toString('hex').should.equal(bip39.seed.toString('hex'))
    })
  })

  describe('@asyncFromRandom', function () {
    it('should have a seed and a mnemonic', async function () {
      const bip39 = await Bip39.asyncFromRandom()
      should.exist(bip39.mnemonic)
      should.exist(bip39.seed)
      const seed = bip39.seed
      bip39.mnemonic2Seed()
      seed.toString('hex').should.equal(bip39.seed.toString('hex'))
    })
  })

  describe('#fromEntropy', function () {
    it('should build from entropy', function () {
      const bip39 = new Bip39().fromEntropy(Random.getRandomBuffer(32))
      should.exist(bip39)
    })
  })

  describe('@fromEntropy', function () {
    it('should build from entropy', function () {
      const bip39 = Bip39.fromEntropy(Random.getRandomBuffer(32))
      should.exist(bip39)
    })
  })

  describe('#asyncFromEntropy', function () {
    it('should return same as fromEntropy', async function () {
      const entropy = Random.getRandomBuffer(32)
      const bip39a = await new Bip39().asyncFromEntropy(entropy)
      const bip39b = await new Bip39().fromEntropy(entropy)
      bip39a
        .toSeed()
        .toString('hex')
        .should.equal(bip39b.toSeed().toString('hex'))
    })
  })

  describe('@asyncFromEntropy', function () {
    it('should return same as fromEntropy', async function () {
      const entropy = Random.getRandomBuffer(32)
      const bip39a = await Bip39.asyncFromEntropy(entropy)
      const bip39b = await Bip39.fromEntropy(entropy)
      bip39a
        .toSeed()
        .toString('hex')
        .should.equal(bip39b.toSeed().toString('hex'))
    })
  })

  describe('#entropy2Mnemonic', function () {
    it('should throw an error if you do not use enough entropy', function () {
      const buf = Buffer.alloc(128 / 8 - 1)
      buf.fill(0)
      ;(function () {
        new Bip39().entropy2Mnemonic(buf)
      }.should.throw(
        'Entropy is less than 128 bits. It must be 128 bits or more.'
      ))
    })

    it('should work with or without the wordlist', function () {
      const buf = Buffer.alloc(128 / 8)
      buf.fill(0)
      const mnemonic1 = new Bip39().entropy2Mnemonic(buf).mnemonic
      const mnemonic2 = new Bip39En().entropy2Mnemonic(buf).mnemonic
      mnemonic1.should.equal(mnemonic2)
    })
  })

  describe('#check', function () {
    it('should work with or without optional wordlist', function () {
      const buf = Buffer.alloc(128 / 8)
      buf.fill(0)
      const mnemonic = new Bip39().entropy2Mnemonic(buf).mnemonic
      new Bip39()
        .fromString(mnemonic)
        .check()
        .should.equal(true)
      new Bip39En()
        .fromString(mnemonic)
        .check()
        .should.equal(true)
    })
  })

  describe('#fromString', function () {
    it('should throw an error in invalid mnemonic', function () {
      ;(function () {
        new Bip39().fromString('invalid mnemonic').toSeed()
      }.should.throw(
        'Mnemonic does not pass the check - was the mnemonic typed incorrectly? Are there extra spaces?'
      ))
    })
  })

  describe('#asyncToSeed', function () {
    it('should result the same as toSeed', async function () {
      const bip39 = new Bip39().fromRandom()
      const seed1a = bip39.toSeed()
      const seed2a = await bip39.asyncToSeed()
      seed1a.toString('hex').should.equal(seed2a.toString('hex'))
      const seed1b = bip39.toSeed('pass')
      const seed2b = await bip39.asyncToSeed('pass')
      seed1b.toString('hex').should.equal(seed2b.toString('hex'))
    })
  })

  describe('@isValid', function () {
    it('should know this is valid', function () {
      const isValid = Bip39.isValid('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about', 'TREZOR')
      isValid.should.equal(true)
    })

    it('should know this is invalid', function () {
      const isValid = Bip39.isValid('abandonnnnnnn abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about', 'TREZOR')
      isValid.should.equal(false)
    })
  })

  describe('vectors', function () {
    vectors.english.forEach(function (vector, v) {
      it('should pass english test vector ' + v, function () {
        const entropy = Buffer.from(vector.entropy, 'hex')
        const bip39 = new Bip39En().fromEntropy(entropy)
        bip39.toString().should.equal(vector.mnemonic)
        bip39.check().should.equal(true)
        const seed = bip39.toSeed(vector.passphrase)
        seed.toString('hex').should.equal(vector.seed)
        new Bip32()
          .fromSeed(seed)
          .toString()
          .should.equal(vector.bip32_xprv)
      })
    })

    vectors.japanese.forEach(function (vector, v) {
      it('should pass japanese test vector ' + v, function () {
        const entropy = Buffer.from(vector.entropy, 'hex')
        const bip39 = new Bip39Jp().fromEntropy(entropy)
        bip39.toString().should.equal(vector.mnemonic)
        bip39.check().should.equal(true)
        const seed = bip39.toSeed(vector.passphrase)
        seed.toString('hex').should.equal(vector.seed)
        new Bip32()
          .fromSeed(seed)
          .toString()
          .should.equal(vector.bip32_xprv)
      })
    })
  })
})
