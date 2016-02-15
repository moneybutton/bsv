/* global describe,it */
'use strict'
let BIP32 = require('../lib/bip32')
let BW = require('../lib/bw')
let WorkersCmd = require('../lib/workers-cmd')
let cmp = require('../lib/cmp')
let should = require('chai').should()

describe('WorkersCmd', function () {
  it('should satisfy this basic API', function () {
    let workersCmd = WorkersCmd()
    should.exist(workersCmd)
  })

  describe('#fromMethod', function () {
    it('should convert a bip32 into a workerscmd', function () {
      let bip32 = BIP32().fromRandom()
      let args = []
      let workersCmd = WorkersCmd().fromMethod(bip32, 'toString', args, 0)
      cmp(workersCmd.objbuf, bip32.toFastBuffer()).should.equal(true)
      workersCmd.args.length.should.equal(0)
      workersCmd.id.should.equal(0)
    })

    it('should convert a bip32 into a workerscmd with complicated args', function () {
      let bip32 = BIP32().fromRandom()
      let arg0 = true
      let arg1 = new Buffer(5)
      arg1.fill(0)
      let arg2 = BIP32().fromRandom()
      let args = [arg0, arg1, arg2]
      let workersCmd = WorkersCmd().fromMethod(bip32, 'toString', args, 0)
      cmp(workersCmd.objbuf, bip32.toFastBuffer()).should.equal(true)
      workersCmd.args.length.should.equal(3)
      workersCmd.args[0].should.equal(arg0)
      cmp(workersCmd.args[1], arg1).should.equal(true)
      workersCmd.args[2].toString().should.equal(arg2.toString())
      workersCmd.id.should.equal(0)
    })
  })

  describe('#toBuffer', function () {
    it('should convert a bip32 into a workerscmd buffer', function () {
      let bip32 = BIP32().fromRandom()
      let args = []
      let workersCmd = WorkersCmd().fromMethod(bip32, 'toString', args, 0)
      workersCmd.toBuffer().length.should.greaterThan(0)
    })

    it('should convert a bip32 into a workerscmd buffer with complicated args', function () {
      let bip32 = BIP32().fromRandom()
      let arg0 = true
      let arg1 = new Buffer(5)
      arg1.fill(0)
      let arg2 = BIP32().fromRandom()
      let args = [arg0, arg1, arg2]
      let workersCmd = WorkersCmd().fromMethod(bip32, 'toString', args, 0)
      let buf = workersCmd.toBuffer(BW())
      workersCmd = WorkersCmd().fromBuffer(buf, {BIP32})
      cmp(workersCmd.objbuf, bip32.toFastBuffer()).should.equal(true)
      workersCmd.args.length.should.equal(3)
      workersCmd.args[0].should.equal(arg0)
      cmp(workersCmd.args[1], arg1).should.equal(true)
      workersCmd.args[2].toString().should.equal(arg2.toString())
      workersCmd.id.should.equal(0)
    })
  })

  describe('#fromBuffer', function () {
    it('should read a buffer', function () {
      let bip32 = BIP32().fromRandom()
      let args = []
      let workersCmd = WorkersCmd().fromMethod(bip32, 'toString', args, 0)
      let buf = workersCmd.toBuffer()
      workersCmd = WorkersCmd().fromBuffer(buf)
      cmp(workersCmd.objbuf, bip32.toFastBuffer()).should.equal(true)
      workersCmd.args.length.should.equal(0)
      workersCmd.id.should.equal(0)
    })
  })
})
