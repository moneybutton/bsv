/* global describe,it */
'use strict'
let BIP68 = require('../lib/bip68')
let should = require('chai').should()

describe('BIP68', function () {
  it('should exist', function () {
    should.exist(BIP68)
    should.exist(BIP68())
  })

  describe('@seqnum2height', function () {
    it('should convert seqnum to height', function () {
      BIP68.seqnum2height(0xffffffff).should.equal(0x0000ffff)
    })
  })

  describe('@height2seqnum', function () {
    it('should convert height to seqnum', function () {
      BIP68.height2seqnum(0x0000ffff).should.equal(0x0000ffff)
    })
  })

  describe('@seqnum2time', function () {
    it('should convert seqnum to time', function () {
      BIP68.seqnum2time(0x0000000f).should.equal(0x0000000f << 9)
      BIP68.seqnum2time(0x0fffffff).should.equal(0x0000ffff << 9)
    })
  })

  describe('@time2seqnum', function () {
    it('should convert time to seqnum', function () {
      BIP68.time2seqnum(0x00000001 << 9).should.equal(0x00000001 | (1 << 22))
      BIP68.time2seqnum(0x000000ff << 9).should.equal(0x000000ff | (1 << 22))
    })
  })

  describe('@seqnumIsDisabled', function () {
    it('should know if seqnum interpretation as lock time is disabled', function () {
      BIP68.seqnumIsDisabled(1 << 31).should.equal(true)
      BIP68.seqnumIsDisabled(1 << 30).should.equal(false)
    })
  })

  describe('@seqnumIsTime', function () {
    it('should know if seqnum is time', function () {
      BIP68.seqnumIsTime(1 << 22).should.equal(true)
      BIP68.seqnumIsTime(1 << 21).should.equal(false)
    })
  })

  describe('@seqnumValue', function () {
    it('should get the value', function () {
      BIP68.seqnumValue(0xfffffff).should.equal(0x0000ffff)
    })
  })
})
