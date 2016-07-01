'use strict'
let Bn = require('../../lib/bn')
let Br = require('../../lib/br')
let Interp = require('../../lib/interp')
let Script = require('../../lib/script')
let Tx = require('../../lib/tx')
let TxOut = require('../../lib/tx-out')
let TxOutMap = require('../../lib/tx-out-map')
let TxVerifier = require('../../lib/tx-verifier')
let asink = require('asink')

module.exports.testTxVerifierPartial = function testTxVerifierPartial (it, txValid, txInvalid, mod = 0) {
  let c = 0
  txValid.forEach(function (vector, i) {
    if (vector.length === 1) {
      return
    }
    c++
    if ((c + mod) % 4) {
      return
    }
    it('should verify txValid vector ' + c, function () {
      let inputs = vector[0]
      let txhex = vector[1]
      let flags = Interp.getFlags(vector[2])

      let txOutMap = new TxOutMap()
      inputs.forEach(function (input) {
        let txOutNum = input[1]
        if (txOutNum === -1) {
          txOutNum = 0xffffffff // bitcoind casts -1 to an unsigned int
        }
        let txOut = TxOut.fromProperties(new Bn(0), new Script().fromBitcoindString(input[2]))
        let txHashBuf = new Br(new Buffer(input[0], 'hex')).readReverse()
        txOutMap.add(txHashBuf, txOutNum, txOut)
      })

      let tx = new Tx().fromBuffer(new Buffer(txhex, 'hex'))
      let verified = TxVerifier.verify(tx, txOutMap, flags)
      verified.should.equal(true)
    })

    it('should async verify txValid vector ' + c, function () {
      return asink(function * () {
        let inputs = vector[0]
        let txhex = vector[1]
        let flags = Interp.getFlags(vector[2])

        let txOutMap = new TxOutMap()
        inputs.forEach(function (input) {
          let txOutNum = input[1]
          if (txOutNum === -1) {
            txOutNum = 0xffffffff // bitcoind casts -1 to an unsigned int
          }
          let txOut = TxOut.fromProperties(new Bn(0), new Script().fromBitcoindString(input[2]))
          let txHashBuf = new Br(new Buffer(input[0], 'hex')).readReverse()
          txOutMap.add(txHashBuf, txOutNum, txOut)
        })

        let tx = new Tx().fromBuffer(new Buffer(txhex, 'hex'))
        let verified = yield TxVerifier.asyncVerify(tx, txOutMap, flags)
        verified.should.equal(true)
      }, this)
    })
  })

  c = 0
  txInvalid.forEach(function (vector, i) {
    if (vector.length === 1) {
      return
    }
    c++
    if ((c + mod) % 4) {
      return
    }
    it('should unverify txInvalid vector ' + c, function () {
      let inputs = vector[0]
      let txhex = vector[1]
      let flags = Interp.getFlags(vector[2])

      let txOutMap = new TxOutMap()
      inputs.forEach(function (input) {
        let txOutNum = input[1]
        if (txOutNum === -1) {
          txOutNum = 0xffffffff // bitcoind casts -1 to an unsigned int
        }
        let txOut = TxOut.fromProperties(new Bn(0), new Script().fromBitcoindString(input[2]))
        let txHashBuf = new Br(new Buffer(input[0], 'hex')).readReverse()
        txOutMap.add(txHashBuf, txOutNum, txOut)
      })

      let tx = new Tx().fromBuffer(new Buffer(txhex, 'hex'))

      let verified = TxVerifier.verify(tx, txOutMap, flags)
      verified.should.equal(false)
    })

    it('should async unverify txInvalid vector ' + c, function () {
      return asink(function * () {
        let inputs = vector[0]
        let txhex = vector[1]
        let flags = Interp.getFlags(vector[2])

        let txOutMap = new TxOutMap()
        inputs.forEach(function (input) {
          let txOutNum = input[1]
          if (txOutNum === -1) {
            txOutNum = 0xffffffff // bitcoind casts -1 to an unsigned int
          }
          let txOut = TxOut.fromProperties(new Bn(0), new Script().fromBitcoindString(input[2]))
          let txHashBuf = new Br(new Buffer(input[0], 'hex')).readReverse()
          txOutMap.add(txHashBuf, txOutNum, txOut)
        })

        let tx = new Tx().fromBuffer(new Buffer(txhex, 'hex'))

        let verified = yield TxVerifier.asyncVerify(tx, txOutMap, flags)
        verified.should.equal(false)
      }, this)
    })
  })
}
