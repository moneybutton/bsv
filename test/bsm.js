/* global describe,it */
'use strict'
let Address = require('../lib/address')
let Bsm = require('../lib/bsm')
let KeyPair = require('../lib/key-pair')
let asink = require('asink')
let should = require('chai').should()

describe('Bsm', function () {
  it('should make a new bsm', function () {
    let bsm = new Bsm()
    should.exist(bsm)
  })

  it('should make a new bsm when called without "new"', function () {
    let bsm = new Bsm()
    should.exist(bsm)
  })

  describe('#fromObject', function () {
    it('should set the messageBuf', function () {
      let messageBuf = new Buffer('message')
      should.exist(new Bsm().fromObject({messageBuf: messageBuf}).messageBuf)
    })
  })

  describe('@MagicHash', function () {
    it('should return a hash', function () {
      let buf = new Buffer('001122', 'hex')
      let hashBuf = Bsm.magicHash(buf)
      Buffer.isBuffer(hashBuf).should.equal(true)
    })
  })

  describe('@asyncMagicHash', function () {
    it('should return a hash', function () {
      return asink(function * () {
        let buf = new Buffer('001122', 'hex')
        let hashBuf = yield Bsm.asyncMagicHash(buf)
        Buffer.isBuffer(hashBuf).should.equal(true)
      }, this)
    })
  })

  describe('@sign', function () {
    let messageBuf = new Buffer('this is my message')
    let keyPair = new KeyPair().fromRandom()

    it('should return a base64 string', function () {
      let sigstr = Bsm.sign(messageBuf, keyPair)
      let sigbuf = new Buffer(sigstr, 'base64')
      sigbuf.length.should.equal(1 + 32 + 32)
    })

    it('should sign with a compressed pubKey', function () {
      let keyPair = new KeyPair().fromRandom()
      keyPair.pubKey.compressed = true
      let sigstr = Bsm.sign(messageBuf, keyPair)
      let sigbuf = new Buffer(sigstr, 'base64')
      sigbuf[0].should.be.above(27 + 4 - 1)
      sigbuf[0].should.be.below(27 + 4 + 4 - 1)
    })

    it('should sign with an uncompressed pubKey', function () {
      let keyPair = new KeyPair().fromRandom()
      keyPair.pubKey.compressed = false
      let sigstr = Bsm.sign(messageBuf, keyPair)
      let sigbuf = new Buffer(sigstr, 'base64')
      sigbuf[0].should.be.above(27 - 1)
      sigbuf[0].should.be.below(27 + 4 - 1)
    })
  })

  describe('@asyncSign', function () {
    let messageBuf = new Buffer('this is my message')
    let keyPair = new KeyPair().fromRandom()

    it('should return the same as sign', function () {
      return asink(function * () {
        let sigstr1 = Bsm.sign(messageBuf, keyPair)
        let sigstr2 = yield Bsm.asyncSign(messageBuf, keyPair)
        sigstr1.should.equal(sigstr2)
      }, this)
    })
  })

  describe('@verify', function () {
    let messageBuf = new Buffer('this is my message')
    let keyPair = new KeyPair().fromRandom()

    it('should verify a signed message', function () {
      let sigstr = Bsm.sign(messageBuf, keyPair)
      let addr = new Address().fromPubKey(keyPair.pubKey)
      Bsm.verify(messageBuf, sigstr, addr).should.equal(true)
    })

    it('should verify this known good signature', function () {
      let addrstr = '1CKTmxj6DjGrGTfbZzVxnY4Besbv8oxSZb'
      let address = new Address().fromString(addrstr)
      let sigstr = 'IOrTlbNBI0QO990xOw4HAjnvRl/1zR+oBMS6HOjJgfJqXp/1EnFrcJly0UcNelqJNIAH4f0abxOZiSpYmenMH4M='
      Bsm.verify(messageBuf, sigstr, address)
    })
  })

  describe('@asyncVerify', function () {
    let messageBuf = new Buffer('this is my message')
    let keyPair = new KeyPair().fromRandom()

    it('should verify a signed message', function () {
      return asink(function * () {
        let sigstr = Bsm.sign(messageBuf, keyPair)
        let addr = new Address().fromPubKey(keyPair.pubKey)
        let verified = yield Bsm.verify(messageBuf, sigstr, addr)
        verified.should.equal(true)
      }, this)
    })
  })

  describe('#sign', function () {
    let messageBuf = new Buffer('this is my message')
    let keyPair = new KeyPair().fromRandom()

    it('should sign a message', function () {
      let bsm = new Bsm()
      bsm.messageBuf = messageBuf
      bsm.keyPair = keyPair
      bsm.sign()
      let sig = bsm.sig
      should.exist(sig)
    })
  })

  describe('#verify', function () {
    let messageBuf = new Buffer('this is my message')
    let keyPair = new KeyPair().fromRandom()

    it('should verify a message that was just signed', function () {
      let bsm = new Bsm()
      bsm.messageBuf = messageBuf
      bsm.keyPair = keyPair
      bsm.address = new Address().fromPubKey(keyPair.pubKey)
      bsm.sign()
      bsm.verify()
      bsm.verified.should.equal(true)
    })
  })
})
