/* global describe,it */
'use strict'
let BIP32 = require('../lib/bip32')
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
  })

  describe('#toBuffer', function () {
    it('should convert a bip32 into a workerscmd', function () {
      let bip32 = BIP32().fromRandom()
      let args = []
      let workersCmd = WorkersCmd().fromMethod(bip32, 'toString', args, 0)
      workersCmd.toBuffer().length.should.greaterThan(0)
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
