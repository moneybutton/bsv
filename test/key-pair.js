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
    let priv = new PrivKey()
    let pub = new PubKey()
    let key = new KeyPair(priv, pub)
    should.exist(key)
    should.exist(key.privKey)
    should.exist(key.pubKey)
  })

  describe('#fromJSON', function () {
    it('should make a keyPair from this json', function () {
      let privKey = new PrivKey().fromRandom()
      let pubKey = new PubKey().fromPrivKey(privKey)
      let keyPair = new KeyPair().fromJSON({
        privKey: privKey.toJSON(),
        pubKey: pubKey.toJSON()
      })
      keyPair.privKey.toString().should.equal(privKey.toString())
      keyPair.pubKey.toString().should.equal(pubKey.toString())
    })
  })

  describe('#toJSON', function () {
    it('should make json from this keyPair', function () {
      let json = new KeyPair().fromRandom().toJSON()
      should.exist(json.privKey)
      should.exist(json.pubKey)
      let keyPair = new KeyPair().fromJSON(json)
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
      let privKey1 = keyPair.privKey
      let pubKey1 = keyPair.pubKey
      let buf = keyPair.toFastBuffer()
      keyPair = new KeyPair().fromFastBuffer(buf)
      let privKey2 = keyPair.privKey
      let pubKey2 = keyPair.pubKey
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
      let keyPair = new KeyPair().fromRandom()
      let str = keyPair.toString()
      new KeyPair()
        .fromString(str)
        .toString()
        .should.equal(str)
    })
  })

  describe('#toPublic', function () {
    it('should set the private key to undefined', function () {
      let keyPair = new KeyPair().fromRandom()
      let publicKeyPair = keyPair.toPublic()

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
      let privhex =
        '906977a061af29276e40bf377042ffbde414e496ae2260bbf1fa9d085637bfff'
      let pubhex =
        '02a1633cafcc01ebfb6d78e39f687a1f0995c62fc95f51ead10a02ee0be551b5dc'
      let privKey = new PrivKey().fromBn(Bn(Buffer.from(privhex, 'hex')))
      let key = new KeyPair().fromPrivKey(privKey)
      key.pubKey.toString().should.equal(pubhex)
    })

    it('should convert this known PrivKey to known PubKey and preserve compressed=false', function () {
      let privhex =
        '906977a061af29276e40bf377042ffbde414e496ae2260bbf1fa9d085637bfff'
      let privKey = new PrivKey().fromBn(Bn(Buffer.from(privhex, 'hex')))
      privKey.compressed = false
      let key = new KeyPair().fromPrivKey(privKey)
      key.pubKey.compressed.should.equal(false)
    })
  })

  describe('@fromPrivKey', function () {
    it('should make a new key from a privKey', function () {
      should.exist(KeyPair.fromPrivKey(new PrivKey().fromRandom()).pubKey)
    })

    it('should convert this known PrivKey to known PubKey', function () {
      let privhex =
        '906977a061af29276e40bf377042ffbde414e496ae2260bbf1fa9d085637bfff'
      let pubhex =
        '02a1633cafcc01ebfb6d78e39f687a1f0995c62fc95f51ead10a02ee0be551b5dc'
      let privKey = new PrivKey().fromBn(Bn(Buffer.from(privhex, 'hex')))
      let key = KeyPair.fromPrivKey(privKey)
      key.pubKey.toString().should.equal(pubhex)
    })

    it('should convert this known PrivKey to known PubKey and preserve compressed=false', function () {
      let privhex =
        '906977a061af29276e40bf377042ffbde414e496ae2260bbf1fa9d085637bfff'
      let privKey = new PrivKey().fromBn(Bn(Buffer.from(privhex, 'hex')))
      privKey.compressed = false
      let key = KeyPair.fromPrivKey(privKey)
      key.pubKey.compressed.should.equal(false)
    })
  })

  describe('#asyncFromPrivKey', function () {
    it('should convert a privKey same as .fromPrivKey', async function () {
      let privKey = new PrivKey().fromRandom()
      let keyPair = new KeyPair().fromPrivKey(privKey)
      let keyPair2 = await new KeyPair().asyncFromPrivKey(privKey)
      keyPair.pubKey.toString().should.equal(keyPair2.pubKey.toString())
    })
  })

  describe('@asyncFromPrivKey', function () {
    it('should convert a privKey same as .fromPrivKey', async function () {
      let privKey = new PrivKey().fromRandom()
      let keyPair = KeyPair.fromPrivKey(privKey)
      let keyPair2 = await KeyPair.asyncFromPrivKey(privKey)
      keyPair.pubKey.toString().should.equal(keyPair2.pubKey.toString())
    })
  })

  describe('#fromRandom', function () {
    it('should make a new priv and pub, should be compressed, mainnet', function () {
      let key = new KeyPair()
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
      let key = KeyPair.fromRandom()
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
      let keyPair = await new KeyPair().asyncFromRandom()
      let pubKey = new PubKey().fromPrivKey(keyPair.privKey)
      pubKey.toString().should.equal(keyPair.pubKey.toString())
    })
  })

  describe('@asyncFromRandom', function () {
    it('should have a privKey and pubKey and compute same as pubKey methods', async function () {
      let keyPair = await KeyPair.asyncFromRandom()
      let pubKey = new PubKey().fromPrivKey(keyPair.privKey)
      pubKey.toString().should.equal(keyPair.pubKey.toString())
    })
  })
})
