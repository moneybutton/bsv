'use strict'

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
