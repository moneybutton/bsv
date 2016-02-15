/* global describe,it */
'use strict'
let asink = require('asink')
let BIP32 = require('../lib/bip32')
let Workers = require('../lib/workers')
let Privkey = require('../lib/privkey')
let Pubkey = require('../lib/pubkey')
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
})
