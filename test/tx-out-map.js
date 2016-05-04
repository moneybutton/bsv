/* global describe,it */
'use strict'
let should = require('chai').should()
let TxOutmap = require('../lib/tx-out-map')
let Tx = require('../lib/tx')
let TxOut = require('../lib/tx-out')
let Script = require('../lib/script')
let Bn = require('../lib/bn')

describe('TxOutmap', function () {
  let txHashBuf = new Buffer(32)
  txHashBuf.fill(0)
  let label = txHashBuf.toString('hex') + ':' + '0'
  let txout = TxOut(Bn(0), Script('OP_RETURN'))
  let map = new Map()
  map.set(label, txout)
  let tx = Tx().fromHex('0100000001795b88d47a74e3be0948fc9d1b4737f96097474d57151afa6f77c787961e47cc120000006a47304402202289f9e1ae2ed981cd0bf62f822f6ae4aea40c65c7339d90643cea90de93ad1502205c8a08b3265f9ba7e99057d030d5b91c889a1b99f94a3a5b79d7daaada2409b6012103798b51f980e7a3690af6b43ce3467db75bede190385702c4d9d48c0a735ff4a9ffffffff01c0a83200000000001976a91447b8e62e008f82d95d1f565055a8243cc243d32388ac00000000')

  it('should make a new txoutmap', function () {
    let txoutmap = new TxOutmap()
    txoutmap = TxOutmap()
    txoutmap = TxOutmap({map: map})
    should.exist(txoutmap)
    should.exist(txoutmap.map)
  })

  describe('#fromObject', function () {
    it('should set a map', function () {
      let txoutmap = TxOutmap().fromObject({map: map})
      txoutmap.map.get(label).toHex().should.equal(txout.toHex())
      txoutmap.fromObject({})
      txoutmap.map.get(label).toHex().should.equal(txout.toHex())
    })
  })

  describe('#toJson', function () {
    it('convert to json', function () {
      let txoutmap = TxOutmap().add(txHashBuf, 0, txout)
        .add(txHashBuf, 1, txout)
        .add(txHashBuf, 2, txout)
      let json = txoutmap.toJson()
      Object.keys(json).length.should.equal(3)
    })
  })

  describe('#fromJson', function () {
    it('convert to/from json roundtrip', function () {
      let txoutmap = TxOutmap().add(txHashBuf, 0, txout)
        .add(txHashBuf, 1, txout)
        .add(txHashBuf, 2, txout)
      let txoutmap2 = TxOutmap().fromJson(txoutmap.toJson())
      txoutmap2.get(txHashBuf, 0).toHex().should.equal(txoutmap.get(txHashBuf, 0).toHex())
      txoutmap2.get(txHashBuf, 1).toHex().should.equal(txoutmap.get(txHashBuf, 1).toHex())
      txoutmap2.get(txHashBuf, 2).toHex().should.equal(txoutmap.get(txHashBuf, 2).toHex())
    })
  })

  describe('#add', function () {
    it('should add a txout to the txoutmap', function () {
      let txoutmap = TxOutmap().add(txHashBuf, 0, txout)
      should.exist(txoutmap.map.get(label))
    })
  })

  describe('#get', function () {
    it('should get a txout', function () {
      let txoutmap = TxOutmap().fromObject({map: map})
      txoutmap.get(txHashBuf, 0).toHex().should.equal(txout.toHex())
    })
  })

  describe('#addTx', function () {
    it('should add all outputs from a tx', function () {
      let txoutmap = TxOutmap().addTx(tx)
      let txHashBuf = tx.hash()
      let txout = tx.txouts[0]
      txoutmap.get(txHashBuf, 0).toHex().should.equal(txout.toHex())
    })
  })
})
