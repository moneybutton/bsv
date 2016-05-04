/* global describe,it */
'use strict'
let Inv = require('../lib/inv')
let Hash = require('../lib/hash')
let Bw = require('../lib/bw')
let should = require('chai').should()

describe('Inv', function () {
  it('should exist', function () {
    let inv = Inv()
    should.exist(inv)
    should.exist(Inv)
  })

  describe('#fromBuffer', function () {
    it('should convert from a buffer', function () {
      let hashBuf = Hash.sha256(new Buffer(0))
      let typenum = 1
      let typebuf = Bw().writeUInt32LE(typenum).toBuffer()
      let buf = Buffer.concat([typebuf, hashBuf])
      let inv = Inv().fromBuffer(buf)
      inv.typenum.should.equal(typenum)
      Buffer.compare(inv.hashBuf, hashBuf).should.equal(0)
    })
  })

  describe('#toBuffer', function () {
    it('should convert to a buffer', function () {
      let hashBuf = Hash.sha256(new Buffer(0))
      let typenum = 1
      let typebuf = Bw().writeUInt32LE(typenum).toBuffer()
      let buf = Buffer.concat([typebuf, hashBuf])
      let inv = Inv().fromBuffer(buf)
      let buf2 = inv.toBuffer()
      Buffer.compare(buf, buf2).should.equal(0)
    })
  })

  describe('#isTx', function () {
    it('should know this is a tx hash', function () {
      let hashBuf = Hash.sha256(new Buffer(0))
      let typenum = Inv.MSG_TX
      let inv = Inv(typenum, hashBuf)
      inv.isTx().should.equal(true)
    })
  })

  describe('#isBlock', function () {
    it('should know this is a block hash', function () {
      let hashBuf = Hash.sha256(new Buffer(0))
      let typenum = Inv.MSG_BLOCK
      let inv = Inv(typenum, hashBuf)
      inv.isBlock().should.equal(true)
    })
  })

  describe('#isFilteredBlock', function () {
    it('should know this is a filtered block hash', function () {
      let hashBuf = Hash.sha256(new Buffer(0))
      let typenum = Inv.MSG_FILTERED_BLOCK
      let inv = Inv(typenum, hashBuf)
      inv.isFilteredBlock().should.equal(true)
    })
  })
})
