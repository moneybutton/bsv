'use strict'
/* jshint unused: false */

require('chai').should()
var expect = require('chai').expect

var bsv = require('../..')
var errors = bsv.errors
var BufferUtil = bsv.util.buffer

describe('buffer utils', function () {
  describe('isBuffer', function () {
    it('has no false positive', function () {
      expect(BufferUtil.isBuffer(1)).to.equal(false)
    })
    it('has no false negative', function () {
      expect(BufferUtil.isBuffer(Buffer.alloc(0))).to.equal(true)
    })
  })

  describe('single byte buffer <=> integer', function () {
    it('integerAsSingleByteBuffer should return a buffer of length 1', function () {
      expect(BufferUtil.integerAsSingleByteBuffer(100)[0]).to.equal(100)
    })
    it('should check the type', function () {
      expect(function () {
        BufferUtil.integerAsSingleByteBuffer('invalid')
      }).to.throw(errors.InvalidArgumentType)
      expect(function () {
        BufferUtil.integerFromSingleByteBuffer('invalid')
      }).to.throw(errors.InvalidArgumentType)
    })
    it('works correctly for edge cases', function () {
      expect(BufferUtil.integerAsSingleByteBuffer(255)[0]).to.equal(255)
      expect(BufferUtil.integerAsSingleByteBuffer(-1)[0]).to.equal(255)
    })
    it('does a round trip', function () {
      expect(BufferUtil.integerAsSingleByteBuffer(
        BufferUtil.integerFromSingleByteBuffer(Buffer.from([255]))
      )[0]).to.equal(255)
    })
  })

  describe('4byte buffer integer <=> integer', function () {
    it('integerAsBuffer should return a buffer of length 4', function () {
      expect(BufferUtil.integerAsBuffer(100).length).to.equal(4)
    })
    it('is little endian', function () {
      expect(BufferUtil.integerAsBuffer(100)[3]).to.equal(100)
    })
    it('should check the type', function () {
      expect(function () {
        BufferUtil.integerAsBuffer('invalid')
      }).to.throw(errors.InvalidArgumentType)
      expect(function () {
        BufferUtil.integerFromBuffer('invalid')
      }).to.throw(errors.InvalidArgumentType)
    })
    it('works correctly for edge cases', function () {
      expect(BufferUtil.integerAsBuffer(4294967295)[0]).to.equal(255)
      expect(BufferUtil.integerAsBuffer(4294967295)[3]).to.equal(255)
      expect(BufferUtil.integerAsBuffer(-1)[0]).to.equal(255)
      expect(BufferUtil.integerAsBuffer(-1)[3]).to.equal(255)
    })
    it('does a round trip', function () {
      expect(BufferUtil.integerFromBuffer(
        BufferUtil.integerAsBuffer(10000)
      )).to.equal(10000)
    })
  })

  describe('buffer to hex', function () {
    it('returns an expected value in hexa', function () {
      expect(BufferUtil.bufferToHex(Buffer.from([255, 0, 128]))).to.equal('ff0080')
    })
    it('checks the argument type', function () {
      expect(function () {
        BufferUtil.bufferToHex('invalid')
      }).to.throw(errors.InvalidArgumentType)
    })
    it('round trips', function () {
      var original = Buffer.from([255, 0, 128])
      var hexa = BufferUtil.bufferToHex(original)
      var back = Buffer.from(hexa, 'hex')
      expect(original.equals(back)).to.equal(true)
    })
  })

  describe('reverse', function () {
    it('reverses a buffer', function () {
      // http://bit.ly/1J2Ai4x
      var original = Buffer.from([255, 0, 128])
      var reversed = BufferUtil.reverse(original)
      original[0].should.equal(reversed[2])
      original[1].should.equal(reversed[1])
      original[2].should.equal(reversed[0])
    })
  })
})
