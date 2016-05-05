/* global describe,it */
'use strict'
let KeyPair = require('../lib/key-pair')
let PrivKey = require('../lib/priv-key')
let PubKey = require('../lib/pub-key')
let asink = require('asink')
let bn = require('../lib/bn')
let should = require('chai').should()

describe('KeyPair', function () {
  it('should satisfy this basic API', function () {
    let key = new KeyPair()
    should.exist(key)
    key = new KeyPair()
    should.exist(key)

    KeyPair.MainNet.should.equal(KeyPair.MainNet)
    KeyPair.TestNet.should.equal(KeyPair.TestNet)
    new KeyPair.MainNet().fromRandom().privKey.constructor.should.equal(PrivKey.MainNet)
    new KeyPair.TestNet().fromRandom().privKey.constructor.should.equal(PrivKey.TestNet)
  })

  it('should make a key with a priv and pub', function () {
    let priv = new PrivKey()
    let pub = new PubKey()
    let key = new KeyPair(priv, pub)
    should.exist(key)
    should.exist(key.privKey)
    should.exist(key.pubKey)
  })

  describe('#fromJson', function () {
    it('should make a keyPair from this json', function () {
      let privKey = new PrivKey().fromRandom()
      let pubKey = new PubKey().fromPrivKey(privKey)
      let keyPair = new KeyPair().fromJson({
        privKey: privKey.toJson(),
        pubKey: pubKey.toJson()
      })
      keyPair.privKey.toString().should.equal(privKey.toString())
      keyPair.pubKey.toString().should.equal(pubKey.toString())
    })
  })

  describe('#toJson', function () {
    it('should make json from this keyPair', function () {
      let json = new KeyPair().fromRandom().toJson()
      should.exist(json.privKey)
      should.exist(json.pubKey)
      let keyPair = new KeyPair().fromJson(json)
      keyPair.toJson().privKey.toString().should.equal(json.privKey.toString())
      keyPair.toJson().pubKey.toString().should.equal(json.pubKey.toString())
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
      new KeyPair().fromString(str).toString().should.equal(str)
    })
  })

  describe('#fromPrivKey', function () {
    it('should make a new key from a privKey', function () {
      should.exist(new KeyPair().fromPrivKey(new PrivKey().fromRandom()).pubKey)
    })

    it('should convert this known PrivKey to known PubKey', function () {
      let privhex = '906977a061af29276e40bf377042ffbde414e496ae2260bbf1fa9d085637bfff'
      let pubhex = '02a1633cafcc01ebfb6d78e39f687a1f0995c62fc95f51ead10a02ee0be551b5dc'
      let privKey = new PrivKey().fromBn(bn(new Buffer(privhex, 'hex')))
      let key = new KeyPair().fromPrivKey(privKey)
      key.pubKey.toString().should.equal(pubhex)
    })

    it('should convert this known PrivKey to known PubKey and preserve compressed=false', function () {
      let privhex = '906977a061af29276e40bf377042ffbde414e496ae2260bbf1fa9d085637bfff'
      let privKey = new PrivKey().fromBn(bn(new Buffer(privhex, 'hex')))
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
      let privhex = '906977a061af29276e40bf377042ffbde414e496ae2260bbf1fa9d085637bfff'
      let pubhex = '02a1633cafcc01ebfb6d78e39f687a1f0995c62fc95f51ead10a02ee0be551b5dc'
      let privKey = new PrivKey().fromBn(bn(new Buffer(privhex, 'hex')))
      let key = KeyPair.fromPrivKey(privKey)
      key.pubKey.toString().should.equal(pubhex)
    })

    it('should convert this known PrivKey to known PubKey and preserve compressed=false', function () {
      let privhex = '906977a061af29276e40bf377042ffbde414e496ae2260bbf1fa9d085637bfff'
      let privKey = new PrivKey().fromBn(bn(new Buffer(privhex, 'hex')))
      privKey.compressed = false
      let key = KeyPair.fromPrivKey(privKey)
      key.pubKey.compressed.should.equal(false)
    })
  })

  describe('#asyncFromPrivKey', function () {
    it('should convert a privKey same as .fromPrivKey', function () {
      return asink(function * () {
        let privKey = new PrivKey().fromRandom()
        let keyPair = new KeyPair().fromPrivKey(privKey)
        let keyPair2 = yield new KeyPair().asyncFromPrivKey(privKey)
        keyPair.pubKey.toString().should.equal(keyPair2.pubKey.toString())
      })
    })
  })

  describe('@asyncFromPrivKey', function () {
    it('should convert a privKey same as .fromPrivKey', function () {
      return asink(function * () {
        let privKey = new PrivKey().fromRandom()
        let keyPair = KeyPair.fromPrivKey(privKey)
        let keyPair2 = yield KeyPair.asyncFromPrivKey(privKey)
        keyPair.pubKey.toString().should.equal(keyPair2.pubKey.toString())
      })
    })
  })

  describe('#fromRandom', function () {
    it('should make a new priv and pub, should be compressed, mainnet', function () {
      let key = new KeyPair()
      key.fromRandom()
      should.exist(key.privKey)
      should.exist(key.pubKey)
      key.privKey.bn.gt(bn(0)).should.equal(true)
      key.pubKey.point.getX().gt(bn(0)).should.equal(true)
      key.pubKey.point.getY().gt(bn(0)).should.equal(true)
      key.privKey.compressed.should.equal(true)
      key.pubKey.compressed.should.equal(true)
    })
  })

  describe('@fromRandom', function () {
    it('should make a new priv and pub, should be compressed, mainnet', function () {
      let key = KeyPair.fromRandom()
      should.exist(key.privKey)
      should.exist(key.pubKey)
      key.privKey.bn.gt(bn(0)).should.equal(true)
      key.pubKey.point.getX().gt(bn(0)).should.equal(true)
      key.pubKey.point.getY().gt(bn(0)).should.equal(true)
      key.privKey.compressed.should.equal(true)
      key.pubKey.compressed.should.equal(true)
    })
  })

  describe('#asyncFromRandom', function () {
    it('should have a privKey and pubKey and compute same as pubKey methods', function () {
      return asink(function * () {
        let keyPair = yield new KeyPair().asyncFromRandom()
        let pubKey = new PubKey().fromPrivKey(keyPair.privKey)
        pubKey.toString().should.equal(keyPair.pubKey.toString())
      })
    })
  })

  describe('@asyncFromRandom', function () {
    it('should have a privKey and pubKey and compute same as pubKey methods', function () {
      return asink(function * () {
        let keyPair = yield KeyPair.asyncFromRandom()
        let pubKey = new PubKey().fromPrivKey(keyPair.privKey)
        pubKey.toString().should.equal(keyPair.pubKey.toString())
      })
    })
  })
})
