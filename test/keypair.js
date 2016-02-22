/* global describe,it */
'use strict'
let should = require('chai').should()
let bn = require('../lib/bn')
let Privkey = require('../lib/privkey')
let Pubkey = require('../lib/pubkey')
let Keypair = require('../lib/keypair')

describe('Keypair', function () {
  it('should satisfy this basic API', function () {
    let key = new Keypair()
    should.exist(key)
    key = Keypair()
    should.exist(key)

    Keypair.Mainnet.should.equal(Keypair.Mainnet)
    Keypair.Testnet.should.equal(Keypair.Testnet)
    Keypair.Mainnet().fromRandom().privkey.constructor.should.equal(Privkey.Mainnet)
    Keypair.Testnet().fromRandom().privkey.constructor.should.equal(Privkey.Testnet)
  })

  it('should make a key with a priv and pub', function () {
    let priv = new Privkey()
    let pub = new Pubkey()
    let key = new Keypair(priv, pub)
    should.exist(key)
    should.exist(key.privkey)
    should.exist(key.pubkey)
  })

  describe('#fromJSON', function () {
    it('should make a keypair from this json', function () {
      let privkey = Privkey().fromRandom()
      let pubkey = Pubkey().fromPrivkey(privkey)
      let keypair = Keypair().fromJSON({
        privkey: privkey.toJSON(),
        pubkey: pubkey.toJSON()
      })
      keypair.privkey.toString().should.equal(privkey.toString())
      keypair.pubkey.toString().should.equal(pubkey.toString())
    })
  })

  describe('#toJSON', function () {
    it('should make json from this keypair', function () {
      let json = Keypair().fromRandom().toJSON()
      should.exist(json.privkey)
      should.exist(json.pubkey)
      let keypair = Keypair().fromJSON(json)
      keypair.toJSON().privkey.toString().should.equal(json.privkey.toString())
      keypair.toJSON().pubkey.toString().should.equal(json.pubkey.toString())
    })
  })

  describe('#fromFastBuffer', function () {
    it('should convert from a fast buffer', function () {
      let keypair = Keypair().fromRandom()
      let privkey1 = keypair.privkey
      let pubkey1 = keypair.pubkey
      let buf = keypair.toFastBuffer()
      keypair = Keypair().fromFastBuffer(buf)
      let privkey2 = keypair.privkey
      let pubkey2 = keypair.pubkey
      privkey1.toString().should.equal(privkey2.toString())
      pubkey1.toString().should.equal(pubkey2.toString())
    })
  })

  describe('#toFastBuffer', function () {
    it('should convert to a fast buffer', function () {
      let keypair, buf

      keypair = Keypair().fromRandom()
      keypair.pubkey = undefined
      buf = keypair.toFastBuffer()
      buf.length.should.greaterThan(32)

      keypair = Keypair().fromRandom()
      keypair.privkey = undefined
      buf = keypair.toFastBuffer()
      buf.length.should.greaterThan(64)

      keypair = Keypair().fromRandom()
      buf = keypair.toFastBuffer()
      buf.length.should.greaterThan(32 + 64)
    })
  })

  describe('#fromString', function () {
    it('should convert to and from a string', function () {
      let keypair = Keypair().fromRandom()
      let str = keypair.toString()
      Keypair().fromString(str).toString().should.equal(str)
    })
  })

  describe('#fromPrivkey', function () {
    it('should make a new key from a privkey', function () {
      should.exist(Keypair().fromPrivkey(Privkey().fromRandom()).pubkey)
    })

    it('should convert this known Privkey to known Pubkey', function () {
      let privhex = '906977a061af29276e40bf377042ffbde414e496ae2260bbf1fa9d085637bfff'
      let pubhex = '02a1633cafcc01ebfb6d78e39f687a1f0995c62fc95f51ead10a02ee0be551b5dc'
      let privkey = Privkey().fromBN(bn(new Buffer(privhex, 'hex')))
      let key = Keypair().fromPrivkey(privkey)
      key.pubkey.toString().should.equal(pubhex)
    })

    it('should convert this known Privkey to known Pubkey and preserve compressed=false', function () {
      let privhex = '906977a061af29276e40bf377042ffbde414e496ae2260bbf1fa9d085637bfff'
      let privkey = Privkey().fromBN(bn(new Buffer(privhex, 'hex')))
      privkey.compressed = false
      let key = Keypair().fromPrivkey(privkey)
      key.pubkey.compressed.should.equal(false)
    })
  })

  describe('#fromRandom', function () {
    it('should make a new priv and pub, should be compressed, mainnet', function () {
      let key = Keypair()
      key.fromRandom()
      should.exist(key.privkey)
      should.exist(key.pubkey)
      key.privkey.bn.gt(bn(0)).should.equal(true)
      key.pubkey.point.getX().gt(bn(0)).should.equal(true)
      key.pubkey.point.getY().gt(bn(0)).should.equal(true)
      key.privkey.compressed.should.equal(true)
      key.pubkey.compressed.should.equal(true)
    })
  })
})
