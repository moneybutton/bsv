/* global describe,it */
'use strict'
import should from 'should'
import { OpCode } from '../lib/op-code'

describe('OpCode', function () {
  it('should create a new OpCode', function () {
    const opCode = new OpCode(5)
    should.exist(opCode)
  })

  it('should have 124 opCodes', function () {
    let i = 0
    for (const key in OpCode) {
      if (key.indexOf('OP_') !== -1) {
        i++
      }
    }
    i.should.equal(124)
  })

  it('should convert to a string with this handy syntax', function () {
    new OpCode(0).toString().should.equal('OP_0')
    new OpCode(96).toString().should.equal('OP_16')
    new OpCode(97).toString().should.equal('OP_NOP')
  })

  it('should convert to a number with this handy syntax', function () {
    new OpCode()
      .fromString('OP_0')
      .toNumber()
      .should.equal(0)
    new OpCode()
      .fromString('OP_16')
      .toNumber()
      .should.equal(96)
    new OpCode()
      .fromString('OP_NOP')
      .toNumber()
      .should.equal(97)
  })

  describe('#fromNumber', function () {
    it('should work for 0', function () {
      new OpCode().fromNumber(0).num.should.equal(0)
    })
  })

  describe('#toNumber', function () {
    it('should work for 0', function () {
      new OpCode()
        .fromNumber(0)
        .toNumber()
        .should.equal(0)
    })
  })

  describe('#fromString', function () {
    it('should work for OP_0', function () {
      new OpCode().fromString('OP_0').num.should.equal(0)
    })
  })

  describe('#toString', function () {
    it('should work for OP_0', function () {
      new OpCode()
        .fromString('OP_0')
        .toString()
        .should.equal('OP_0')
    })
  })

  describe('@str', function () {
    it('should exist and have op 185', function () {
      should.exist(OpCode.str)
      OpCode.str[185].should.equal('OP_NOP10')
    })
  })
})
