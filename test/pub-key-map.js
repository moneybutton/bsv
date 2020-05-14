/* global describe,it */
'use strict'
let should = require('should')
let PubKeyMap = require('../lib/pub-key-map')
let KeyPair = require('../lib/key-pair')
let PrivKey = require('../lib/priv-key')

describe('PubKeyMap', function () {
  let txHashBuf = Buffer.alloc(32)
  txHashBuf.fill(0x01)
  let txOutNum = 5
  let scriptChunkIndex = 0
  let privKey = PrivKey.fromString('L3uCzo4TtW3FX5b5L9S5dKDu21ypeRofiiNnVuYnxGs5YRQrUFP2')
  let keyPair = KeyPair.fromPrivKey(privKey)
  let pubKey = keyPair.pubKey

  it('should make a new pubKeyMap', function () {
    let pubKeyMap = new PubKeyMap()
    should.exist(pubKeyMap)
    should.exist(pubKeyMap.map)
  })

  describe('#set', function () {
    it('should set this vector', function () {
      let pubKeyMap = new PubKeyMap()
      pubKeyMap.set(txHashBuf, txOutNum, scriptChunkIndex, pubKey)
      let obj = pubKeyMap.get(txHashBuf, txOutNum)
      obj.scriptChunkIndex.should.equal(scriptChunkIndex)
      obj.pubKey.toString().should.equal(pubKey.toString())
    })
  })

  describe('#get', function () {
    it('should get this vector', function () {
      let pubKeyMap = new PubKeyMap()
      pubKeyMap.set(txHashBuf, txOutNum, scriptChunkIndex, pubKey)
      let obj = pubKeyMap.get(txHashBuf, txOutNum)
      obj.scriptChunkIndex.should.equal(scriptChunkIndex)
      obj.pubKey.toString().should.equal(pubKey.toString())

      let txHashBuf2 = '05'.repeat(32)
      let txOutNum2 = 9
      let scriptChunkIndex2 = 2
      let pubKey2 = KeyPair.fromRandom().pubKey
      pubKeyMap.set(txHashBuf2, txOutNum2, scriptChunkIndex2, pubKey2)
      obj = pubKeyMap.get(txHashBuf2, txOutNum2)
      obj.scriptChunkIndex.should.equal(scriptChunkIndex2)
      obj.pubKey.toString().should.equal(pubKey2.toString())
    })
  })
})
