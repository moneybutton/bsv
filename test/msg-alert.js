/* global describe,it */
'use strict'
let MsgAlert = require('../lib/msg-alert')
let should = require('chai').should()

describe('MsgAlert', function () {
  it('should exist', function () {
    should.exist(MsgAlert)
    should.exist(new MsgAlert())
  })

  describe('#isValid', function () {
    it('should know this is a possibly-valid msgalert', function () {
      let msgalert = new MsgAlert()
        .setData(new Buffer(0))
      msgalert.isValid().should.equal(true)
    })
  })
})
