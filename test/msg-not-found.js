/* global describe,it */
'use strict'
let Inv = require('../lib/inv')
let MsgNotFound = require('../lib/msg-not-found')
let should = require('chai').should()

describe('MsgNotFound', function () {
  it('should exist', function () {
    should.exist(MsgNotFound)
    should.exist(MsgNotFound())
  })

  describe('#fromInvs', function () {
    it('should convert from invs', function () {
      let inv = Inv().fromBuffer(new Buffer('01000000' + '0'.repeat(64), 'hex'))
      let msginv = MsgNotFound().fromInvs([inv])
      msginv.getCmd().should.equal('notfound')
      msginv.databuf.length.should.equal(1 + 4 + 32)
    })
  })

  describe('#toInvs', function () {
    it('should convert to invs', function () {
      let inv = Inv().fromBuffer(new Buffer('01000000' + '0'.repeat(64), 'hex'))
      let msginv = MsgNotFound().fromInvs([inv])
      let invs2 = msginv.toInvs()
      invs2.length.should.equal(1)
      ;(invs2[0] instanceof Inv).should.equal(true)
    })
  })

  describe('#isValid', function () {
    it('should know this is a valid msg invs', function () {
      let inv = Inv().fromBuffer(new Buffer('01000000' + '0'.repeat(64), 'hex'))
      let msginv = MsgNotFound().fromInvs([inv])
      msginv.isValid().should.equal(true)
    })
  })
})
