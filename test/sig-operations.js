/* global describe,it */
'use strict'
let should = require('should')
let SigOperations = require('../lib/sig-operations')
let KeyPair = require('../lib/key-pair')
let PrivKey = require('../lib/priv-key')
let Sig = require('../lib/sig')
let Address = require('../lib/address')

describe('SigOperations', function () {
  let txHashBuf = Buffer.alloc(32)
  txHashBuf.fill(0x01)
  let txOutNum = 5
  let nScriptChunk = 0
  let privKey = PrivKey.fromString('L3uCzo4TtW3FX5b5L9S5dKDu21ypeRofiiNnVuYnxGs5YRQrUFP2')
  let keyPair = KeyPair.fromPrivKey(privKey)
  let pubKey = keyPair.pubKey
  let addressStr = Address.fromPubKey(pubKey).toString()
  let type = 'sig'

  it('should make a new sigOperations', function () {
    let sigOperations = new SigOperations()
    should.exist(sigOperations)
    should.exist(sigOperations.map)
  })

  describe('#setOne', function () {
    it('should set this vector', function () {
      let sigOperations = new SigOperations()
      sigOperations.setOne(txHashBuf, txOutNum, nScriptChunk, type, addressStr)
      let arr = sigOperations.get(txHashBuf, txOutNum)
      let obj = arr[0]
      obj.nScriptChunk.should.equal(nScriptChunk)
      obj.nHashType.should.equal(Sig.SIGHASH_ALL | Sig.SIGHASH_FORKID)
      obj.addressStr.should.equal(addressStr)
    })

    it('should set this vector with type pubKey', function () {
      let sigOperations = new SigOperations()
      let type = 'pubKey'
      sigOperations.setOne(txHashBuf, txOutNum, nScriptChunk, type, addressStr)
      let arr = sigOperations.get(txHashBuf, txOutNum)
      let obj = arr[0]
      obj.nScriptChunk.should.equal(nScriptChunk)
      obj.type.should.equal('pubKey')
      obj.nHashType.should.equal(Sig.SIGHASH_ALL | Sig.SIGHASH_FORKID)
      obj.addressStr.should.equal(addressStr)
    })

    it('should set this vector with a different nHashType', function () {
      let sigOperations = new SigOperations()
      sigOperations.setOne(txHashBuf, txOutNum, nScriptChunk, type, addressStr, Sig.SIGHASH_ALL)
      let arr = sigOperations.get(txHashBuf, txOutNum)
      let obj = arr[0]
      obj.nHashType.should.equal(Sig.SIGHASH_ALL)
      obj.nHashType.should.not.equal(Sig.SIGHASH_ALL | Sig.SIGHASH_FORKID)
    })
  })

  describe('#setMany', function () {
    it('should set this vector', function () {
      let sigOperations = new SigOperations()
      let arr = [
        { nScriptChunk, addressStr }
      ]
      sigOperations.setMany(txHashBuf, txOutNum, arr)
      arr = sigOperations.get(txHashBuf, txOutNum)
      let obj = arr[0]
      obj.nScriptChunk.should.equal(nScriptChunk)
      should.exist(obj.nHashType)
      obj.addressStr.should.equal(addressStr)
    })
  })

  describe('#addOne', function () {
    it('should add this vector', function () {
      let sigOperations = new SigOperations()
      sigOperations.addOne(txHashBuf, txOutNum, nScriptChunk, type, addressStr)
      let arr = sigOperations.get(txHashBuf, txOutNum)
      let obj = arr[0]
      obj.nScriptChunk.should.equal(nScriptChunk)
      obj.nHashType.should.equal(Sig.SIGHASH_ALL | Sig.SIGHASH_FORKID)
      obj.addressStr.should.equal(addressStr)
    })

    it('should add two vectors', function () {
      let sigOperations = new SigOperations()
      sigOperations.addOne(txHashBuf, txOutNum, nScriptChunk, type, addressStr)
      let arr = sigOperations.get(txHashBuf, txOutNum)
      let obj = arr[0]
      obj.nScriptChunk.should.equal(nScriptChunk)
      obj.addressStr.should.equal(addressStr)

      let nScriptChunk2 = 2
      let addressStr2 = Address.fromPubKey(KeyPair.fromRandom().pubKey).toString()
      sigOperations.addOne(txHashBuf, txOutNum, nScriptChunk2, type, addressStr2)
      arr = sigOperations.get(txHashBuf, txOutNum)
      obj = arr[1]
      obj.nScriptChunk.should.equal(nScriptChunk2)
      obj.addressStr.should.equal(addressStr2.toString())
    })

    it('should add two vectors where one has type pubKey', function () {
      let sigOperations = new SigOperations()
      sigOperations.addOne(txHashBuf, txOutNum, nScriptChunk, 'pubKey', addressStr)
      let arr = sigOperations.get(txHashBuf, txOutNum)
      let obj = arr[0]
      obj.type.should.equal('pubKey')
      obj.nScriptChunk.should.equal(nScriptChunk)
      obj.addressStr.should.equal(addressStr)

      let nScriptChunk2 = 2
      let addressStr2 = Address.fromPubKey(KeyPair.fromRandom().pubKey).toString()
      sigOperations.addOne(txHashBuf, txOutNum, nScriptChunk2, type, addressStr2)
      arr = sigOperations.get(txHashBuf, txOutNum)
      obj = arr[1]
      obj.nScriptChunk.should.equal(nScriptChunk2)
      obj.addressStr.should.equal(addressStr2.toString())
    })
  })

  describe('#get', function () {
    it('should get this vector', function () {
      let sigOperations = new SigOperations()
      sigOperations.setOne(txHashBuf, txOutNum, nScriptChunk, type, addressStr)
      let arr = sigOperations.get(txHashBuf, txOutNum)
      let obj = arr[0]
      obj.nScriptChunk.should.equal(nScriptChunk)
      obj.addressStr.should.equal(addressStr)

      let txHashBuf2 = '05'.repeat(32)
      let txOutNum2 = 9
      let nScriptChunk2 = 2
      let addressStr2 = Address.fromPubKey(KeyPair.fromRandom().pubKey).toString()
      sigOperations.setOne(txHashBuf2, txOutNum2, nScriptChunk2, type, addressStr2)
      arr = sigOperations.get(txHashBuf2, txOutNum2)
      obj = arr[0]
      obj.nScriptChunk.should.equal(nScriptChunk2)
      obj.addressStr.should.equal(addressStr2.toString())
    })
  })
})
