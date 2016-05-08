/* global describe,it */
'use strict'
let MsgSendHeaders = require('../lib/msg-send-headers')
let should = require('chai').should()

describe('MsgSendHeaders', function () {
  it('should exist', function () {
    should.exist(MsgSendHeaders)
    should.exist(new MsgSendHeaders())
  })

  describe('#isValid', function () {
    it('should know this is a valid sendheaders msg', function () {
      new MsgSendHeaders().isValid().should.equal(true)
    })
  })
})
