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
})
