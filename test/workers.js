/* global describe,it */
'use strict'
let asink = require('asink')
let BIP32 = require('../lib/bip32')
let Workers = require('../lib/workers')
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
  })
})
