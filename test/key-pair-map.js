/* global describe,it */
'use strict'
let should = require('should')
let KeyPairMap = require('../lib/key-pair-map')
let KeyPair = require('../lib/key-pair')
let PrivKey = require('../lib/priv-key')

describe('KeyPairMap', function () {
  let txHashBuf = Buffer.alloc(32)
  txHashBuf.fill(0x01)
  let txOutNum = 5
  let scriptChunkIndex = 0
  let privKey = PrivKey.fromString('L3uCzo4TtW3FX5b5L9S5dKDu21ypeRofiiNnVuYnxGs5YRQrUFP2')
  let keyPair = KeyPair.fromPrivKey(privKey)

  it('should make a new keyPairMap', function () {
    let keyPairMap = new KeyPairMap()
    should.exist(keyPairMap)
    should.exist(keyPairMap.map)
  })

  describe('#set', function () {
    it('should set this vector', function () {
      let keyPairMap = new KeyPairMap()
      keyPairMap.set(txHashBuf, txOutNum, scriptChunkIndex, keyPair)
      let obj = keyPairMap.get(txHashBuf, txOutNum)
      obj.scriptChunkIndex.should.equal(scriptChunkIndex)
      obj.keyPair.toString().should.equal(keyPair.toString())
    })
  })

  describe('#get', function () {
    it('should get this vector', function () {
      let keyPairMap = new KeyPairMap()
      keyPairMap.set(txHashBuf, txOutNum, scriptChunkIndex, keyPair)
      let obj = keyPairMap.get(txHashBuf, txOutNum)
      obj.scriptChunkIndex.should.equal(scriptChunkIndex)
      obj.keyPair.toString().should.equal(keyPair.toString())

      let txHashBuf2 = '05'.repeat(32)
      let txOutNum2 = 9
      let scriptChunkIndex2 = 2
      let keyPair2 = KeyPair.fromRandom()
      keyPairMap.set(txHashBuf2, txOutNum2, scriptChunkIndex2, keyPair2)
      obj = keyPairMap.get(txHashBuf2, txOutNum2)
      obj.scriptChunkIndex.should.equal(scriptChunkIndex2)
      obj.keyPair.toString().should.equal(keyPair2.toString())
    })
  })
})
