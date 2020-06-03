/* global describe,it */
'use strict'
import { Address } from '../lib/address'
import { Bsm } from '../lib/bsm'
import { KeyPair } from '../lib/key-pair'
import should from 'should'

describe('Bsm', function () {
  it('should make a new bsm', function () {
    const bsm = new Bsm()
    should.exist(bsm)
  })

  it('should make a new bsm when called without "new"', function () {
    const bsm = new Bsm()
    should.exist(bsm)
  })

  describe('#fromObject', function () {
    it('should set the messageBuf', function () {
      const messageBuf = Buffer.from('message')
      should.exist(new Bsm().fromObject({ messageBuf: messageBuf }).messageBuf)
    })
  })

  describe('@MagicHash', function () {
    it('should return a hash', function () {
      const buf = Buffer.from('001122', 'hex')
      const hashBuf = Bsm.magicHash(buf)
      Buffer.isBuffer(hashBuf).should.equal(true)
    })
  })

  describe('@asyncMagicHash', function () {
    it('should return a hash', async function () {
      const buf = Buffer.from('001122', 'hex')
      const hashBuf = await Bsm.asyncMagicHash(buf)
      Buffer.isBuffer(hashBuf).should.equal(true)
    })
  })

  describe('@sign', function () {
    const messageBuf = Buffer.from('this is my message')
    const keyPair = new KeyPair().fromRandom()

    it('should return a base64 string', function () {
      const sigstr = Bsm.sign(messageBuf, keyPair)
      const sigbuf = Buffer.from(sigstr, 'base64')
      sigbuf.length.should.equal(1 + 32 + 32)
    })

    it('should sign with a compressed pubKey', function () {
      const keyPair = new KeyPair().fromRandom()
      keyPair.pubKey.compressed = true
      const sigstr = Bsm.sign(messageBuf, keyPair)
      const sigbuf = Buffer.from(sigstr, 'base64')
      sigbuf[0].should.be.above(27 + 4 - 1)
      sigbuf[0].should.be.below(27 + 4 + 4 - 1)
    })

    it('should sign with an uncompressed pubKey', function () {
      const keyPair = new KeyPair().fromRandom()
      keyPair.pubKey.compressed = false
      const sigstr = Bsm.sign(messageBuf, keyPair)
      const sigbuf = Buffer.from(sigstr, 'base64')
      sigbuf[0].should.be.above(27 - 1)
      sigbuf[0].should.be.below(27 + 4 - 1)
    })
  })

  describe('@asyncSign', function () {
    const messageBuf = Buffer.from('this is my message')
    const keyPair = new KeyPair().fromRandom()

    it('should return the same as sign', async function () {
      const sigstr1 = Bsm.sign(messageBuf, keyPair)
      const sigstr2 = await Bsm.asyncSign(messageBuf, keyPair)
      sigstr1.should.equal(sigstr2)
    })
  })

  describe('@verify', function () {
    const messageBuf = Buffer.from('this is my message')
    const keyPair = new KeyPair().fromRandom()

    it('should verify a signed message', function () {
      const sigstr = Bsm.sign(messageBuf, keyPair)
      const addr = new Address().fromPubKey(keyPair.pubKey)
      Bsm.verify(messageBuf, sigstr, addr).should.equal(true)
    })

    it('should verify this known good signature', function () {
      const addrstr = '1CKTmxj6DjGrGTfbZzVxnY4Besbv8oxSZb'
      const address = new Address().fromString(addrstr)
      const sigstr =
        'IOrTlbNBI0QO990xOw4HAjnvRl/1zR+oBMS6HOjJgfJqXp/1EnFrcJly0UcNelqJNIAH4f0abxOZiSpYmenMH4M='
      Bsm.verify(messageBuf, sigstr, address)
    })
  })

  describe('@asyncVerify', function () {
    const messageBuf = Buffer.from('this is my message')
    const keyPair = new KeyPair().fromRandom()

    it('should verify a signed message', async function () {
      const sigstr = Bsm.sign(messageBuf, keyPair)
      const addr = new Address().fromPubKey(keyPair.pubKey)
      const verified = await Bsm.verify(messageBuf, sigstr, addr)
      verified.should.equal(true)
    })
  })

  describe('#sign', function () {
    const messageBuf = Buffer.from('this is my message')
    const keyPair = new KeyPair().fromRandom()

    it('should sign a message', function () {
      const bsm = new Bsm()
      bsm.messageBuf = messageBuf
      bsm.keyPair = keyPair
      bsm.sign()
      const sig = bsm.sig
      should.exist(sig)
    })
  })

  describe('#verify', function () {
    const messageBuf = Buffer.from('this is my message')
    const keyPair = new KeyPair().fromRandom()

    it('should verify a message that was just signed', function () {
      const bsm = new Bsm()
      bsm.messageBuf = messageBuf
      bsm.keyPair = keyPair
      bsm.address = new Address().fromPubKey(keyPair.pubKey)
      bsm.sign()
      bsm.verify()
      bsm.verified.should.equal(true)
    })
  })
})
