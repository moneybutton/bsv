/* global describe,it */
'use strict'
import { Address } from '../lib/address'
import { Bn } from '../lib/bn'
import { Br } from '../lib/br'
import { Interp } from '../lib/interp'
import { KeyPair } from '../lib/key-pair'
import { Script } from '../lib/script'
import { Tx } from '../lib/tx'
import { TxOut } from '../lib/tx-out'
import { TxOutMap } from '../lib/tx-out-map'
import { TxBuilder } from '../lib/tx-builder'
import { TxVerifier } from '../lib/tx-verifier'
import should from 'should'
import coolestTxVector from './vectors/coolest-tx-ever-sent.json'
import sighashSingleVector from './vectors/sighash-single-bug.json'
import txInvalid from './vectors/bitcoind/tx_invalid.json'
import txValid from './vectors/bitcoind/tx_valid.json'

describe('TxVerifier', function () {
  it('should make a new txVerifier', function () {
    let txVerifier = new TxVerifier()
    ;(txVerifier instanceof TxVerifier).should.equal(true)
    txVerifier = new TxVerifier()
    ;(txVerifier instanceof TxVerifier).should.equal(true)
    txVerifier = new TxVerifier({
      tx: new Tx()
    })
    should.exist(txVerifier.tx)
  })

  describe('#getDebugObject', function () {
    it('should get an object with these properties', function () {
      const vector = txInvalid[10]
      const inputs = vector[0]
      const txhex = vector[1]
      const flags = Interp.getFlags(vector[2])

      const txOutMap = new TxOutMap()
      inputs.forEach(function (input) {
        let txOutNum = input[1]
        if (txOutNum === -1) {
          txOutNum = 0xffffffff // bitcoind casts -1 to an unsigned int
        }
        const txOut = TxOut.fromProperties(
          new Bn(0),
          new Script().fromBitcoindString(input[2])
        )
        const txHashBuf = new Br(Buffer.from(input[0], 'hex')).readReverse()
        txOutMap.set(txHashBuf, txOutNum, txOut)
      })

      const tx = new Tx().fromBuffer(Buffer.from(txhex, 'hex'))
      const txVerifier = new TxVerifier(tx, txOutMap)
      const verified = txVerifier.verify(flags)
      verified.should.equal(false)
      const debugObject = txVerifier.getDebugObject()
      should.exist(debugObject.errStr)
      should.exist(debugObject.interpFailure)
    })
  })

  describe('#getDebugString', function () {
    it('should get an object with these properties', function () {
      const vector = txInvalid[10]
      const inputs = vector[0]
      const txhex = vector[1]
      const flags = Interp.getFlags(vector[2])

      const txOutMap = new TxOutMap()
      inputs.forEach(function (input) {
        let txOutNum = input[1]
        if (txOutNum === -1) {
          txOutNum = 0xffffffff // bitcoind casts -1 to an unsigned int
        }
        const txOut = TxOut.fromProperties(
          new Bn(0),
          new Script().fromBitcoindString(input[2])
        )
        const txHashBuf = new Br(Buffer.from(input[0], 'hex')).readReverse()
        txOutMap.set(txHashBuf, txOutNum, txOut)
      })

      const tx = new Tx().fromBuffer(Buffer.from(txhex, 'hex'))
      const txVerifier = new TxVerifier(tx, txOutMap)
      const verified = txVerifier.verify(flags)
      verified.should.equal(false)
      const debugString = txVerifier.getDebugString()
      debugString.should.equal(
        '{\n  "errStr": "input 0 failed script verify",\n  "interpFailure": {\n    "errStr": "SCRIPT_ERR_CHECKSIGVERIFY",\n    "scriptStr": "OP_DUP OP_HASH160 20 0x5b6462475454710f3c22f5fdf0b40704c92f25c3 OP_EQUALVERIFY OP_CHECKSIGVERIFY OP_1 OP_PUSHDATA1 71 0x3044022067288ea50aa799543a536ff9306f8e1cba05b9c6b10951175b924f96732555ed022026d7b5265f38d21541519e4a1e55044d5b9e17e15cdbaf29ae3792e99e883e7a01",\n    "pc": 4,\n    "stack": [\n      ""\n    ],\n    "altStack": [],\n    "opCodeStr": "OP_CHECKSIGVERIFY"\n  }\n}'
      )
    })
  })

  describe('vectors', function () {
    it('should validate the coolest transaction ever', function () {
      // This test vector was given to me by JJ of bcoin. It is a transaction
      // with code seperators in the input. It also uses what used to be
      // OP_NOP2 but is now OP_CHECKLOCKTIMEVERIFY, so the
      // OP_CHECKLOCKTIMEVERIFY flag cannot be enabled to verify this tx.
      const flags = 0
      const tx = Tx.fromHex(coolestTxVector.tx)
      const intx0 = Tx.fromHex(coolestTxVector.intx0)
      const intx1 = Tx.fromHex(coolestTxVector.intx1)
      const txOutMap = new TxOutMap()
      txOutMap.setTx(intx0)
      txOutMap.setTx(intx1)
      const txVerifier = new TxVerifier(tx, txOutMap)
      const str = txVerifier.verifyStr(flags)
      str.should.equal(false)
    })

    it('should validate this sighash single test vector', function () {
      // This test vector was given to me by JJ of bcoin. It is a transaction
      // on testnet, not mainnet. It highlights the famous "sighash single bug"
      // which is where sighash single returns a transaction hash of all 00s in
      // the case where there are more inputs than outputs. Peter Todd has
      // written about the sighash single bug here:
      // https://lists.linuxfoundation.org/pipermail/bitcoin-dev/2014-November/006878.html
      const flags = 0
      const tx = Tx.fromHex(sighashSingleVector.tx)
      const intx0 = Tx.fromHex(sighashSingleVector.intx0)
      const intx1 = Tx.fromHex(sighashSingleVector.intx1)
      const txOutMap = new TxOutMap()
      txOutMap.setTx(intx0)
      txOutMap.setTx(intx1)
      const txVerifier = new TxVerifier(tx, txOutMap)
      const str = txVerifier.verifyStr(flags)
      str.should.equal(false)
    })
  })

  describe('TxVerifier Vectors', function () {
    let c = 0
    txValid.forEach(function (vector, i) {
      if (vector.length === 1) {
        return
      }
      c++
      it('should verify txValid vector ' + c, function () {
        const inputs = vector[0]
        const txhex = vector[1]
        const flags = Interp.getFlags(vector[2])

        const txOutMap = new TxOutMap()
        inputs.forEach(function (input) {
          let txOutNum = input[1]
          if (txOutNum === -1) {
            txOutNum = 0xffffffff // bitcoind casts -1 to an unsigned int
          }
          const txOut = TxOut.fromProperties(
            new Bn(0),
            new Script().fromBitcoindString(input[2])
          )
          const txHashBuf = new Br(Buffer.from(input[0], 'hex')).readReverse()
          txOutMap.set(txHashBuf, txOutNum, txOut)
        })

        const tx = new Tx().fromBuffer(Buffer.from(txhex, 'hex'))
        const verified = TxVerifier.verify(tx, txOutMap, flags)
        verified.should.equal(true)
      })

      it('should async verify txValid vector ' + c, async function () {
        const inputs = vector[0]
        const txhex = vector[1]
        const flags = Interp.getFlags(vector[2])

        const txOutMap = new TxOutMap()
        inputs.forEach(function (input) {
          let txOutNum = input[1]
          if (txOutNum === -1) {
            txOutNum = 0xffffffff // bitcoind casts -1 to an unsigned int
          }
          const txOut = TxOut.fromProperties(
            new Bn(0),
            new Script().fromBitcoindString(input[2])
          )
          const txHashBuf = new Br(Buffer.from(input[0], 'hex')).readReverse()
          txOutMap.set(txHashBuf, txOutNum, txOut)
        })

        const tx = new Tx().fromBuffer(Buffer.from(txhex, 'hex'))
        const verified = await TxVerifier.asyncVerify(tx, txOutMap, flags)
        verified.should.equal(true)
      })
    })

    c = 0
    txInvalid.forEach(function (vector, i) {
      if (vector.length === 1) {
        return
      }
      c++
      it('should unverify txInvalid vector ' + c, function () {
        const inputs = vector[0]
        const txhex = vector[1]
        const flags = Interp.getFlags(vector[2])

        const txOutMap = new TxOutMap()
        inputs.forEach(function (input) {
          let txOutNum = input[1]
          if (txOutNum === -1) {
            txOutNum = 0xffffffff // bitcoind casts -1 to an unsigned int
          }
          const txOut = TxOut.fromProperties(
            new Bn(0),
            new Script().fromBitcoindString(input[2])
          )
          const txHashBuf = new Br(Buffer.from(input[0], 'hex')).readReverse()
          txOutMap.set(txHashBuf, txOutNum, txOut)
        })

        const tx = new Tx().fromBuffer(Buffer.from(txhex, 'hex'))

        const verified = TxVerifier.verify(tx, txOutMap, flags)
        verified.should.equal(false)
      })

      it('should async unverify txInvalid vector ' + c, async function () {
        const inputs = vector[0]
        const txhex = vector[1]
        const flags = Interp.getFlags(vector[2])

        const txOutMap = new TxOutMap()
        inputs.forEach(function (input) {
          let txOutNum = input[1]
          if (txOutNum === -1) {
            txOutNum = 0xffffffff // bitcoind casts -1 to an unsigned int
          }
          const txOut = TxOut.fromProperties(
            new Bn(0),
            new Script().fromBitcoindString(input[2])
          )
          const txHashBuf = new Br(Buffer.from(input[0], 'hex')).readReverse()
          txOutMap.set(txHashBuf, txOutNum, txOut)
        })

        const tx = new Tx().fromBuffer(Buffer.from(txhex, 'hex'))

        const verified = await TxVerifier.asyncVerify(tx, txOutMap, flags)
        verified.should.equal(false)
      })
    })
  })
})
