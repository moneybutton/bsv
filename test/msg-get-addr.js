/* global describe,it */
'use strict'
let MsgGetAddr = require('../lib/msg-get-addr')
let should = require('chai').should()

describe('MsgGetAddr', function () {
  it('should exist', function () {
    should.exist(MsgGetAddr)
    should.exist(new MsgGetAddr())
  })

  describe('#isValid', function () {
    it('should know this is a valid mempool msg', function () {
      new MsgGetAddr().isValid().should.equal(true)
    })
  })
})
