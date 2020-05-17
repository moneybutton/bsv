/* global describe,it */
'use strict'
import { Base58 } from '../lib/base-58'
import should from 'should'

describe('Base58', function () {
  const buf = Buffer.from([0, 1, 2, 3, 253, 254, 255])
  const enc = '1W7N4RuG'

  it('should make an instance with "new"', function () {
    const b58 = new Base58()
    should.exist(b58)
  })

  it('should make an instance without "new"', function () {
    const b58 = new Base58()
    should.exist(b58)
  })

  it('should allow this handy syntax', function () {
    new Base58(buf).toString().should.equal(enc)
    new Base58()
      .fromString(enc)
      .toBuffer()
      .toString('hex')
      .should.equal(buf.toString('hex'))
  })

  describe('#fromObject', function () {
    it('should set a blank buffer', function () {
      new Base58().fromObject({ buf: Buffer.from([]) })
    })
  })

  describe('@encode', function () {
    it('should encode the buffer accurately', function () {
      Base58.encode(buf).should.equal(enc)
    })

    it('should throw an error when the Input is not a buffer', function () {
      ;(function () {
        Base58.encode('string')
      }.should.throw('Input should be a buffer'))
    })
  })

  describe('@decode', function () {
    it('should decode this encoded value correctly', function () {
      Base58.decode(enc)
        .toString('hex')
        .should.equal(buf.toString('hex'))
      Buffer.isBuffer(Base58.decode(enc)).should.equal(true)
    })

    it('should throw an error when Input is not a string', function () {
      ;(function () {
        Base58.decode(5)
      }.should.throw('Input should be a string'))
    })
  })

  describe('#fromHex', function () {
    it('should set buffer', function () {
      const b58 = new Base58().fromHex(buf.toString('hex'))
      b58.buf.toString('hex').should.equal(buf.toString('hex'))
    })
  })

  describe('#fromBuffer', function () {
    it('should not fail', function () {
      should.exist(new Base58().fromBuffer(buf))
    })

    it('should set buffer', function () {
      const b58 = new Base58().fromBuffer(buf)
      b58.buf.toString('hex').should.equal(buf.toString('hex'))
    })
  })

  describe('#fromString', function () {
    it('should convert this known string to a buffer', function () {
      new Base58()
        .fromString(enc)
        .toBuffer()
        .toString('hex')
        .should.equal(buf.toString('hex'))
    })
  })

  describe('#toHex', function () {
    it('should return the buffer in hex', function () {
      const b58 = new Base58(buf)
      b58.toHex().should.equal(buf.toString('hex'))
    })
  })

  describe('#toBuffer', function () {
    it('should return the buffer', function () {
      const b58 = new Base58(buf)
      b58
        .toBuffer()
        .toString('hex')
        .should.equal(buf.toString('hex'))
    })
  })

  describe('#toString', function () {
    it('should return the buffer', function () {
      const b58 = new Base58(buf)
      b58.toString().should.equal(enc)
    })
  })
})
