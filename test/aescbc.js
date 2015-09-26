/* global describe,it */
'use strict'
let should = require('chai').should()
let AESCBC = require('../lib/aescbc')
let vectors = require('./vectors/aescbc')

describe('AESCBC', function () {
  should.exist(AESCBC)

  describe('@encrypt', function () {
    it('should return encrypt one block', function () {
      let cipherkeybuf = new Buffer(256 / 8)
      cipherkeybuf.fill(0x10)
      let ivbuf = new Buffer(128 / 8)
      ivbuf.fill(0)
      let messagebuf = new Buffer(128 / 8 - 1)
      messagebuf.fill(0)
      let encbuf = AESCBC.encrypt(messagebuf, cipherkeybuf, ivbuf)
      encbuf.length.should.equal(128 / 8 + 128 / 8)
    })

    it('should return encrypt two blocks', function () {
      let cipherkeybuf = new Buffer(256 / 8)
      cipherkeybuf.fill(0x10)
      let ivbuf = new Buffer(128 / 8)
      ivbuf.fill(0)
      let messagebuf = new Buffer(128 / 8)
      messagebuf.fill(0)
      let encbuf = AESCBC.encrypt(messagebuf, cipherkeybuf, ivbuf)
      encbuf.length.should.equal(128 / 8 + 128 / 8 + 128 / 8)
    })
  })

  describe('@decrypt', function () {
    it('should decrypt that which was encrypted', function () {
      let cipherkeybuf = new Buffer(256 / 8)
      cipherkeybuf.fill(0x10)
      let ivbuf = new Buffer(128 / 8)
      ivbuf.fill(0)
      let messagebuf = new Buffer(128 / 8)
      messagebuf.fill(0)
      let encbuf = AESCBC.encrypt(messagebuf, cipherkeybuf, ivbuf)
      let messagebuf2 = AESCBC.decrypt(encbuf, cipherkeybuf)
      messagebuf2.toString('hex').should.equal(messagebuf.toString('hex'))
    })
  })

  describe('vectors', function () {
    vectors.forEach(function (vector, i) {
      it('should pass sjcl test vector ' + i, function () {
        let keybuf = new Buffer(vector.key, 'hex')
        let ivbuf = new Buffer(vector.iv, 'hex')
        let ptbuf = new Buffer(vector.pt, 'hex')
        let ctbuf = new Buffer(vector.ct, 'hex')
        AESCBC.encrypt(ptbuf, keybuf, ivbuf).slice(128 / 8).toString('hex').should.equal(vector.ct)
        AESCBC.decrypt(Buffer.concat([ivbuf, ctbuf]), keybuf).toString('hex').should.equal(vector.pt)
      })
    })
  })
})
