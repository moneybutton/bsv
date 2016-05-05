/* global describe,it */
'use strict'
let GetBlocks = require('../lib/get-blocks')
let should = require('chai').should()

describe('GetBlocks', function () {
  it('should exist', function () {
    should.exist(GetBlocks)
    should.exist(new GetBlocks())
  })

  describe('#toBuffer', function () {
    it('should convert to a buffer', function () {
      let buf = new Buffer(32)
      buf.fill(0)
      let hashes = [buf]
      let getblocks = new GetBlocks().fromHashes(hashes)
      let getblocksbuf = getblocks.toBuffer()
      getblocksbuf.length.should.equal(4 + 1 + 0 + 32)
    })
  })

  describe('#fromBuffer', function () {
    it('should convert from a buffer', function () {
      let buf = new Buffer(32)
      buf.fill(0)
      let hashes = [buf]
      let getblocks = new GetBlocks().fromHashes(hashes)
      let getblocksbuf = getblocks.toBuffer()
      let getblocks2 = new GetBlocks().fromBuffer(getblocksbuf)
      should.exist(getblocks2.versionNum)
      should.exist(getblocks2.hashBufsVi)
      should.exist(getblocks2.hashBufs)
      should.exist(getblocks2.stopHashBuf)
    })
  })

  describe('#fromHashes', function () {
    it('should convert from a list of one hash', function () {
      let buf = new Buffer(32)
      buf.fill(0)
      let hashes = [buf]
      let getblocks = new GetBlocks().fromHashes(hashes)
      should.exist(getblocks)
      getblocks.hashBufs.length.should.equal(0)
      should.exist(getblocks.stopHashBuf)
    })

    it('should convert from a list of two hashes', function () {
      let buf = new Buffer(32)
      buf.fill(0)
      let hashes = [buf, buf]
      let getblocks = new GetBlocks().fromHashes(hashes)
      should.exist(getblocks)
      getblocks.hashBufs.length.should.equal(1)
      should.exist(getblocks.stopHashBuf)
    })
  })

  describe('@fromHashes', function () {
    it('should convert from a list of one hash', function () {
      let buf = new Buffer(32)
      buf.fill(0)
      let hashes = [buf]
      let getblocks = GetBlocks.fromHashes(hashes)
      should.exist(getblocks)
      getblocks.hashBufs.length.should.equal(0)
      should.exist(getblocks.stopHashBuf)
    })

    it('should convert from a list of two hashes', function () {
      let buf = new Buffer(32)
      buf.fill(0)
      let hashes = [buf, buf]
      let getblocks = GetBlocks.fromHashes(hashes)
      should.exist(getblocks)
      getblocks.hashBufs.length.should.equal(1)
      should.exist(getblocks.stopHashBuf)
    })
  })

  describe('#toHashes', function () {
    it('should give a list of hashes', function () {
      let buf = new Buffer(32)
      buf.fill(0)
      let hashes = [buf, buf]
      let getblocks = new GetBlocks().fromHashes(hashes)
      let hashes2 = getblocks.toHashes()
      hashes2.length.should.equal(2)
    })
  })
})
