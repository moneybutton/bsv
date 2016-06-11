/* global describe,it */
'use strict'
let Bn = require('../lib/bn')
let Br = require('../lib/br')
let Interp = require('../lib/interp')
let Script = require('../lib/script')
let Tx = require('../lib/tx')
let TxOut = require('../lib/tx-out')
let TxOutMap = require('../lib/tx-out-map')
let TxVerifier = require('../lib/tx-verifier')
let asink = require('asink')
let should = require('chai').should()
let txInvalid = require('./vectors/bitcoind/tx_invalid')
let txValid = require('./vectors/bitcoind/tx_valid')
let coolestTxVector = require('./vectors/coolest-tx-ever-sent.json')
let sighashSingleVector = require('./vectors/sighash-single-bug.json')

describe('TxVerifier', function () {
  it('should make a new txverifier', function () {
    let txverifier = new TxVerifier()
    ;(txverifier instanceof TxVerifier).should.equal(true)
    txverifier = new TxVerifier()
    ;(txverifier instanceof TxVerifier).should.equal(true)
    txverifier = new TxVerifier({
      tx: new Tx()
    })
    should.exist(txverifier.tx)
  })

  describe('#getDebugObject', function () {
    it('should get an object with these properties', function () {
      let vector = txInvalid[10]
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
      let txVerifier = new TxVerifier(tx, txOutMap)
      let verified = txVerifier.verify(flags)
      verified.should.equal(false)
      let debugObject = txVerifier.getDebugObject()
      should.exist(debugObject.errStr)
      should.exist(debugObject.interpFailure)
    })
  })

  describe('#getDebugString', function () {
    it('should get an object with these properties', function () {
      let vector = txInvalid[10]
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
      let txVerifier = new TxVerifier(tx, txOutMap)
      let verified = txVerifier.verify(flags)
      verified.should.equal(false)
      let debugString = txVerifier.getDebugString()
      debugString.should.equal('{\n  "errStr": "input 0 failed script verify",\n  "interpFailure": {\n    "errStr": "SCRIPT_ERR_CHECKSIGVERIFY",\n    "scriptStr": "OP_DUP OP_HASH160 20 0x5b6462475454710f3c22f5fdf0b40704c92f25c3 OP_EQUALVERIFY OP_CHECKSIGVERIFY OP_1 OP_PUSHDATA1 71 0x3044022067288ea50aa799543a536ff9306f8e1cba05b9c6b10951175b924f96732555ed022026d7b5265f38d21541519e4a1e55044d5b9e17e15cdbaf29ae3792e99e883e7a01",\n    "pc": 4,\n    "stack": [\n      ""\n    ],\n    "altStack": [],\n    "opCodeStr": "OP_CHECKSIGVERIFY"\n  }\n}')
    })
  })

  describe('vectors', function () {
    it('should validate the coolest transaction ever', function () {
      // This test vector was given to me by JJ of bcoin. It is a transaction
      // with code seperators in the input. It also uses what used to be
      // OP_NOP2 but is now OP_CHECKLOCKTIMEVERIFY, so the
      // OP_CHECKLOCKTIMEVERIFY flag cannot be enabled to verify this tx.
      let flags = 0
      let tx = Tx.fromHex(coolestTxVector.tx)
      let intx0 = Tx.fromHex(coolestTxVector.intx0)
      let intx1 = Tx.fromHex(coolestTxVector.intx1)
      let txOutMap = new TxOutMap()
      txOutMap.addTx(intx0)
      txOutMap.addTx(intx1)
      let txVerifier = new TxVerifier(tx, txOutMap)
      let str = txVerifier.verifyStr(flags)
      str.should.equal(false)
    })

    it('should validate this sighash single test vector', function () {
      // This test vector was given to me by JJ of bcoin. It is a transaction
      // on testnet, not mainnet. It highlights the famous "sighash single bug"
      // which is where sighash single returns a transaction hash of all 00s in
      // the case where there are more inputs than outputs. Peter Todd has
      // written about the sighash single bug here:
      // https://lists.linuxfoundation.org/pipermail/bitcoin-dev/2014-November/006878.html
      let flags = 0
      let tx = Tx.fromHex(sighashSingleVector.tx)
      let intx0 = Tx.fromHex(sighashSingleVector.intx0)
      let intx1 = Tx.fromHex(sighashSingleVector.intx1)
      let txOutMap = new TxOutMap()
      txOutMap.addTx(intx0)
      txOutMap.addTx(intx1)
      let txVerifier = new TxVerifier(tx, txOutMap)
      let str = txVerifier.verifyStr(flags)
      str.should.equal(false)
    })

    let c = 0
    txValid.forEach(function (vector, i) {
      if (vector.length === 1) {
        return
      }
      c++
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
  })
})
