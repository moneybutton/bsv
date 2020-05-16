/* global describe,it */
'use strict'
import { BlockHeader } from '../lib/block-header'
import { Bw } from '../lib/bw'
import { Br } from '../lib/br'
import should from 'should'

describe('BlockHeader', function () {
  let bh = new BlockHeader()
  let versionBytesNum = 1
  let prevBlockHashBuf = Buffer.alloc(32)
  prevBlockHashBuf.fill(5)
  let merkleRootBuf = Buffer.alloc(32)
  merkleRootBuf.fill(9)
  let time = 2
  let bits = 3
  let nonce = 4
  bh.fromObject({
    versionBytesNum: versionBytesNum,
    prevBlockHashBuf: prevBlockHashBuf,
    merkleRootBuf: merkleRootBuf,
    time: time,
    bits: bits,
    nonce: nonce
  })
  let bhhex =
    '0100000005050505050505050505050505050505050505050505050505050505050505050909090909090909090909090909090909090909090909090909090909090909020000000300000004000000'
  let bhbuf = Buffer.from(bhhex, 'hex')

  it('should make a new blockHeader', function () {
    let blockHeader = new BlockHeader()
    should.exist(blockHeader)
    blockHeader = new BlockHeader()
    should.exist(blockHeader)
  })

  describe('#fromObject', function () {
    it('should set all the variables', function () {
      bh.fromObject({
        versionBytesNum: versionBytesNum,
        prevBlockHashBuf: prevBlockHashBuf,
        merkleRootBuf: merkleRootBuf,
        time: time,
        bits: bits,
        nonce: nonce
      })
      should.exist(bh.versionBytesNum)
      should.exist(bh.prevBlockHashBuf)
      should.exist(bh.merkleRootBuf)
      should.exist(bh.time)
      should.exist(bh.bits)
      should.exist(bh.nonce)
    })
  })

  describe('#fromJSON', function () {
    it('should set all the variables', function () {
      let bh = new BlockHeader().fromJSON({
        versionBytesNum: versionBytesNum,
        prevBlockHashBuf: prevBlockHashBuf.toString('hex'),
        merkleRootBuf: merkleRootBuf.toString('hex'),
        time: time,
        bits: bits,
        nonce: nonce
      })
      should.exist(bh.versionBytesNum)
      should.exist(bh.prevBlockHashBuf)
      should.exist(bh.merkleRootBuf)
      should.exist(bh.time)
      should.exist(bh.bits)
      should.exist(bh.nonce)
    })
  })

  describe('#toJSON', function () {
    it('should set all the variables', function () {
      let json = bh.toJSON()
      should.exist(json.versionBytesNum)
      should.exist(json.prevBlockHashBuf)
      should.exist(json.merkleRootBuf)
      should.exist(json.time)
      should.exist(json.bits)
      should.exist(json.nonce)
    })
  })

  describe('#fromHex', function () {
    it('should parse this known hex string', function () {
      new BlockHeader()
        .fromHex(bhhex)
        .toBuffer()
        .toString('hex')
        .should.equal(bhhex)
    })
  })

  describe('#fromBuffer', function () {
    it('should parse this known buffer', function () {
      new BlockHeader()
        .fromBuffer(bhbuf)
        .toBuffer()
        .toString('hex')
        .should.equal(bhhex)
    })
  })

  describe('#fromBr', function () {
    it('should parse this known buffer', function () {
      new BlockHeader()
        .fromBr(new Br(bhbuf))
        .toBuffer()
        .toString('hex')
        .should.equal(bhhex)
    })
  })

  describe('#toHex', function () {
    it('should output this known hex string', function () {
      new BlockHeader()
        .fromBuffer(bhbuf)
        .toHex()
        .should.equal(bhhex)
    })
  })

  describe('#toBuffer', function () {
    it('should output this known buffer', function () {
      new BlockHeader()
        .fromBuffer(bhbuf)
        .toBuffer()
        .toString('hex')
        .should.equal(bhhex)
    })
  })

  describe('#toBw', function () {
    it('should output this known buffer', function () {
      new BlockHeader()
        .fromBuffer(bhbuf)
        .toBw()
        .toBuffer()
        .toString('hex')
        .should.equal(bhhex)
      let bw = new Bw()
      new BlockHeader().fromBuffer(bhbuf).toBw(bw)
      bw
        .toBuffer()
        .toString('hex')
        .should.equal(bhhex)
    })
  })
})
