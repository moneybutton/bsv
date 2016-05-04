/* global describe,it */
'use strict'
let Bip68 = require('../lib/bip-68')
let should = require('chai').should()

describe('Bip68', function () {
  it('should exist', function () {
    should.exist(Bip68)
    should.exist(Bip68())
  })

  describe('@nSequence2height', function () {
    it('should convert nSequence to height', function () {
      Bip68.nSequence2height(0xffffffff).should.equal(0x0000ffff)
    })
  })

  describe('@height2nSequence', function () {
    it('should convert height to nSequence', function () {
      Bip68.height2nSequence(0x0000ffff).should.equal(0x0000ffff)
    })
  })

  describe('@nSequence2time', function () {
    it('should convert nSequence to time', function () {
      Bip68.nSequence2time(0x0000000f).should.equal(0x0000000f << 9)
      Bip68.nSequence2time(0x0fffffff).should.equal(0x0000ffff << 9)
    })
  })

  describe('@time2nSequence', function () {
    it('should convert time to nSequence', function () {
      Bip68.time2nSequence(0x00000001 << 9).should.equal(0x00000001 | (1 << 22))
      Bip68.time2nSequence(0x000000ff << 9).should.equal(0x000000ff | (1 << 22))
    })
  })

  describe('@nSequenceIsDisabled', function () {
    it('should know if nSequence interpretation as lock time is disabled', function () {
      Bip68.nSequenceIsDisabled(1 << 31).should.equal(true)
      Bip68.nSequenceIsDisabled(1 << 30).should.equal(false)
    })
  })

  describe('@nSequenceIsTime', function () {
    it('should know if nSequence is time', function () {
      Bip68.nSequenceIsTime(1 << 22).should.equal(true)
      Bip68.nSequenceIsTime(1 << 21).should.equal(false)
    })
  })

  describe('@nSequenceValue', function () {
    it('should get the value', function () {
      Bip68.nSequenceValue(0xfffffff).should.equal(0x0000ffff)
    })
  })
})
