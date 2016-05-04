/* global describe,it */
'use strict'
let BlockHeader = require('../lib/block-header')
let Bw = require('../lib/bw')
let Br = require('../lib/br')
let should = require('chai').should()

describe('BlockHeader', function () {
  let bh = new BlockHeader()
  let version = 1
  let prevBlockHashBuf = new Buffer(32)
  prevBlockHashBuf.fill(5)
  let merklerootbuf = new Buffer(32)
  merklerootbuf.fill(9)
  let time = 2
  let bits = 3
  let nonce = 4
  bh.fromObject({
    version: version,
    prevBlockHashBuf: prevBlockHashBuf,
    merklerootbuf: merklerootbuf,
    time: time,
    bits: bits,
    nonce: nonce
  })
  let bhhex = '0100000005050505050505050505050505050505050505050505050505050505050505050909090909090909090909090909090909090909090909090909090909090909020000000300000004000000'
  let bhbuf = new Buffer(bhhex, 'hex')

  it('should make a new blockHeader', function () {
    let blockHeader = new BlockHeader()
    should.exist(blockHeader)
    blockHeader = BlockHeader()
    should.exist(blockHeader)
  })

  describe('#fromObject', function () {
    it('should set all the variables', function () {
      bh.fromObject({
        version: version,
        prevBlockHashBuf: prevBlockHashBuf,
        merklerootbuf: merklerootbuf,
        time: time,
        bits: bits,
        nonce: nonce
      })
      should.exist(bh.version)
      should.exist(bh.prevBlockHashBuf)
      should.exist(bh.merklerootbuf)
      should.exist(bh.time)
      should.exist(bh.bits)
      should.exist(bh.nonce)
    })
  })

  describe('#fromJson', function () {
    it('should set all the variables', function () {
      let bh = BlockHeader().fromJson({
        version: version,
        prevBlockHashBuf: prevBlockHashBuf.toString('hex'),
        merklerootbuf: merklerootbuf.toString('hex'),
        time: time,
        bits: bits,
        nonce: nonce
      })
      should.exist(bh.version)
      should.exist(bh.prevBlockHashBuf)
      should.exist(bh.merklerootbuf)
      should.exist(bh.time)
      should.exist(bh.bits)
      should.exist(bh.nonce)
    })
  })

  describe('#toJson', function () {
    it('should set all the variables', function () {
      let json = bh.toJson()
      should.exist(json.version)
      should.exist(json.prevBlockHashBuf)
      should.exist(json.merklerootbuf)
      should.exist(json.time)
      should.exist(json.bits)
      should.exist(json.nonce)
    })
  })

  describe('#fromHex', function () {
    it('should parse this known hex string', function () {
      BlockHeader().fromHex(bhhex).toBuffer().toString('hex').should.equal(bhhex)
    })
  })

  describe('#fromBuffer', function () {
    it('should parse this known buffer', function () {
      BlockHeader().fromBuffer(bhbuf).toBuffer().toString('hex').should.equal(bhhex)
    })
  })

  describe('#fromBr', function () {
    it('should parse this known buffer', function () {
      BlockHeader().fromBr(Br(bhbuf)).toBuffer().toString('hex').should.equal(bhhex)
    })
  })

  describe('#toHex', function () {
    it('should output this known hex string', function () {
      BlockHeader().fromBuffer(bhbuf).toHex().should.equal(bhhex)
    })
  })

  describe('#toBuffer', function () {
    it('should output this known buffer', function () {
      BlockHeader().fromBuffer(bhbuf).toBuffer().toString('hex').should.equal(bhhex)
    })
  })

  describe('#toBw', function () {
    it('should output this known buffer', function () {
      BlockHeader().fromBuffer(bhbuf).toBw().toBuffer().toString('hex').should.equal(bhhex)
      let bw = Bw()
      BlockHeader().fromBuffer(bhbuf).toBw(bw)
      bw.toBuffer().toString('hex').should.equal(bhhex)
    })
  })
})
