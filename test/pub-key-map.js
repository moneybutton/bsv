/* global describe,it */
'use strict'
let should = require('should')
let PubKeyMap = require('../lib/pub-key-map')
let KeyPair = require('../lib/key-pair')
let PrivKey = require('../lib/priv-key')
let Sig = require('../lib/sig')

describe('PubKeyMap', function () {
  let txHashBuf = Buffer.alloc(32)
  txHashBuf.fill(0x01)
  let txOutNum = 5
  let nScriptChunk = 0
  let privKey = PrivKey.fromString('L3uCzo4TtW3FX5b5L9S5dKDu21ypeRofiiNnVuYnxGs5YRQrUFP2')
  let keyPair = KeyPair.fromPrivKey(privKey)
  let pubKey = keyPair.pubKey

  it('should make a new pubKeyMap', function () {
    let pubKeyMap = new PubKeyMap()
    should.exist(pubKeyMap)
    should.exist(pubKeyMap.map)
  })

  describe('#setOne', function () {
    it('should set this vector', function () {
      let pubKeyMap = new PubKeyMap()
      pubKeyMap.setOne(txHashBuf, txOutNum, nScriptChunk, pubKey)
      let arr = pubKeyMap.get(txHashBuf, txOutNum)
      let obj = arr[0]
      obj.nScriptChunk.should.equal(nScriptChunk)
      obj.nHashType.should.equal(Sig.SIGHASH_ALL | Sig.SIGHASH_FORKID)
      obj.pubKey.toString().should.equal(pubKey.toString())
    })

    it('should set this vector with a different nHashType', function () {
      let pubKeyMap = new PubKeyMap()
      pubKeyMap.setOne(txHashBuf, txOutNum, nScriptChunk, pubKey, Sig.SIGHASH_ALL)
      let arr = pubKeyMap.get(txHashBuf, txOutNum)
      let obj = arr[0]
      obj.nHashType.should.equal(Sig.SIGHASH_ALL)
      obj.nHashType.should.not.equal(Sig.SIGHASH_ALL | Sig.SIGHASH_FORKID)
    })

    it('should set this vector with two pubkeys', function () {
      let pubKeyMap = new PubKeyMap()
      let arr = [
        { nScriptChunk, pubKey }
      ]
      pubKeyMap.setMany(txHashBuf, txOutNum, arr)
      arr = pubKeyMap.get(txHashBuf, txOutNum)
      let obj = arr[0]
      obj.nScriptChunk.should.equal(nScriptChunk)
      should.not.exist(obj.nHashType)
      obj.pubKey.toString().should.equal(pubKey.toString())
    })
  })

  describe('#addOne', function () {
    it('should add this vector', function () {
      let pubKeyMap = new PubKeyMap()
      pubKeyMap.addOne(txHashBuf, txOutNum, nScriptChunk, pubKey)
      let arr = pubKeyMap.get(txHashBuf, txOutNum)
      let obj = arr[0]
      obj.nScriptChunk.should.equal(nScriptChunk)
      obj.nHashType.should.equal(Sig.SIGHASH_ALL | Sig.SIGHASH_FORKID)
      obj.pubKey.toString().should.equal(pubKey.toString())
    })

    it('should add two vectors', function () {
      let pubKeyMap = new PubKeyMap()
      pubKeyMap.addOne(txHashBuf, txOutNum, nScriptChunk, pubKey)
      let arr = pubKeyMap.get(txHashBuf, txOutNum)
      let obj = arr[0]
      obj.nScriptChunk.should.equal(nScriptChunk)
      obj.pubKey.toString().should.equal(pubKey.toString())

      let nScriptChunk2 = 2
      let pubKey2 = KeyPair.fromRandom().pubKey
      pubKeyMap.addOne(txHashBuf, txOutNum, nScriptChunk2, pubKey2)
      arr = pubKeyMap.get(txHashBuf, txOutNum)
      obj = arr[1]
      obj.nScriptChunk.should.equal(nScriptChunk2)
      obj.pubKey.toString().should.equal(pubKey2.toString())
    })
  })

  describe('#get', function () {
    it('should get this vector', function () {
      let pubKeyMap = new PubKeyMap()
      pubKeyMap.setOne(txHashBuf, txOutNum, nScriptChunk, pubKey)
      let arr = pubKeyMap.get(txHashBuf, txOutNum)
      let obj = arr[0]
      obj.nScriptChunk.should.equal(nScriptChunk)
      obj.pubKey.toString().should.equal(pubKey.toString())

      let txHashBuf2 = '05'.repeat(32)
      let txOutNum2 = 9
      let nScriptChunk2 = 2
      let pubKey2 = KeyPair.fromRandom().pubKey
      pubKeyMap.setOne(txHashBuf2, txOutNum2, nScriptChunk2, pubKey2)
      arr = pubKeyMap.get(txHashBuf2, txOutNum2)
      obj = arr[0]
      obj.nScriptChunk.should.equal(nScriptChunk2)
      obj.pubKey.toString().should.equal(pubKey2.toString())
    })
  })
})
