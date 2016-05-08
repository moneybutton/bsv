/* global describe,it */
'use strict'
let MsgVerAck = require('../lib/msg-ver-ack')
let should = require('chai').should()

describe('MsgVerAck', function () {
  it('should exist', function () {
    should.exist(MsgVerAck)
    should.exist(new MsgVerAck())
  })

  describe('#isValid', function () {
    it('should know this is a valid verack msg', function () {
      new MsgVerAck().isValid().should.equal(true)
    })
  })
})
