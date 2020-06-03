/* global describe,it */
'use strict'
import { WorkersResult } from '../lib/workers-result'
import { cmp } from '../lib/cmp'
import should from 'should'

describe('WorkersResult', function () {
  it('should satisfy this basic API', function () {
    const workersResult = new WorkersResult()
    should.exist(workersResult)
  })

  describe('#fromResult', function () {
    it('should make a workersResult from a string', function () {
      const result = 'test result'
      const workersResult = new WorkersResult().fromResult(result, 0)
      cmp(
        workersResult.resbuf,
        Buffer.from(JSON.stringify(result))
      ).should.equal(true)
      workersResult.isError.should.equal(false)
      workersResult.id.should.equal(0)
    })
  })

  describe('@fromResult', function () {
    it('should make a workersResult from a string', function () {
      const result = 'test result'
      const workersResult = WorkersResult.fromResult(result, 0)
      cmp(
        workersResult.resbuf,
        Buffer.from(JSON.stringify(result))
      ).should.equal(true)
      workersResult.isError.should.equal(false)
      workersResult.id.should.equal(0)
    })
  })

  describe('#fromError', function () {
    it('should make a workersResult from an error', function () {
      const error = new Error('oh noes, error')
      const workersResult = new WorkersResult().fromError(error, 0)
      cmp(
        workersResult.resbuf,
        Buffer.from(JSON.stringify(error.message))
      ).should.equal(true)
      workersResult.isError.should.equal(true)
      workersResult.id.should.equal(0)
    })
  })

  describe('#toBuffer', function () {
    it('should make a buffer from a workersResult', function () {
      const result = 'test result'
      const workersResult = new WorkersResult().fromResult(result, 0)
      workersResult.toBuffer().length.should.greaterThan(0)
    })

    it('should make a buffer from a workersResult error', function () {
      const error = new Error('oh noes, error')
      const workersResult = new WorkersResult().fromError(error, 0)
      workersResult.toBuffer().length.should.greaterThan(0)
    })
  })

  describe('#fromBuffer', function () {
    it('should make a workersResult from a workersResult buffer', function () {
      const result = 'test result'
      let workersResult = new WorkersResult().fromResult(result, 0)
      const buf = workersResult.toBuffer()
      workersResult = new WorkersResult().fromBuffer(buf)
      cmp(
        workersResult.resbuf,
        Buffer.from(JSON.stringify(result))
      ).should.equal(true)
    })

    it('should make a workersResult error from a workersResult buffer', function () {
      const error = new Error('oh noes, error')
      let workersResult = new WorkersResult().fromError(error, 0)
      const buf = workersResult.toBuffer()
      workersResult = new WorkersResult().fromBuffer(buf)
      cmp(
        workersResult.resbuf,
        Buffer.from(JSON.stringify(error.message))
      ).should.equal(true)
    })
  })
})
