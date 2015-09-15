'use strict'
let should = require('chai').should()
let Hash = require('../lib/hash')
let AES = require('../lib/aes')
let vectors = require('./vectors/aes')

describe('AES', function () {
  let m128 = Hash.sha256(new Buffer('test1')).slice(0, 128 / 8)

  let k128 = Hash.sha256(new Buffer('test2')).slice(0, 128 / 8)
  let k192 = Hash.sha256(new Buffer('test2')).slice(0, 192 / 8)
  let k256 = Hash.sha256(new Buffer('test2')).slice(0, 256 / 8)

  let e128 = new Buffer('3477e13884125038f4dc24e9d2cfbbc7', 'hex')
  let e192 = new Buffer('b670954c0e2da1aaa5f9063de04eb961', 'hex')
  let e256 = new Buffer('dd2ce24581183a4a7c0b1068f8bc79f0', 'hex')

  describe('@encrypt', function () {
    it('should encrypt with a 128 bit key', function () {
      let encbuf = AES.encrypt(m128, k128)
      encbuf.toString('hex').should.equal(e128.toString('hex'))
    })

    it('should encrypt with a 192 bit key', function () {
      let encbuf = AES.encrypt(m128, k192)
      encbuf.toString('hex').should.equal(e192.toString('hex'))
    })

    it('should encrypt with a 256 bit key', function () {
      let encbuf = AES.encrypt(m128, k256)
      encbuf.toString('hex').should.equal(e256.toString('hex'))
    })

  })

  describe('@decrypt', function () {
    it('should encrypt/decrypt with a 128 bit key', function () {
      let encbuf = AES.encrypt(m128, k128)
      let m = AES.decrypt(encbuf, k128)
      m.toString('hex').should.equal(m128.toString('hex'))
    })

    it('should encrypt/decrypt with a 192 bit key', function () {
      let encbuf = AES.encrypt(m128, k192)
      let m = AES.decrypt(encbuf, k192)
      m.toString('hex').should.equal(m128.toString('hex'))
    })

    it('should encrypt/decrypt with a 256 bit key', function () {
      let encbuf = AES.encrypt(m128, k256)
      let m = AES.decrypt(encbuf, k256)
      m.toString('hex').should.equal(m128.toString('hex'))
    })

  })

  describe('@buf2words', function () {
    it('should convert this 4 length buffer into an array', function () {
      let buf = new Buffer([0, 0, 0, 0])
      let words = AES.buf2words(buf)
      words.length.should.equal(1)
    })

    it('should throw an error on this 5 length buffer', function () {
      let buf = new Buffer([0, 0, 0, 0, 0]);(function () {
        let words = AES.buf2words(buf)
      }).should.throw()
    })

  })

  describe('@words2buf', function () {
    it('should convert this array into a buffer', function () {
      let a = [100, 0]
      let buf = AES.words2buf(a)
      buf.length.should.equal(8)
    })

  })

  describe('vectors', function () {
    vectors.forEach(function (vector, i) {
      it('should pass sjcl test vector ' + i, function () {
        let keybuf = new Buffer(vector.key, 'hex')
        let ptbuf = new Buffer(vector.pt, 'hex')
        let ctbuf = new Buffer(vector.ct, 'hex')

        AES.encrypt(ptbuf, keybuf).toString('hex').should.equal(ctbuf.toString('hex'))
        AES.decrypt(ctbuf, keybuf).toString('hex').should.equal(ptbuf.toString('hex'))
      })
    })

  })

})
