/* global describe,it */
'use strict'
let should = require('chai').should()
let TxOutMap = require('../lib/tx-out-map')
let Tx = require('../lib/tx')
let TxOut = require('../lib/tx-out')
let Script = require('../lib/script')
let Bn = require('../lib/bn')

describe('TxOutMap', function () {
  let txHashBuf = new Buffer(32)
  txHashBuf.fill(0)
  let label = txHashBuf.toString('hex') + ':' + '0'
  let txOut = TxOut.fromProperties(new Bn(0), new Script('OP_RETURN'))
  let map = new Map()
  map.set(label, txOut)
  let tx = new Tx().fromHex('0100000001795b88d47a74e3be0948fc9d1b4737f96097474d57151afa6f77c787961e47cc120000006a47304402202289f9e1ae2ed981cd0bf62f822f6ae4aea40c65c7339d90643cea90de93ad1502205c8a08b3265f9ba7e99057d030d5b91c889a1b99f94a3a5b79d7daaada2409b6012103798b51f980e7a3690af6b43ce3467db75bede190385702c4d9d48c0a735ff4a9ffffffff01c0a83200000000001976a91447b8e62e008f82d95d1f565055a8243cc243d32388ac00000000')

  it('should make a new txOutmap', function () {
    let txOutmap = new TxOutMap()
    txOutmap = new TxOutMap({map: map})
    should.exist(txOutmap)
    should.exist(txOutmap.map)
  })

  describe('#fromObject', function () {
    it('should set a map', function () {
      let txOutmap = new TxOutMap().fromObject({map: map})
      txOutmap.map.get(label).toHex().should.equal(txOut.toHex())
      txOutmap.fromObject({})
      txOutmap.map.get(label).toHex().should.equal(txOut.toHex())
    })
  })

  describe('#toJson', function () {
    it('convert to json', function () {
      let txOutmap = new TxOutMap().add(txHashBuf, 0, txOut)
        .add(txHashBuf, 1, txOut)
        .add(txHashBuf, 2, txOut)
      let json = txOutmap.toJson()
      Object.keys(json).length.should.equal(3)
    })
  })

  describe('#fromJson', function () {
    it('convert to/from json roundtrip', function () {
      let txOutmap = new TxOutMap().add(txHashBuf, 0, txOut)
        .add(txHashBuf, 1, txOut)
        .add(txHashBuf, 2, txOut)
      let txOutmap2 = new TxOutMap().fromJson(txOutmap.toJson())
      txOutmap2.get(txHashBuf, 0).toHex().should.equal(txOutmap.get(txHashBuf, 0).toHex())
      txOutmap2.get(txHashBuf, 1).toHex().should.equal(txOutmap.get(txHashBuf, 1).toHex())
      txOutmap2.get(txHashBuf, 2).toHex().should.equal(txOutmap.get(txHashBuf, 2).toHex())
    })
  })

  describe('#add', function () {
    it('should add a txOut to the txOutmap', function () {
      let txOutmap = new TxOutMap().add(txHashBuf, 0, txOut)
      should.exist(txOutmap.map.get(label))
    })
  })

  describe('#get', function () {
    it('should get a txOut', function () {
      let txOutmap = new TxOutMap().fromObject({map: map})
      txOutmap.get(txHashBuf, 0).toHex().should.equal(txOut.toHex())
    })
  })

  describe('#addTx', function () {
    it('should add all outputs from a tx', function () {
      let txOutmap = new TxOutMap().addTx(tx)
      let txHashBuf = tx.hash()
      let txOut = tx.txOuts[0]
      txOutmap.get(txHashBuf, 0).toHex().should.equal(txOut.toHex())
    })
  })
})
