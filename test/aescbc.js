/* global describe,it */
'use strict'
let should = require('chai').should()
let Aescbc = require('../lib/aescbc')
let vectors = require('./vectors/aescbc')

describe('Aescbc', function () {
  should.exist(Aescbc)

  describe('@encrypt', function () {
    it('should return encrypt one block', function () {
      let cipherKeybuf = new Buffer(256 / 8)
      cipherKeybuf.fill(0x10)
      let ivbuf = new Buffer(128 / 8)
      ivbuf.fill(0)
      let messageBuf = new Buffer(128 / 8 - 1)
      messageBuf.fill(0)
      let encBuf = Aescbc.encrypt(messageBuf, cipherKeybuf, ivbuf)
      encBuf.length.should.equal(128 / 8 + 128 / 8)
    })

    it('should return encrypt two blocks', function () {
      let cipherKeybuf = new Buffer(256 / 8)
      cipherKeybuf.fill(0x10)
      let ivbuf = new Buffer(128 / 8)
      ivbuf.fill(0)
      let messageBuf = new Buffer(128 / 8)
      messageBuf.fill(0)
      let encBuf = Aescbc.encrypt(messageBuf, cipherKeybuf, ivbuf)
      encBuf.length.should.equal(128 / 8 + 128 / 8 + 128 / 8)
    })
  })

  describe('@decrypt', function () {
    it('should decrypt that which was encrypted', function () {
      let cipherKeybuf = new Buffer(256 / 8)
      cipherKeybuf.fill(0x10)
      let ivbuf = new Buffer(128 / 8)
      ivbuf.fill(0)
      let messageBuf = new Buffer(128 / 8)
      messageBuf.fill(0)
      let encBuf = Aescbc.encrypt(messageBuf, cipherKeybuf, ivbuf)
      let messageBuf2 = Aescbc.decrypt(encBuf, cipherKeybuf)
      messageBuf2.toString('hex').should.equal(messageBuf.toString('hex'))
    })
  })

  describe('vectors', function () {
    vectors.forEach(function (vector, i) {
      it('should pass sjcl test vector ' + i, function () {
        let keybuf = new Buffer(vector.key, 'hex')
        let ivbuf = new Buffer(vector.iv, 'hex')
        let ptbuf = new Buffer(vector.pt, 'hex')
        let ctbuf = new Buffer(vector.ct, 'hex')
        Aescbc.encrypt(ptbuf, keybuf, ivbuf).slice(128 / 8).toString('hex').should.equal(vector.ct)
        Aescbc.decrypt(Buffer.concat([ivbuf, ctbuf]), keybuf).toString('hex').should.equal(vector.pt)
      })
    })
  })
})
