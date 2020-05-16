/* global describe,it */
'use strict'
import should from 'should'
import { Aescbc } from '../lib/aescbc'
import vectors from './vectors/aescbc.json'

describe('Aescbc', function () {
  should.exist(Aescbc)

  describe('@encrypt', function () {
    it('should return encrypt one block', function () {
      let cipherKeyBuf = Buffer.alloc(256 / 8)
      cipherKeyBuf.fill(0x10)
      let ivBuf = Buffer.alloc(128 / 8)
      ivBuf.fill(0)
      let messageBuf = Buffer.alloc(128 / 8 - 1)
      messageBuf.fill(0)
      let encBuf = Aescbc.encrypt(messageBuf, cipherKeyBuf, ivBuf)
      encBuf.length.should.equal(128 / 8 + 128 / 8)
    })

    it('should return encrypt two blocks', function () {
      let cipherKeyBuf = Buffer.alloc(256 / 8)
      cipherKeyBuf.fill(0x10)
      let ivBuf = Buffer.alloc(128 / 8)
      ivBuf.fill(0)
      let messageBuf = Buffer.alloc(128 / 8)
      messageBuf.fill(0)
      let encBuf = Aescbc.encrypt(messageBuf, cipherKeyBuf, ivBuf)
      encBuf.length.should.equal(128 / 8 + 128 / 8 + 128 / 8)
    })
  })

  describe('@decrypt', function () {
    it('should decrypt that which was encrypted', function () {
      let cipherKeyBuf = Buffer.alloc(256 / 8)
      cipherKeyBuf.fill(0x10)
      let ivBuf = Buffer.alloc(128 / 8)
      ivBuf.fill(0)
      let messageBuf = Buffer.alloc(128 / 8)
      messageBuf.fill(0)
      let encBuf = Aescbc.encrypt(messageBuf, cipherKeyBuf, ivBuf)
      let messageBuf2 = Aescbc.decrypt(encBuf, cipherKeyBuf)
      messageBuf2.toString('hex').should.equal(messageBuf.toString('hex'))
    })
  })

  describe('vectors', function () {
    vectors.forEach(function (vector, i) {
      it('should pass sjcl test vector ' + i, function () {
        let keyBuf = Buffer.from(vector.key, 'hex')
        let ivBuf = Buffer.from(vector.iv, 'hex')
        let ptbuf = Buffer.from(vector.pt, 'hex')
        let ctBuf = Buffer.from(vector.ct, 'hex')
        Aescbc.encrypt(ptbuf, keyBuf, ivBuf)
          .slice(128 / 8)
          .toString('hex')
          .should.equal(vector.ct)
        Aescbc.decrypt(Buffer.concat([ivBuf, ctBuf]), keyBuf)
          .toString('hex')
          .should.equal(vector.pt)
      })
    })
  })
})
