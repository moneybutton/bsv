/* global describe,it */
'use strict'
let Bn = require('../lib/bn')
let should = require('chai').should()
let Br = require('../lib/br')
let Bw = require('../lib/bw')
let VarInt = require('../lib/var-int')

describe('VarInt', function () {
  it('should make a new varInt', function () {
    let buf = new Buffer('00', 'hex')
    let varInt = new VarInt(buf)
    should.exist(varInt)
    varInt.buf.toString('hex').should.equal('00')
    varInt = new VarInt(buf)
    should.exist(varInt)
    varInt.buf.toString('hex').should.equal('00')

    // various ways to use the constructor
    new VarInt(new VarInt(0).toBuffer()).toNumber().should.equal(0)
    new VarInt(0).toNumber().should.equal(0)
    new VarInt(new Bn(0)).toNumber().should.equal(0)

    // varInts can have multiple buffer representations
    new VarInt(0).toNumber().should.equal(new VarInt(new Buffer([0xFD, 0, 0])).toNumber())
    new VarInt(0).toBuffer().toString('hex').should.not.equal(new VarInt().fromBuffer(new Buffer([0xFD, 0, 0])).toBuffer().toString('hex'))
  })

  describe('#fromObject', function () {
    it('should set a buffer', function () {
      let buf = new Buffer('00', 'hex')
      let varInt = new VarInt().fromObject({buf: buf})
      varInt.buf.toString('hex').should.equal('00')
      varInt.fromObject({})
      varInt.buf.toString('hex').should.equal('00')
    })
  })

  describe('#fromJson', function () {
    it('should set a buffer', function () {
      let buf = new Bw().writeVarIntNum(5).toBuffer()
      let varInt = new VarInt().fromJson(buf.toString('hex'))
      varInt.toNumber().should.equal(5)
    })
  })

  describe('#toJson', function () {
    it('should return a buffer', function () {
      let buf = new Bw().writeVarIntNum(5).toBuffer()
      let varInt = new VarInt().fromJson(buf.toString('hex'))
      varInt.toJson().should.equal('05')
    })
  })

  describe('#fromBuffer', function () {
    it('should set a buffer', function () {
      let buf = new Bw().writeVarIntNum(5).toBuffer()
      let varInt = new VarInt().fromBuffer(buf)
      varInt.toNumber().should.equal(5)
    })
  })

  describe('#fromBr', function () {
    it('should set a buffer reader', function () {
      let buf = new Bw().writeVarIntNum(5).toBuffer()
      let br = new Br(buf)
      let varInt = new VarInt().fromBr(br)
      varInt.toNumber().should.equal(5)
    })
  })

  describe('#fromBn', function () {
    it('should set a number', function () {
      let varInt = new VarInt().fromBn(new Bn(5))
      varInt.toNumber().should.equal(5)
    })
  })

  describe('#fromNumber', function () {
    it('should set a number', function () {
      let varInt = new VarInt().fromNumber(5)
      varInt.toNumber().should.equal(5)
    })
  })

  describe('#toBuffer', function () {
    it('should return a buffer', function () {
      let buf = new Bw().writeVarIntNum(5).toBuffer()
      let varInt = new VarInt(buf)
      varInt.toBuffer().toString('hex').should.equal(buf.toString('hex'))
    })
  })

  describe('#toBn', function () {
    it('should return a buffer', function () {
      let varInt = new VarInt(5)
      varInt.toBn().toString().should.equal(new Bn(5).toString())
    })
  })

  describe('#toNumber', function () {
    it('should return a buffer', function () {
      let varInt = new VarInt(5)
      varInt.toNumber().should.equal(5)
    })
  })
})
