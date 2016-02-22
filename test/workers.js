/* global describe,it */
'use strict'
let BIP32 = require('../lib/bip32')
let Hash = require('../lib/hash')
let Privkey = require('../lib/privkey')
let Pubkey = require('../lib/pubkey')
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
      return asink(function *() {
        let bip32 = BIP32().fromRandom()
        let workersResult = yield Workers.asyncObjectMethod(bip32, 'toString', [])
        let str = JSON.parse(workersResult.resbuf.toString())
        str[0].should.equal('x')
      }, this)
    })

    it('should compute this method with fullnode object in args in the workers', function () {
      return asink(function *() {
        let privkey = Privkey().fromRandom()
        let pubkey1 = Pubkey().fromPrivkey(privkey)
        let workersResult = yield Workers.asyncObjectMethod(Pubkey(), 'fromPrivkey', [privkey])
        let pubkey2 = Pubkey().fromFastBuffer(workersResult.resbuf)
        pubkey1.toString().should.equal(pubkey2.toString())
      }, this)
    })
  })

  describe('#asyncClassMethod', function () {
    it('should compute this method in the workers', function () {
      return asink(function *() {
        let buf = new Buffer([0, 1, 2, 3, 4])
        let args = [buf]
        let workersResult = yield Workers.asyncClassMethod('Hash', 'sha1', args)
        let hashbuf1 = workersResult.resbuf
        let hashbuf2 = Hash.sha1(buf)
        Buffer.compare(hashbuf1, hashbuf2).should.equal(0)
      }, this)
    })
  })
})
