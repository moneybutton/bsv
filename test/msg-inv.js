/* global describe,it */
'use strict'
let Inv = require('../lib/inv')
let MsgInv = require('../lib/msg-inv')
let asink = require('asink')
let should = require('chai').should()

describe('MsgInv', function () {
  it('should exist', function () {
    should.exist(MsgInv)
    should.exist(new MsgInv())
  })

  describe('#fromInvs', function () {
    it('should convert from invs', function () {
      let inv = new Inv().fromBuffer(new Buffer('01000000' + '0'.repeat(64), 'hex'))
      let msginv = new MsgInv().fromInvs([inv])
      msginv.getCmd().should.equal('inv')
      msginv.dataBuf.length.should.equal(1 + 4 + 32)
    })
  })

  describe('@fromInvs', function () {
    it('should convert from invs', function () {
      let inv = new Inv().fromBuffer(new Buffer('01000000' + '0'.repeat(64), 'hex'))
      let msginv = MsgInv.fromInvs([inv])
      msginv.getCmd().should.equal('inv')
      msginv.dataBuf.length.should.equal(1 + 4 + 32)
    })
  })

  describe('#asyncFromInvs', function () {
    it('should convert from invs', function () {
      return asink(function * () {
        let inv = new Inv().fromBuffer(new Buffer('01000000' + '0'.repeat(64), 'hex'))
        let msginv = yield new MsgInv().asyncFromInvs([inv])
        msginv.getCmd().should.equal('inv')
        msginv.dataBuf.length.should.equal(1 + 4 + 32)
      }, this)
    })
  })

  describe('@asyncFromInvs', function () {
    it('should convert from invs', function () {
      return asink(function * () {
        let inv = new Inv().fromBuffer(new Buffer('01000000' + '0'.repeat(64), 'hex'))
        let msginv = yield MsgInv.asyncFromInvs([inv])
        msginv.getCmd().should.equal('inv')
        msginv.dataBuf.length.should.equal(1 + 4 + 32)
      }, this)
    })
  })

  describe('#toInvs', function () {
    it('should convert to invs', function () {
      let inv = new Inv().fromBuffer(new Buffer('01000000' + '0'.repeat(64), 'hex'))
      let msginv = new MsgInv().fromInvs([inv])
      let invs2 = msginv.toInvs()
      invs2.length.should.equal(1)
      ;(invs2[0] instanceof Inv).should.equal(true)
    })
  })

  describe('#isValid', function () {
    it('should know this is a valid msg invs', function () {
      let inv = new Inv().fromBuffer(new Buffer('01000000' + '0'.repeat(64), 'hex'))
      let msginv = new MsgInv().fromInvs([inv])
      msginv.isValid().should.equal(true)
    })
  })
})
