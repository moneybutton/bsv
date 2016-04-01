/* global describe,it */
'use strict'
let BN = require('../lib/bn')
let BR = require('../lib/br')
let Interp = require('../lib/interp')
let Script = require('../lib/script')
let Tx = require('../lib/tx')
let Txout = require('../lib/txout')
let Txoutmap = require('../lib/txoutmap')
let Txverifier = require('../lib/txverifier')
let asink = require('asink')
let should = require('chai').should()
let tx_invalid = require('./vectors/bitcoind/tx_invalid')
let tx_valid = require('./vectors/bitcoind/tx_valid')

describe('Txverifier', function () {
  it('should make a new txverifier', function () {
    let txverifier = new Txverifier()
    ;(txverifier instanceof Txverifier).should.equal(true)
    txverifier = Txverifier()
    ;(txverifier instanceof Txverifier).should.equal(true)
    txverifier = Txverifier({
      tx: Tx()
    })
    should.exist(txverifier.tx)
  })

  describe('vectors', function () {
    let c = 0
    tx_valid.forEach(function (vector, i) {
      if (vector.length === 1) {
        return
      }
      c++
      it('should verify tx_valid vector ' + c, function () {
        let inputs = vector[0]
        let txhex = vector[1]
        let flags = Interp.getFlags(vector[2])

        let txoutmap = Txoutmap()
        inputs.forEach(function (input) {
          let txoutnum = input[1]
          if (txoutnum === -1) {
            txoutnum = 0xffffffff // bitcoind casts -1 to an unsigned int
          }
          let txout = Txout(BN(0), Script().fromBitcoindString(input[2]))
          let txhashbuf = BR(new Buffer(input[0], 'hex')).readReverse()
          txoutmap.add(txhashbuf, txoutnum, txout)
        })

        let tx = Tx().fromBuffer(new Buffer(txhex, 'hex'))
        let verified = Txverifier.verify(tx, txoutmap, flags)
        verified.should.equal(true)
      })

      it('should async verify tx_valid vector ' + c, function () {
        return asink(function *() {
          let inputs = vector[0]
          let txhex = vector[1]
          let flags = Interp.getFlags(vector[2])

          let txoutmap = Txoutmap()
          inputs.forEach(function (input) {
            let txoutnum = input[1]
            if (txoutnum === -1) {
              txoutnum = 0xffffffff // bitcoind casts -1 to an unsigned int
            }
            let txout = Txout(BN(0), Script().fromBitcoindString(input[2]))
            let txhashbuf = BR(new Buffer(input[0], 'hex')).readReverse()
            txoutmap.add(txhashbuf, txoutnum, txout)
          })

          let tx = Tx().fromBuffer(new Buffer(txhex, 'hex'))
          let verified = yield Txverifier.asyncVerify(tx, txoutmap, flags)
          verified.should.equal(true)
        }, this)
      })
    })

    c = 0
    tx_invalid.forEach(function (vector, i) {
      if (vector.length === 1) {
        return
      }
      c++
      it('should unverify tx_invalid vector ' + c, function () {
        let inputs = vector[0]
        let txhex = vector[1]
        let flags = Interp.getFlags(vector[2])

        let txoutmap = Txoutmap()
        inputs.forEach(function (input) {
          let txoutnum = input[1]
          if (txoutnum === -1) {
            txoutnum = 0xffffffff // bitcoind casts -1 to an unsigned int
          }
          let txout = Txout(BN(0), Script().fromBitcoindString(input[2]))
          let txhashbuf = BR(new Buffer(input[0], 'hex')).readReverse()
          txoutmap.add(txhashbuf, txoutnum, txout)
        })

        let tx = Tx().fromBuffer(new Buffer(txhex, 'hex'))

        let verified = Txverifier.verify(tx, txoutmap, flags)
        verified.should.equal(false)
      })

      it('should async unverify tx_invalid vector ' + c, function () {
        return asink(function *() {
          let inputs = vector[0]
          let txhex = vector[1]
          let flags = Interp.getFlags(vector[2])

          let txoutmap = Txoutmap()
          inputs.forEach(function (input) {
            let txoutnum = input[1]
            if (txoutnum === -1) {
              txoutnum = 0xffffffff // bitcoind casts -1 to an unsigned int
            }
            let txout = Txout(BN(0), Script().fromBitcoindString(input[2]))
            let txhashbuf = BR(new Buffer(input[0], 'hex')).readReverse()
            txoutmap.add(txhashbuf, txoutnum, txout)
          })

          let tx = Tx().fromBuffer(new Buffer(txhex, 'hex'))

          let verified = yield Txverifier.asyncVerify(tx, txoutmap, flags)
          verified.should.equal(false)
        }, this)
      })
    })
  })
})
