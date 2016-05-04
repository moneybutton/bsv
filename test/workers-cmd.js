/* global describe,it */
'use strict'
let Bip32 = require('../lib/bip-32')
let Bw = require('../lib/bw')
let WorkersCmd = require('../lib/workers-cmd')
let cmp = require('../lib/cmp')
let should = require('chai').should()

describe('WorkersCmd', function () {
  it('should satisfy this basic API', function () {
    let workersCmd = WorkersCmd()
    should.exist(workersCmd)
  })

  describe('#fromObjectMethod', function () {
    it('should convert a bip32 into a workerscmd', function () {
      let bip32 = Bip32().fromRandom()
      let args = []
      let workersCmd = WorkersCmd().fromObjectMethod(bip32, 'toString', args, 0)
      cmp(workersCmd.objbuf, bip32.toFastBuffer()).should.equal(true)
      workersCmd.args.length.should.equal(0)
      workersCmd.id.should.equal(0)
    })

    it('should convert a bip32 into a workerscmd with complicated args', function () {
      let bip32 = Bip32().fromRandom()
      let arg0 = true
      let arg1 = new Buffer(5)
      arg1.fill(0)
      let arg2 = Bip32().fromRandom()
      let args = [arg0, arg1, arg2]
      let workersCmd = WorkersCmd().fromObjectMethod(bip32, 'toString', args, 0)
      cmp(workersCmd.objbuf, bip32.toFastBuffer()).should.equal(true)
      workersCmd.args.length.should.equal(3)
      workersCmd.args[0].should.equal(arg0)
      cmp(workersCmd.args[1], arg1).should.equal(true)
      workersCmd.args[2].toString().should.equal(arg2.toString())
      workersCmd.id.should.equal(0)
    })
  })

  describe('#fromClassMethod', function () {
    it('should convert Hash.sha1 into a workerscmd', function () {
      let buf = new Buffer([0, 1, 2, 3])
      let args = [buf]
      let workersCmd = WorkersCmd().fromClassMethod('Hash', 'sha1', args, 0)
      workersCmd.args[0].toString('hex').should.equal(buf.toString('hex'))
      workersCmd.isobj.should.equal(false)
    })
  })

  describe('#toBuffer', function () {
    it('should convert a bip32 into a workerscmd buffer', function () {
      let bip32 = Bip32().fromRandom()
      let args = []
      let workersCmd = WorkersCmd().fromObjectMethod(bip32, 'toString', args, 0)
      workersCmd.toBuffer().length.should.greaterThan(0)
    })

    it('should convert a bip32 into a workerscmd buffer with complicated args', function () {
      let bip32 = Bip32().fromRandom()
      let arg0 = true
      let arg1 = new Buffer(5)
      arg1.fill(0)
      let arg2 = Bip32().fromRandom()
      let args = [arg0, arg1, arg2]
      let workersCmd = WorkersCmd().fromObjectMethod(bip32, 'toString', args, 0)
      let buf = workersCmd.toBuffer(Bw())
      workersCmd = WorkersCmd().fromBuffer(buf, {Bip32})
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
      let bip32 = Bip32().fromRandom()
      let args = []
      let workersCmd = WorkersCmd().fromObjectMethod(bip32, 'toString', args, 0)
      let buf = workersCmd.toBuffer()
      workersCmd = WorkersCmd().fromBuffer(buf)
      cmp(workersCmd.objbuf, bip32.toFastBuffer()).should.equal(true)
      workersCmd.args.length.should.equal(0)
      workersCmd.id.should.equal(0)
    })
  })
})
