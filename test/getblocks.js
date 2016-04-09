/* global describe,it */
'use strict'
let GetBlocks = require('../lib/getblocks')
let should = require('chai').should()

describe('GetBlocks', function () {
  it('should exist', function () {
    should.exist(GetBlocks)
    should.exist(GetBlocks())
  })

  describe('#toBuffer', function () {
    it('should convert to a buffer', function () {
      let buf = new Buffer(32)
      buf.fill(0)
      let hashes = [buf]
      let getblocks = GetBlocks().fromHashes(hashes)
      let getblocksbuf = getblocks.toBuffer()
      getblocksbuf.length.should.equal(4 + 1 + 0 + 32)
    })
  })

  describe('#fromBuffer', function () {
    it('should convert from a buffer', function () {
      let buf = new Buffer(32)
      buf.fill(0)
      let hashes = [buf]
      let getblocks = GetBlocks().fromHashes(hashes)
      let getblocksbuf = getblocks.toBuffer()
      let getblocks2 = GetBlocks().fromBuffer(getblocksbuf)
      should.exist(getblocks2.versionnum)
      should.exist(getblocks2.hashbufsvi)
      should.exist(getblocks2.hashbufs)
      should.exist(getblocks2.stophashbuf)
    })
  })

  describe('#fromHashes', function () {
    it('should convert from a list of one hash', function () {
      let buf = new Buffer(32)
      buf.fill(0)
      let hashes = [buf]
      let getblocks = GetBlocks().fromHashes(hashes)
      should.exist(getblocks)
      getblocks.hashbufs.length.should.equal(0)
      should.exist(getblocks.stophashbuf)
    })

    it('should convert from a list of two hashes', function () {
      let buf = new Buffer(32)
      buf.fill(0)
      let hashes = [buf, buf]
      let getblocks = GetBlocks().fromHashes(hashes)
      should.exist(getblocks)
      getblocks.hashbufs.length.should.equal(1)
      should.exist(getblocks.stophashbuf)
    })
  })

  describe('#toHashes', function () {
    it('should give a list of hashes', function () {
      let buf = new Buffer(32)
      buf.fill(0)
      let hashes = [buf, buf]
      let getblocks = GetBlocks().fromHashes(hashes)
      let hashes2 = getblocks.toHashes()
      hashes2.length.should.equal(2)
    })
  })
})
