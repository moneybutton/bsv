/* global describe,it */
'use strict'
let MsgPing = require('../lib/msgping')
let Random = require('../lib/random')
let asink = require('asink')
let should = require('chai').should()

describe('MsgPing', function () {
  it('should satisfy this basic API', function () {
    let msgping = MsgPing()
    should.exist(msgping)
    msgping = new MsgPing()
    should.exist(msgping)
    should.exist(MsgPing.Mainnet)
    should.exist(MsgPing.Testnet)
  })

  describe('#fromRandom', function () {
    it('should find a msgping from random', function () {
      let msgping = MsgPing().fromRandom()
      msgping.getCmd().should.equal('ping')
      msgping.databuf.length.should.equal(8)
    })
  })

  describe('#asyncFromRandom', function () {
    it('should find a msgping from random', function () {
      return asink(function *() {
        let msgping = yield MsgPing().asyncFromRandom()
        msgping.getCmd().should.equal('ping')
        msgping.databuf.length.should.equal(8)
      }, this)
    })
  })

  describe('#isValid', function () {
    it('should know this is a valid ping', function () {
      let msgping = MsgPing().fromRandom()
      msgping.isValid().should.equal(true)
    })

    it('should know this is an invalid ping', function () {
      let msgping = MsgPing().fromRandom()
      msgping.setCmd('pingo')
      msgping.isValid().should.equal(false)
    })

    it('should know this is an invalid ping', function () {
      let msgping = MsgPing().fromRandom()
      msgping.setData(Random.getRandomBuffer(9))
      msgping.isValid().should.equal(false)
    })
  })
})
