/* global describe,it */
'use strict'
let MsgMemPool = require('../lib/msg-mem-pool')
let should = require('chai').should()

describe('MsgMemPool', function () {
  it('should exist', function () {
    should.exist(MsgMemPool)
    should.exist(new MsgMemPool())
  })

  describe('#isValid', function () {
    it('should know this is a valid mempool msg', function () {
      new MsgMemPool().isValid().should.equal(true)
    })
  })
})
