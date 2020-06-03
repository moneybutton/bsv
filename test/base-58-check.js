/* global describe,it */
'use strict'
import should from 'should'
import { Base58Check } from '../lib/base-58-check'
import { Base58 } from '../lib/base-58'

describe('Base58Check', function () {
  const buf = Buffer.from([0, 1, 2, 3, 253, 254, 255])
  const enc = '14HV44ipwoaqfg'

  it('should make an instance with "new"', function () {
    const b58 = new Base58Check()
    should.exist(b58)
  })

  it('should make an instance without "new"', function () {
    const b58 = new Base58Check()
    should.exist(b58)
  })

  it('should allow this handy syntax', function () {
    new Base58Check(buf).toString().should.equal(enc)
    new Base58Check()
      .fromString(enc)
      .toBuffer()
      .toString('hex')
      .should.equal(buf.toString('hex'))
  })

  describe('#fromObject', function () {
    it('should set a buf', function () {
      should.exist(new Base58Check().fromObject({ buf: buf }).buf)
    })
  })

  describe('@encode', function () {
    it('should encode the buffer accurately', function () {
      Base58Check.encode(buf).should.equal(enc)
    })

    it('should throw an error when the input is not a buffer', function () {
      ;(function () {
        Base58Check.encode('string')
      }.should.throw('Input must be a buffer'))
    })
  })

  describe('@decode', function () {
    it('should decode this encoded value correctly', function () {
      Base58Check.decode(enc)
        .toString('hex')
        .should.equal(buf.toString('hex'))
    })

    it('should throw an error when input is not a string', function () {
      ;(function () {
        Base58Check.decode(5)
      }.should.throw('Input must be a string'))
    })

    it('should throw an error when input is too short', function () {
      ;(function () {
        Base58Check.decode(enc.slice(0, 1))
      }.should.throw('Input string too short'))
    })

    it('should throw an error when there is a checksum mismatch', function () {
      const buf2 = Base58.decode(enc)
      buf2[0] = buf2[0] + 1
      const enc2 = Base58.encode(buf2)
      ;(function () {
        Base58Check.decode(enc2)
      }.should.throw('Checksum mismatch'))
    })
  })

  describe('#fromHex', function () {
    it('should set buffer from hex', function () {
      const b58 = new Base58Check().fromHex(buf.toString('hex'))
      b58.buf.toString('hex').should.equal(buf.toString('hex'))
    })
  })

  describe('#fromBuffer', function () {
    it('should not fail', function () {
      should.exist(new Base58Check().fromBuffer(buf))
    })

    it('should set buffer', function () {
      const b58 = new Base58Check().fromBuffer(buf)
      b58.buf.toString('hex').should.equal(buf.toString('hex'))
    })
  })

  describe('#fromString', function () {
    it('should convert this known string to a buffer', function () {
      new Base58Check()
        .fromString(enc)
        .toBuffer()
        .toString('hex')
        .should.equal(buf.toString('hex'))
    })
  })

  describe('#toHex', function () {
    it('should return the buffer', function () {
      const b58 = new Base58Check(buf)
      b58.toHex().should.equal(buf.toString('hex'))
    })
  })

  describe('#toBuffer', function () {
    it('should return the buffer', function () {
      const b58 = new Base58Check(buf)
      b58
        .toBuffer()
        .toString('hex')
        .should.equal(buf.toString('hex'))
    })
  })

  describe('#toString', function () {
    it('should return the buffer', function () {
      const b58 = new Base58Check(buf)
      b58.toString().should.equal(enc)
    })
  })
})
