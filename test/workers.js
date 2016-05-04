/* global describe,it */
'use strict'
let Bip32 = require('../lib/bip-32')
let Hash = require('../lib/hash')
let PrivKey = require('../lib/priv-key')
let PubKey = require('../lib/pub-key')
let Workers = require('../lib/workers')
let asink = require('asink')
let should = require('chai').should()

describe('Workers', function () {
  it('should satisfy this basic API', function () {
    let workers = Workers()
    workers = new Workers()
    should.exist(workers)
  })

  describe('#asyncObjectMethod', function () {
    it('should compute this method in the workers', function () {
      return asink(function * () {
        let bip32 = Bip32().fromRandom()
        let workersResult = yield Workers.asyncObjectMethod(bip32, 'toString', [])
        let str = JSON.parse(workersResult.resbuf.toString())
        str[0].should.equal('x')
      }, this)
    })

    it('should compute this method with Fullnode object in args in the workers', function () {
      return asink(function * () {
        let privKey = PrivKey().fromRandom()
        let pubKey1 = PubKey().fromPrivKey(privKey)
        let workersResult = yield Workers.asyncObjectMethod(PubKey(), 'fromPrivKey', [privKey])
        let pubKey2 = PubKey().fromFastBuffer(workersResult.resbuf)
        pubKey1.toString().should.equal(pubKey2.toString())
      }, this)
    })
  })

  describe('#asyncClassMethod', function () {
    it('should compute this method in the workers', function () {
      return asink(function * () {
        let buf = new Buffer([0, 1, 2, 3, 4])
        let args = [buf]
        let workersResult = yield Workers.asyncClassMethod('Hash', 'sha1', args)
        let hashBuf1 = workersResult.resbuf
        let hashBuf2 = Hash.sha1(buf)
        Buffer.compare(hashBuf1, hashBuf2).should.equal(0)
      }, this)
    })
  })
})
