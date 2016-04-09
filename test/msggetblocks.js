/* global describe,it */
'use strict'
let GetBlocks = require('../lib/getblocks')
let MsgGetBlocks = require('../lib/msggetblocks')
let asink = require('asink')
let should = require('chai').should()

describe('MsgGetBlocks', function () {
  let hashbuf = new Buffer(32)
  hashbuf.fill(0)
  let hashes = [hashbuf]
  let getblocks = GetBlocks().fromHashes(hashes)

  it('should exist', function () {
    should.exist(MsgGetBlocks)
    should.exist(MsgGetBlocks())
  })

  describe('#fromGetBlocks', function () {
    it('should convert from getblocks', function () {
      let msggetblocks = MsgGetBlocks().fromGetBlocks(getblocks)
      msggetblocks.databuf.length.should.equal(4 + 1 + 0 + 32)
    })
  })

  describe('#asyncFromGetBlocks', function () {
    it('should convert from getblocks', function () {
      return asink(function *() {
        let msggetblocks = yield MsgGetBlocks().asyncFromGetBlocks(getblocks)
        msggetblocks.databuf.length.should.equal(4 + 1 + 0 + 32)
      }, this)
    })
  })

  describe('#fromHashes', function () {
    it('should convert from hashes', function () {
      let msggetblocks = MsgGetBlocks().fromHashes(hashes)
      msggetblocks.databuf.length.should.equal(4 + 1 + 0 + 32)
    })
  })

  describe('#asyncFromHashes', function () {
    it('should convert from hashes', function () {
      return asink(function *() {
        let msggetblocks = yield MsgGetBlocks().asyncFromHashes(hashes)
        msggetblocks.databuf.length.should.equal(4 + 1 + 0 + 32)
      }, this)
    })
  })

  describe('#toGetBlocks', function () {
    it('should return getblocks', function () {
      let msggetblocks = MsgGetBlocks().fromHashes(hashes)
      let getblocks2 = msggetblocks.toGetBlocks()
      getblocks2.toHex().should.equal(getblocks2.toHex())
    })
  })

  describe('#toHashes', function () {
    it('should return getblocks', function () {
      let msggetblocks = MsgGetBlocks().fromHashes(hashes)
      let hashes2 = msggetblocks.toHashes()
      hashes2.length.should.equal(1)
    })
  })

  describe('#isValid', function () {
    it('should know this is a valid getblocks msg', function () {
      let msggetblocks = MsgGetBlocks().fromHashes(hashes)
      msggetblocks.isValid().should.equal(true)
    })
  })
})
