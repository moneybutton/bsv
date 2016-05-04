/* global describe,it */
'use strict'
let Inv = require('../lib/inv')
let MsgInv = require('../lib/msg-inv')
let should = require('chai').should()

describe('MsgInv', function () {
  it('should exist', function () {
    should.exist(MsgInv)
    should.exist(MsgInv())
  })

  describe('#fromInvs', function () {
    it('should convert from invs', function () {
      let inv = new Inv().fromBuffer(new Buffer('01000000' + '0'.repeat(64), 'hex'))
      let msginv = MsgInv().fromInvs([inv])
      msginv.getCmd().should.equal('inv')
      msginv.databuf.length.should.equal(1 + 4 + 32)
    })
  })

  describe('#toInvs', function () {
    it('should convert to invs', function () {
      let inv = new Inv().fromBuffer(new Buffer('01000000' + '0'.repeat(64), 'hex'))
      let msginv = MsgInv().fromInvs([inv])
      let invs2 = msginv.toInvs()
      invs2.length.should.equal(1)
      ;(invs2[0] instanceof Inv).should.equal(true)
    })
  })

  describe('#isValid', function () {
    it('should know this is a valid msg invs', function () {
      let inv = new Inv().fromBuffer(new Buffer('01000000' + '0'.repeat(64), 'hex'))
      let msginv = MsgInv().fromInvs([inv])
      msginv.isValid().should.equal(true)
    })
  })
})
