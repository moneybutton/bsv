/* global describe,it */
'use strict'
require('should')
let Kdf = require('../lib/kdf')
let Hash = require('../lib/hash')
let vectors = require('./vectors/kdf')
let crypto = require('crypto')

describe('Kdf', function () {
  it('should satisfy this basic API', function () {
    Kdf.Testnet.should.equal(Kdf.Testnet)
    Kdf.Mainnet.should.equal(Kdf.Mainnet)
    Kdf.Mainnet.should.not.equal(Kdf.Testnet)
  })

  describe('@pbkdf2', function () {
    it('should return values of the right size', function () {
      let passBuf = Buffer.from([0])
      let saltBuf = Buffer.from([0])
      let key1 = Kdf.pbkdf2(passBuf, saltBuf)
      key1.length.should.equal(512 / 8)
      let key2 = Kdf.pbkdf2(passBuf, saltBuf, 2)
      key2.length.should.equal(512 / 8)
      key1.toString('hex').should.not.equal(key2.toString('hex'))
      let key3 = Kdf.pbkdf2(passBuf, saltBuf, 2, 1024)
      key3.length.should.equal(1024 / 8)
      let key4 = Kdf.pbkdf2(passBuf, saltBuf, 2, 256, 'sha256')
      key4.length.should.equal(256 / 8)
    })

    it('should compute the same as the node standard library', function () {
      let passBuf = Buffer.from([0])
      let saltBuf = Buffer.from([0])
      let iterations = 1000
      let keylen = 512
      let digest = 'sha512'
      let key1 = Kdf.pbkdf2(passBuf, saltBuf, iterations, keylen, digest)
      let key2 = crypto.pbkdf2Sync(
        passBuf,
        saltBuf,
        iterations,
        keylen / 8,
        digest
      )
      Buffer.compare(key1, key2).should.equal(0)
    })

    // Test vectors from: http://tools.ietf.org/html/rfc6070#section-2
    vectors.PBKDF2.valid.forEach(function (obj, i) {
      it('should work for pbkdf2 test vector ' + i, function () {
        let passBuf = Buffer.from(obj.p, 'hex')
        let saltBuf = Buffer.from(obj.s, 'hex')
        let nIterations = obj.c
        let keyLenBits = obj.dkLen * 8
        let hmacf = obj.hmacf
        let key = Kdf.pbkdf2(passBuf, saltBuf, nIterations, keyLenBits, hmacf)
        key.toString('hex').should.equal(obj.key)
      })
    })
  })

  describe('@buf2KeyPair', function () {
    it('should compute these known values', function () {
      let buf = Hash.sha256(Buffer.from('test'))
      let keyPair = Kdf.buf2KeyPair(buf)
      keyPair.privKey
        .toString()
        .should.equal('KxxVszVMFLGzmxpxR7sMSaWDmqMKLVhKebX5vZbGHyuR8spreQ7V')
      keyPair.pubKey
        .toString()
        .should.equal(
          '03774f761ae89a0d2fda0d532bad62286ae8fcda9bc38c060036296085592a97c1'
        )
    })
  })

  describe('@sha256Hmac2KeyPair', function () {
    it('should compute these known values', function () {
      let buf = Hash.sha256(Buffer.from('test'))
      let keyPair = Kdf.sha256Hmac2KeyPair(buf)
      keyPair.privKey
        .toString()
        .should.equal('KxxVszVMFLGzmxpxR7sMSaWDmqMKLVhKebX5vZbGHyuR8spreQ7V')
      keyPair.pubKey
        .toString()
        .should.equal(
          '03774f761ae89a0d2fda0d532bad62286ae8fcda9bc38c060036296085592a97c1'
        )
    })
  })

  describe('@sha256Hmac2PrivKey', function () {
    it('should compute this known privKey', function () {
      let buf = Hash.sha256(Buffer.from('test'))
      let privKey = Kdf.sha256Hmac2PrivKey(buf)
      privKey
        .toString()
        .should.equal('KxxVszVMFLGzmxpxR7sMSaWDmqMKLVhKebX5vZbGHyuR8spreQ7V')
    })
  })
})
