/* global describe,it */
'use strict'
let MsgAlert = require('../lib/msg-addr')
let should = require('chai').should()

describe('MsgAlert', function () {
  it('should exist', function () {
    should.exist(MsgAlert)
    should.exist(MsgAlert())
  })

  describe('#isValid', function () {
    it('should know this is a possibly-valid msgalert', function () {
      let msgalert = MsgAlert()
        .setData(new Buffer(0))
      msgalert.isValid().should.equal(true)
    })
  })
})
