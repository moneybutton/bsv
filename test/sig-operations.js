/* global describe,it */
'use strict'
import should from 'should'
import { SigOperations } from '../lib/sig-operations'
import { KeyPair } from '../lib/key-pair'
import { PrivKey } from '../lib/priv-key'
import { Sig } from '../lib/sig'
import { Address } from '../lib/address'

describe('SigOperations', function () {
  const txHashBuf = Buffer.alloc(32)
  txHashBuf.fill(0x01)
  const txOutNum = 5
  const nScriptChunk = 0
  const privKey = PrivKey.fromString('L3uCzo4TtW3FX5b5L9S5dKDu21ypeRofiiNnVuYnxGs5YRQrUFP2')
  const keyPair = KeyPair.fromPrivKey(privKey)
  const pubKey = keyPair.pubKey
  const addressStr = Address.fromPubKey(pubKey).toString()
  const type = 'sig'

  it('should make a new sigOperations', function () {
    const sigOperations = new SigOperations()
    should.exist(sigOperations)
    should.exist(sigOperations.map)
  })

  describe('#setOne', function () {
    it('should set this vector', function () {
      const sigOperations = new SigOperations()
      sigOperations.setOne(txHashBuf, txOutNum, nScriptChunk, type, addressStr)
      const arr = sigOperations.get(txHashBuf, txOutNum)
      const obj = arr[0]
      obj.nScriptChunk.should.equal(nScriptChunk)
      obj.nHashType.should.equal(Sig.SIGHASH_ALL | Sig.SIGHASH_FORKID)
      obj.addressStr.should.equal(addressStr)
    })

    it('should set this vector with type pubKey', function () {
      const sigOperations = new SigOperations()
      const type = 'pubKey'
      sigOperations.setOne(txHashBuf, txOutNum, nScriptChunk, type, addressStr)
      const arr = sigOperations.get(txHashBuf, txOutNum)
      const obj = arr[0]
      obj.nScriptChunk.should.equal(nScriptChunk)
      obj.type.should.equal('pubKey')
      obj.nHashType.should.equal(Sig.SIGHASH_ALL | Sig.SIGHASH_FORKID)
      obj.addressStr.should.equal(addressStr)
    })

    it('should set this vector with a different nHashType', function () {
      const sigOperations = new SigOperations()
      sigOperations.setOne(txHashBuf, txOutNum, nScriptChunk, type, addressStr, Sig.SIGHASH_ALL)
      const arr = sigOperations.get(txHashBuf, txOutNum)
      const obj = arr[0]
      obj.nHashType.should.equal(Sig.SIGHASH_ALL)
      obj.nHashType.should.not.equal(Sig.SIGHASH_ALL | Sig.SIGHASH_FORKID)
    })
  })

  describe('#setMany', function () {
    it('should set this vector', function () {
      const sigOperations = new SigOperations()
      let arr = [
        { nScriptChunk, addressStr }
      ]
      sigOperations.setMany(txHashBuf, txOutNum, arr)
      arr = sigOperations.get(txHashBuf, txOutNum)
      const obj = arr[0]
      obj.nScriptChunk.should.equal(nScriptChunk)
      should.exist(obj.nHashType)
      obj.addressStr.should.equal(addressStr)
    })
  })

  describe('#addOne', function () {
    it('should add this vector', function () {
      const sigOperations = new SigOperations()
      sigOperations.addOne(txHashBuf, txOutNum, nScriptChunk, type, addressStr)
      const arr = sigOperations.get(txHashBuf, txOutNum)
      const obj = arr[0]
      obj.nScriptChunk.should.equal(nScriptChunk)
      obj.nHashType.should.equal(Sig.SIGHASH_ALL | Sig.SIGHASH_FORKID)
      obj.addressStr.should.equal(addressStr)
    })

    it('should add two vectors', function () {
      const sigOperations = new SigOperations()
      sigOperations.addOne(txHashBuf, txOutNum, nScriptChunk, type, addressStr)
      let arr = sigOperations.get(txHashBuf, txOutNum)
      let obj = arr[0]
      obj.nScriptChunk.should.equal(nScriptChunk)
      obj.addressStr.should.equal(addressStr)

      const nScriptChunk2 = 2
      const addressStr2 = Address.fromPubKey(KeyPair.fromRandom().pubKey).toString()
      sigOperations.addOne(txHashBuf, txOutNum, nScriptChunk2, type, addressStr2)
      arr = sigOperations.get(txHashBuf, txOutNum)
      obj = arr[1]
      obj.nScriptChunk.should.equal(nScriptChunk2)
      obj.addressStr.should.equal(addressStr2.toString())
    })

    it('should add two vectors where one has type pubKey', function () {
      const sigOperations = new SigOperations()
      sigOperations.addOne(txHashBuf, txOutNum, nScriptChunk, 'pubKey', addressStr)
      let arr = sigOperations.get(txHashBuf, txOutNum)
      let obj = arr[0]
      obj.type.should.equal('pubKey')
      obj.nScriptChunk.should.equal(nScriptChunk)
      obj.addressStr.should.equal(addressStr)

      const nScriptChunk2 = 2
      const addressStr2 = Address.fromPubKey(KeyPair.fromRandom().pubKey).toString()
      sigOperations.addOne(txHashBuf, txOutNum, nScriptChunk2, type, addressStr2)
      arr = sigOperations.get(txHashBuf, txOutNum)
      obj = arr[1]
      obj.nScriptChunk.should.equal(nScriptChunk2)
      obj.addressStr.should.equal(addressStr2.toString())
    })
  })

  describe('#get', function () {
    it('should get this vector', function () {
      const sigOperations = new SigOperations()
      sigOperations.setOne(txHashBuf, txOutNum, nScriptChunk, type, addressStr)
      let arr = sigOperations.get(txHashBuf, txOutNum)
      let obj = arr[0]
      obj.nScriptChunk.should.equal(nScriptChunk)
      obj.addressStr.should.equal(addressStr)

      const txHashBuf2 = '05'.repeat(32)
      const txOutNum2 = 9
      const nScriptChunk2 = 2
      const addressStr2 = Address.fromPubKey(KeyPair.fromRandom().pubKey).toString()
      sigOperations.setOne(txHashBuf2, txOutNum2, nScriptChunk2, type, addressStr2)
      arr = sigOperations.get(txHashBuf2, txOutNum2)
      obj = arr[0]
      obj.nScriptChunk.should.equal(nScriptChunk2)
      obj.addressStr.should.equal(addressStr2.toString())
    })

    it('should return empty list when no sig operation was registered', function () {
      const sigOperations = new SigOperations()
      const txHashBuf = Buffer.alloc(32).fill(1)
      const result = sigOperations.get(txHashBuf, 0)
      should(result).be.eql([])
    })
  })
})
