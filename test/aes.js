/* global describe,it */
import should from 'should'
import { Hash } from '../lib/hash'
import { Aes } from '../lib/aes'
import vectors from './vectors/aes.json'

describe('Aes', function () {
  let m128 = Hash.sha256(Buffer.from('test1')).slice(0, 128 / 8)

  let k128 = Hash.sha256(Buffer.from('test2')).slice(0, 128 / 8)
  let k192 = Hash.sha256(Buffer.from('test2')).slice(0, 192 / 8)
  let k256 = Hash.sha256(Buffer.from('test2')).slice(0, 256 / 8)

  let e128 = Buffer.from('3477e13884125038f4dc24e9d2cfbbc7', 'hex')
  let e192 = Buffer.from('b670954c0e2da1aaa5f9063de04eb961', 'hex')
  let e256 = Buffer.from('dd2ce24581183a4a7c0b1068f8bc79f0', 'hex')

  should.exist(Aes)

  describe('@encrypt', function () {
    it('should encrypt with a 128 bit key', function () {
      let encBuf = Aes.encrypt(m128, k128)
      encBuf.toString('hex').should.equal(e128.toString('hex'))
    })

    it('should encrypt with a 192 bit key', function () {
      let encBuf = Aes.encrypt(m128, k192)
      encBuf.toString('hex').should.equal(e192.toString('hex'))
    })

    it('should encrypt with a 256 bit key', function () {
      let encBuf = Aes.encrypt(m128, k256)
      encBuf.toString('hex').should.equal(e256.toString('hex'))
    })
  })

  describe('@decrypt', function () {
    it('should encrypt/decrypt with a 128 bit key', function () {
      let encBuf = Aes.encrypt(m128, k128)
      let m = Aes.decrypt(encBuf, k128)
      m.toString('hex').should.equal(m128.toString('hex'))
    })

    it('should encrypt/decrypt with a 192 bit key', function () {
      let encBuf = Aes.encrypt(m128, k192)
      let m = Aes.decrypt(encBuf, k192)
      m.toString('hex').should.equal(m128.toString('hex'))
    })

    it('should encrypt/decrypt with a 256 bit key', function () {
      let encBuf = Aes.encrypt(m128, k256)
      let m = Aes.decrypt(encBuf, k256)
      m.toString('hex').should.equal(m128.toString('hex'))
    })
  })

  describe('@buf2Words', function () {
    it('should convert this 4 length buffer into an array', function () {
      let buf = Buffer.from([0, 0, 0, 0])
      let words = Aes.buf2Words(buf)
      words.length.should.equal(1)
    })

    it('should throw an error on this 5 length buffer', function () {
      let buf = Buffer.from([0, 0, 0, 0, 0])
      ;(function () {
        Aes.buf2Words(buf)
      }.should.throw())
    })
  })

  describe('@words2Buf', function () {
    it('should convert this array into a buffer', function () {
      let a = [100, 0]
      let buf = Aes.words2Buf(a)
      buf.length.should.equal(8)
    })
  })

  describe('vectors', function () {
    vectors.forEach(function (vector, i) {
      it('should pass sjcl test vector ' + i, function () {
        let keyBuf = Buffer.from(vector.key, 'hex')
        let ptbuf = Buffer.from(vector.pt, 'hex')
        let ctBuf = Buffer.from(vector.ct, 'hex')

        Aes.encrypt(ptbuf, keyBuf)
          .toString('hex')
          .should.equal(ctBuf.toString('hex'))
        Aes.decrypt(ctBuf, keyBuf)
          .toString('hex')
          .should.equal(ptbuf.toString('hex'))
      })
    })
  })
})
