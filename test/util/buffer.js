'use strict'

require('chai').should()
var expect = require('chai').expect

var bsv = require('../..')
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
