/* global describe,it */
'use strict'
let WorkersResult = require('../lib/workersresult')
let cmp = require('../lib/cmp')
let should = require('chai').should()

describe('WorkersResult', function () {
  it('should satisfy this basic API', function () {
    let workersResult = WorkersResult()
    should.exist(workersResult)
  })

  describe('#fromResult', function () {
    it('should make a workersResult from a string', function () {
      let result = 'test result'
      let workersResult = WorkersResult().fromResult(result, 0)
      cmp(workersResult.resbuf, new Buffer(JSON.stringify(result))).should.equal(true)
      workersResult.isError.should.equal(false)
      workersResult.id.should.equal(0)
    })
  })

  describe('#fromError', function () {
    it('should make a workersResult from an error', function () {
      let error = new Error('oh noes, error')
      let workersResult = WorkersResult().fromError(error, 0)
      cmp(workersResult.resbuf, new Buffer(JSON.stringify(error.message))).should.equal(true)
      workersResult.isError.should.equal(true)
      workersResult.id.should.equal(0)
    })
  })

  describe('#toBuffer', function () {
    it('should make a buffer from a workersResult', function () {
      let result = 'test result'
      let workersResult = WorkersResult().fromResult(result, 0)
      workersResult.toBuffer().length.should.greaterThan(0)
    })

    it('should make a buffer from a workersResult error', function () {
      let error = new Error('oh noes, error')
      let workersResult = WorkersResult().fromError(error, 0)
      workersResult.toBuffer().length.should.greaterThan(0)
    })
  })

  describe('#fromBuffer', function () {
    it('should make a workersResult from a workersResult buffer', function () {
      let result = 'test result'
      let workersResult = WorkersResult().fromResult(result, 0)
      let buf = workersResult.toBuffer()
      workersResult = WorkersResult().fromBuffer(buf)
      cmp(workersResult.resbuf, new Buffer(JSON.stringify(result))).should.equal(true)
    })

    it('should make a workersResult error from a workersResult buffer', function () {
      let error = new Error('oh noes, error')
      let workersResult = WorkersResult().fromError(error, 0)
      let buf = workersResult.toBuffer()
      workersResult = WorkersResult().fromBuffer(buf)
      cmp(workersResult.resbuf, new Buffer(JSON.stringify(error.message))).should.equal(true)
    })
  })
})
