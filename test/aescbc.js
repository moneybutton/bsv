/* global describe,it */
'use strict'
let should = require('chai').should()
let Aescbc = require('../lib/aescbc')
let vectors = require('./vectors/aescbc')

describe('Aescbc', function () {
  should.exist(Aescbc)

  describe('@encrypt', function () {
    it('should return encrypt one block', function () {
      let cipherKeyBuf = new Buffer(256 / 8)
      cipherKeyBuf.fill(0x10)
      let ivBuf = new Buffer(128 / 8)
      ivBuf.fill(0)
      let messageBuf = new Buffer(128 / 8 - 1)
      messageBuf.fill(0)
      let encBuf = Aescbc.encrypt(messageBuf, cipherKeyBuf, ivBuf)
      encBuf.length.should.equal(128 / 8 + 128 / 8)
    })

    it('should return encrypt two blocks', function () {
      let cipherKeyBuf = new Buffer(256 / 8)
      cipherKeyBuf.fill(0x10)
      let ivBuf = new Buffer(128 / 8)
      ivBuf.fill(0)
      let messageBuf = new Buffer(128 / 8)
      messageBuf.fill(0)
      let encBuf = Aescbc.encrypt(messageBuf, cipherKeyBuf, ivBuf)
      encBuf.length.should.equal(128 / 8 + 128 / 8 + 128 / 8)
    })
  })

  describe('@decrypt', function () {
    it('should decrypt that which was encrypted', function () {
      let cipherKeyBuf = new Buffer(256 / 8)
      cipherKeyBuf.fill(0x10)
      let ivBuf = new Buffer(128 / 8)
      ivBuf.fill(0)
      let messageBuf = new Buffer(128 / 8)
      messageBuf.fill(0)
      let encBuf = Aescbc.encrypt(messageBuf, cipherKeyBuf, ivBuf)
      let messageBuf2 = Aescbc.decrypt(encBuf, cipherKeyBuf)
      messageBuf2.toString('hex').should.equal(messageBuf.toString('hex'))
    })
  })

  describe('vectors', function () {
    vectors.forEach(function (vector, i) {
      it('should pass sjcl test vector ' + i, function () {
        let keyBuf = new Buffer(vector.key, 'hex')
        let ivBuf = new Buffer(vector.iv, 'hex')
        let ptbuf = new Buffer(vector.pt, 'hex')
        let ctBuf = new Buffer(vector.ct, 'hex')
        Aescbc.encrypt(ptbuf, keyBuf, ivBuf).slice(128 / 8).toString('hex').should.equal(vector.ct)
        Aescbc.decrypt(Buffer.concat([ivBuf, ctBuf]), keyBuf).toString('hex').should.equal(vector.pt)
      })
    })
  })
})
