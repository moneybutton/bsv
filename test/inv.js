/* global describe,it */
'use strict'
import { Inv } from '../lib/inv'
import { Hash } from '../lib/hash'
import { Bw } from '../lib/bw'
import should from 'should'

describe('Inv', function () {
  it('should exist', function () {
    let inv = new Inv()
    should.exist(inv)
    should.exist(Inv)
  })

  describe('#fromBuffer', function () {
    it('should convert from a buffer', function () {
      let hashBuf = Hash.sha256(Buffer.alloc(0))
      let typeNum = 1
      let typebuf = new Bw().writeUInt32LE(typeNum).toBuffer()
      let buf = Buffer.concat([typebuf, hashBuf])
      let inv = new Inv().fromBuffer(buf)
      inv.typeNum.should.equal(typeNum)
      Buffer.compare(inv.hashBuf, hashBuf).should.equal(0)
    })
  })

  describe('#toBuffer', function () {
    it('should convert to a buffer', function () {
      let hashBuf = Hash.sha256(Buffer.alloc(0))
      let typeNum = 1
      let typebuf = new Bw().writeUInt32LE(typeNum).toBuffer()
      let buf = Buffer.concat([typebuf, hashBuf])
      let inv = new Inv().fromBuffer(buf)
      let buf2 = inv.toBuffer()
      Buffer.compare(buf, buf2).should.equal(0)
    })
  })

  describe('#isTx', function () {
    it('should know this is a tx hash', function () {
      let hashBuf = Hash.sha256(Buffer.alloc(0))
      let typeNum = Inv.MSG_TX
      let inv = new Inv(typeNum, hashBuf)
      inv.isTx().should.equal(true)
    })
  })

  describe('#isBlock', function () {
    it('should know this is a block hash', function () {
      let hashBuf = Hash.sha256(Buffer.alloc(0))
      let typeNum = Inv.MSG_BLOCK
      let inv = new Inv(typeNum, hashBuf)
      inv.isBlock().should.equal(true)
    })
  })

  describe('#isFilteredBlock', function () {
    it('should know this is a filtered block hash', function () {
      let hashBuf = Hash.sha256(Buffer.alloc(0))
      let typeNum = Inv.MSG_FILTERED_BLOCK
      let inv = new Inv(typeNum, hashBuf)
      inv.isFilteredBlock().should.equal(true)
    })
  })
})
