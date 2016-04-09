/* global describe,it */
'use strict'
let MsgMempool = require('../lib/msgheaders')
let should = require('chai').should()

describe('MsgMempool', function () {
  it('should exist', function () {
    should.exist(MsgMempool)
    should.exist(MsgMempool())
  })

  describe('#isValid', function () {
    it('should know this is a valid mempool msg', function () {
      MsgMempool().isValid().should.equal(true)
    })
  })
})
