/* global describe,it */
'use strict'
import { KeyPair } from '../lib/key-pair'
import { PrivKey } from '../lib/priv-key'
import { PubKey } from '../lib/pub-key'
import { Bn } from '../lib/bn'
import should from 'should'

describe('KeyPair', function () {
  it('should satisfy this basic API', function () {
    let key = new KeyPair()
    should.exist(key)
    key = new KeyPair()
    should.exist(key)

    KeyPair.Mainnet.should.equal(KeyPair.Mainnet)
    KeyPair.Testnet.should.equal(KeyPair.Testnet)
    new KeyPair.Mainnet()
      .fromRandom()
      .privKey.constructor.should.equal(PrivKey.Mainnet)
    new KeyPair.Testnet()
      .fromRandom()
      .privKey.constructor.should.equal(PrivKey.Testnet)
  })

  it('should make a key with a priv and pub', function () {
    const priv = new PrivKey()
    const pub = new PubKey()
    const key = new KeyPair(priv, pub)
    should.exist(key)
    should.exist(key.privKey)
    should.exist(key.pubKey)
  })

  describe('#fromJSON', function () {
    it('should make a keyPair from this json', function () {
      const privKey = new PrivKey().fromRandom()
      const pubKey = new PubKey().fromPrivKey(privKey)
      const keyPair = new KeyPair().fromJSON({
        privKey: privKey.toJSON(),
        pubKey: pubKey.toJSON()
      })
      keyPair.privKey.toString().should.equal(privKey.toString())
      keyPair.pubKey.toString().should.equal(pubKey.toString())
    })
  })

  describe('#toJSON', function () {
    it('should make json from this keyPair', function () {
      const json = new KeyPair().fromRandom().toJSON()
      should.exist(json.privKey)
      should.exist(json.pubKey)
      const keyPair = new KeyPair().fromJSON(json)
      keyPair
        .toJSON()
        .privKey.toString()
        .should.equal(json.privKey.toString())
      keyPair
        .toJSON()
        .pubKey.toString()
        .should.equal(json.pubKey.toString())
    })
  })

  describe('#fromFastBuffer', function () {
    it('should convert from a fast buffer', function () {
      let keyPair = new KeyPair().fromRandom()
      const privKey1 = keyPair.privKey
      const pubKey1 = keyPair.pubKey
      const buf = keyPair.toFastBuffer()
      keyPair = new KeyPair().fromFastBuffer(buf)
      const privKey2 = keyPair.privKey
      const pubKey2 = keyPair.pubKey
      privKey1.toString().should.equal(privKey2.toString())
      pubKey1.toString().should.equal(pubKey2.toString())
    })
  })

  describe('#toFastBuffer', function () {
    it('should convert to a fast buffer', function () {
      let keyPair, buf

      keyPair = new KeyPair().fromRandom()
      keyPair.pubKey = undefined
      buf = keyPair.toFastBuffer()
      buf.length.should.greaterThan(32)

      keyPair = new KeyPair().fromRandom()
      keyPair.privKey = undefined
      buf = keyPair.toFastBuffer()
      buf.length.should.greaterThan(64)

      keyPair = new KeyPair().fromRandom()
      buf = keyPair.toFastBuffer()
      buf.length.should.greaterThan(32 + 64)
    })
  })

  describe('#fromString', function () {
    it('should convert to and from a string', function () {
      const keyPair = new KeyPair().fromRandom()
      const str = keyPair.toString()
      new KeyPair()
        .fromString(str)
        .toString()
        .should.equal(str)
    })
  })

  describe('#toPublic', function () {
    it('should set the private key to undefined', function () {
      const keyPair = new KeyPair().fromRandom()
      const publicKeyPair = keyPair.toPublic()

      should.exist(publicKeyPair)
      should.exist(publicKeyPair.pubKey)
      should.not.exist(publicKeyPair.privKey)
    })
  })

  describe('#fromPrivKey', function () {
    it('should make a new key from a privKey', function () {
      should.exist(new KeyPair().fromPrivKey(new PrivKey().fromRandom()).pubKey)
    })

    it('should convert this known PrivKey to known PubKey', function () {
      const privhex =
        '906977a061af29276e40bf377042ffbde414e496ae2260bbf1fa9d085637bfff'
      const pubhex =
        '02a1633cafcc01ebfb6d78e39f687a1f0995c62fc95f51ead10a02ee0be551b5dc'
      const privKey = new PrivKey().fromBn(Bn(Buffer.from(privhex, 'hex')))
      const key = new KeyPair().fromPrivKey(privKey)
      key.pubKey.toString().should.equal(pubhex)
    })

    it('should convert this known PrivKey to known PubKey and preserve compressed=false', function () {
      const privhex =
        '906977a061af29276e40bf377042ffbde414e496ae2260bbf1fa9d085637bfff'
      const privKey = new PrivKey().fromBn(Bn(Buffer.from(privhex, 'hex')))
      privKey.compressed = false
      const key = new KeyPair().fromPrivKey(privKey)
      key.pubKey.compressed.should.equal(false)
    })
  })

  describe('@fromPrivKey', function () {
    it('should make a new key from a privKey', function () {
      should.exist(KeyPair.fromPrivKey(new PrivKey().fromRandom()).pubKey)
    })

    it('should convert this known PrivKey to known PubKey', function () {
      const privhex =
        '906977a061af29276e40bf377042ffbde414e496ae2260bbf1fa9d085637bfff'
      const pubhex =
        '02a1633cafcc01ebfb6d78e39f687a1f0995c62fc95f51ead10a02ee0be551b5dc'
      const privKey = new PrivKey().fromBn(Bn(Buffer.from(privhex, 'hex')))
      const key = KeyPair.fromPrivKey(privKey)
      key.pubKey.toString().should.equal(pubhex)
    })

    it('should convert this known PrivKey to known PubKey and preserve compressed=false', function () {
      const privhex =
        '906977a061af29276e40bf377042ffbde414e496ae2260bbf1fa9d085637bfff'
      const privKey = new PrivKey().fromBn(Bn(Buffer.from(privhex, 'hex')))
      privKey.compressed = false
      const key = KeyPair.fromPrivKey(privKey)
      key.pubKey.compressed.should.equal(false)
    })
  })

  describe('#asyncFromPrivKey', function () {
    it('should convert a privKey same as .fromPrivKey', async function () {
      const privKey = new PrivKey().fromRandom()
      const keyPair = new KeyPair().fromPrivKey(privKey)
      const keyPair2 = await new KeyPair().asyncFromPrivKey(privKey)
      keyPair.pubKey.toString().should.equal(keyPair2.pubKey.toString())
    })
  })

  describe('@asyncFromPrivKey', function () {
    it('should convert a privKey same as .fromPrivKey', async function () {
      const privKey = new PrivKey().fromRandom()
      const keyPair = KeyPair.fromPrivKey(privKey)
      const keyPair2 = await KeyPair.asyncFromPrivKey(privKey)
      keyPair.pubKey.toString().should.equal(keyPair2.pubKey.toString())
    })
  })

  describe('#fromRandom', function () {
    it('should make a new priv and pub, should be compressed, mainnet', function () {
      const key = new KeyPair()
      key.fromRandom()
      should.exist(key.privKey)
      should.exist(key.pubKey)
      key.privKey.bn.gt(Bn(0)).should.equal(true)
      key.pubKey.point
        .getX()
        .gt(Bn(0))
        .should.equal(true)
      key.pubKey.point
        .getY()
        .gt(Bn(0))
        .should.equal(true)
      key.privKey.compressed.should.equal(true)
      key.pubKey.compressed.should.equal(true)
    })
  })

  describe('@fromRandom', function () {
    it('should make a new priv and pub, should be compressed, mainnet', function () {
      const key = KeyPair.fromRandom()
      should.exist(key.privKey)
      should.exist(key.pubKey)
      key.privKey.bn.gt(Bn(0)).should.equal(true)
      key.pubKey.point
        .getX()
        .gt(Bn(0))
        .should.equal(true)
      key.pubKey.point
        .getY()
        .gt(Bn(0))
        .should.equal(true)
      key.privKey.compressed.should.equal(true)
      key.pubKey.compressed.should.equal(true)
    })
  })

  describe('#asyncFromRandom', function () {
    it('should have a privKey and pubKey and compute same as pubKey methods', async function () {
      const keyPair = await new KeyPair().asyncFromRandom()
      const pubKey = new PubKey().fromPrivKey(keyPair.privKey)
      pubKey.toString().should.equal(keyPair.pubKey.toString())
    })
  })

  describe('@asyncFromRandom', function () {
    it('should have a privKey and pubKey and compute same as pubKey methods', async function () {
      const keyPair = await KeyPair.asyncFromRandom()
      const pubKey = new PubKey().fromPrivKey(keyPair.privKey)
      pubKey.toString().should.equal(keyPair.pubKey.toString())
    })
  })
})
