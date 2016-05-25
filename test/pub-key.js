/* global describe,it */
'use strict'
let Bn = require('../lib/bn')
let Point = require('../lib/point')
let PrivKey = require('../lib/priv-key')
let PubKey = require('../lib/pub-key')
let asink = require('asink')
let should = require('chai').should()

describe('PubKey', function () {
  it('should create a blank public key', function () {
    let pk = new PubKey()
    should.exist(pk)
  })

  it('should create a public key with a point', function () {
    let p = new Point()
    let pk = new PubKey({point: p})
    should.exist(pk.point)
  })

  it('should create a public key with a point with this convenient method', function () {
    let p = new Point()
    let pk = new PubKey(p)
    should.exist(pk.point)
    pk.point.toString().should.equal(p.toString())
  })

  describe('#fromObject', function () {
    it('should make a public key from a point', function () {
      should.exist(new PubKey().fromObject({point: Point.getG()}).point)
    })
  })

  describe('#fromJSON', function () {
    it('should input this public key', function () {
      let pk = new PubKey()
      pk.fromJSON('00041ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a7baad41d04514751e6851f5304fd243751703bed21b914f6be218c0fa354a341')
      pk.point.getX().toString(16).should.equal('1ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a')
      pk.point.getY().toString(16).should.equal('7baad41d04514751e6851f5304fd243751703bed21b914f6be218c0fa354a341')
    })
  })

  describe('#toJSON', function () {
    it('should output this pubKey', function () {
      let pk = new PubKey()
      let hex = '01041ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a7baad41d04514751e6851f5304fd243751703bed21b914f6be218c0fa354a341'
      pk.fromJSON(hex).toJSON().should.equal(hex)
    })

    it('should output this uncompressed pubKey', function () {
      let pk = new PubKey()
      let hex = '00041ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a7baad41d04514751e6851f5304fd243751703bed21b914f6be218c0fa354a341'
      pk.fromJSON(hex).toJSON().should.equal(hex)
    })
  })

  describe('#fromPrivKey', function () {
    it('should make a public key from a privKey', function () {
      should.exist(new PubKey().fromPrivKey(new PrivKey().fromRandom()))
    })
  })

  describe('@fromPrivKey', function () {
    it('should make a public key from a privKey', function () {
      should.exist(PubKey.fromPrivKey(new PrivKey().fromRandom()))
    })
  })

  describe('#asyncFromPrivKey', function () {
    it('should result the same as fromPrivKey', function () {
      return asink(function * () {
        let privKey = new PrivKey().fromRandom()
        let pubKey1 = new PubKey().fromPrivKey(privKey)
        let pubKey2 = yield new PubKey().asyncFromPrivKey(privKey)
        pubKey1.toString().should.equal(pubKey2.toString())
      }, this)
    })

    it('should result the same as fromPrivKey', function () {
      return asink(function * () {
        let privKey = new PrivKey().fromBn(new Bn(5))
        let pubKey1 = new PubKey().fromPrivKey(privKey)
        let pubKey2 = yield new PubKey().asyncFromPrivKey(privKey)
        pubKey1.toString().should.equal(pubKey2.toString())
      }, this)
    })
  })

  describe('@asyncFromPrivKey', function () {
    it('should result the same as fromPrivKey', function () {
      return asink(function * () {
        let privKey = new PrivKey().fromRandom()
        let pubKey1 = PubKey.fromPrivKey(privKey)
        let pubKey2 = yield PubKey.asyncFromPrivKey(privKey)
        pubKey1.toString().should.equal(pubKey2.toString())
      }, this)
    })

    it('should result the same as fromPrivKey', function () {
      return asink(function * () {
        let privKey = new PrivKey().fromBn(new Bn(5))
        let pubKey1 = PubKey.fromPrivKey(privKey)
        let pubKey2 = yield PubKey.asyncFromPrivKey(privKey)
        pubKey1.toString().should.equal(pubKey2.toString())
      }, this)
    })
  })

  describe('#fromHex', function () {
    it('should parse this uncompressed public key', function () {
      let pk = new PubKey()
      pk.fromHex('041ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a7baad41d04514751e6851f5304fd243751703bed21b914f6be218c0fa354a341')
      pk.point.getX().toString(16).should.equal('1ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a')
      pk.point.getY().toString(16).should.equal('7baad41d04514751e6851f5304fd243751703bed21b914f6be218c0fa354a341')
    })
  })

  describe('#fromBuffer', function () {
    it('should parse this uncompressed public key', function () {
      let pk = new PubKey()
      pk.fromBuffer(new Buffer('041ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a7baad41d04514751e6851f5304fd243751703bed21b914f6be218c0fa354a341', 'hex'))
      pk.point.getX().toString(16).should.equal('1ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a')
      pk.point.getY().toString(16).should.equal('7baad41d04514751e6851f5304fd243751703bed21b914f6be218c0fa354a341')
    })

    it('should parse this compressed public key', function () {
      let pk = new PubKey()
      pk.fromBuffer(new Buffer('031ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a', 'hex'))
      pk.point.getX().toString(16).should.equal('1ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a')
      pk.point.getY().toString(16).should.equal('7baad41d04514751e6851f5304fd243751703bed21b914f6be218c0fa354a341')
    })

    it('should throw an error on this invalid public key', function () {
      let pk = new PubKey()
      ;(function () {
        pk.fromBuffer(new Buffer('091ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a', 'hex'))
      }).should.throw()
    })
  })

  describe('#asyncFromBuffer', function () {
    it('should derive the same as fromBuffer', function () {
      return asink(function * () {
        let pubKey = new PubKey().fromPrivKey(new PrivKey().fromRandom())
        let pubKey1 = new PubKey().fromBuffer(pubKey.toBuffer())
        let pubKey2 = yield new PubKey().asyncFromBuffer(pubKey.toBuffer())
        pubKey1.toString().should.equal(pubKey2.toString())
      }, this)
    })
  })

  describe('@asyncFromBuffer', function () {
    it('should derive the same as fromBuffer', function () {
      return asink(function * () {
        let pubKey = PubKey.fromPrivKey(new PrivKey().fromRandom())
        let pubKey1 = PubKey.fromBuffer(pubKey.toBuffer())
        let pubKey2 = yield PubKey.asyncFromBuffer(pubKey.toBuffer())
        pubKey1.toString().should.equal(pubKey2.toString())
      }, this)
    })
  })

  describe('#fromFastBuffer', function () {
    it('should convert from this known fast buffer', function () {
      let pubKey = new PubKey().fromFastBuffer(new Buffer('01041ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a7baad41d04514751e6851f5304fd243751703bed21b914f6be218c0fa354a341', 'hex'))
      pubKey.point.getX().toString(16).should.equal('1ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a')
    })
  })

  describe('#fromDer', function () {
    it('should parse this uncompressed public key', function () {
      let pk = new PubKey()
      pk.fromDer(new Buffer('041ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a7baad41d04514751e6851f5304fd243751703bed21b914f6be218c0fa354a341', 'hex'))
      pk.point.getX().toString(16).should.equal('1ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a')
      pk.point.getY().toString(16).should.equal('7baad41d04514751e6851f5304fd243751703bed21b914f6be218c0fa354a341')
    })

    it('should parse this compressed public key', function () {
      let pk = new PubKey()
      pk.fromDer(new Buffer('031ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a', 'hex'))
      pk.point.getX().toString(16).should.equal('1ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a')
      pk.point.getY().toString(16).should.equal('7baad41d04514751e6851f5304fd243751703bed21b914f6be218c0fa354a341')
    })

    it('should throw an error on this invalid public key', function () {
      let pk = new PubKey()
      ;(function () {
        pk.fromDer(new Buffer('091ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a', 'hex'))
      }).should.throw()
    })
  })

  describe('@fromDer', function () {
    it('should parse this uncompressed public key', function () {
      let pk = PubKey.fromDer(new Buffer('041ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a7baad41d04514751e6851f5304fd243751703bed21b914f6be218c0fa354a341', 'hex'))
      pk.point.getX().toString(16).should.equal('1ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a')
      pk.point.getY().toString(16).should.equal('7baad41d04514751e6851f5304fd243751703bed21b914f6be218c0fa354a341')
    })

    it('should parse this compressed public key', function () {
      let pk = PubKey.fromDer(new Buffer('031ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a', 'hex'))
      pk.point.getX().toString(16).should.equal('1ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a')
      pk.point.getY().toString(16).should.equal('7baad41d04514751e6851f5304fd243751703bed21b914f6be218c0fa354a341')
    })

    it('should throw an error on this invalid public key', function () {
      ;(function () {
        PubKey.fromDer(new Buffer('091ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a', 'hex'))
      }).should.throw()
    })
  })

  describe('#fromString', function () {
    it('should parse this known valid public key', function () {
      let pk = new PubKey()
      pk.fromString('041ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a7baad41d04514751e6851f5304fd243751703bed21b914f6be218c0fa354a341')
      pk.point.getX().toString(16).should.equal('1ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a')
      pk.point.getY().toString(16).should.equal('7baad41d04514751e6851f5304fd243751703bed21b914f6be218c0fa354a341')
    })
  })

  describe('#fromX', function () {
    it('should create this known public key', function () {
      let x = Bn.fromBuffer(new Buffer('1ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a', 'hex'))
      let pk = new PubKey()
      pk.fromX(true, x)
      pk.point.getX().toString(16).should.equal('1ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a')
      pk.point.getY().toString(16).should.equal('7baad41d04514751e6851f5304fd243751703bed21b914f6be218c0fa354a341')
    })
  })

  describe('@fromX', function () {
    it('should create this known public key', function () {
      let x = Bn.fromBuffer(new Buffer('1ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a', 'hex'))
      let pk = new PubKey()
      pk.fromX(true, x)
      pk.point.getX().toString(16).should.equal('1ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a')
      pk.point.getY().toString(16).should.equal('7baad41d04514751e6851f5304fd243751703bed21b914f6be218c0fa354a341')
    })
  })

  describe('#toHex', function () {
    it('should return this compressed DER format', function () {
      let x = new Bn().fromHex('1ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a')
      let pk = new PubKey()
      pk.fromX(true, x)
      pk.toHex().should.equal('031ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a')
    })
  })

  describe('#toBuffer', function () {
    it('should return this compressed DER format', function () {
      let x = Bn.fromBuffer(new Buffer('1ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a', 'hex'))
      let pk = new PubKey()
      pk.fromX(true, x)
      pk.toBuffer().toString('hex').should.equal('031ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a')
    })
  })

  describe('#toFastBuffer', function () {
    it('should return fast buffer', function () {
      let x = Bn.fromBuffer(new Buffer('1ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a', 'hex'))
      let pk = new PubKey()
      pk.fromX(true, x)
      pk.toFastBuffer().toString('hex').should.equal('01041ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a7baad41d04514751e6851f5304fd243751703bed21b914f6be218c0fa354a341')
      pk.toFastBuffer().length.should.greaterThan(64)
    })
  })

  describe('#toDer', function () {
    it('should return this compressed DER format', function () {
      let x = Bn.fromBuffer(new Buffer('1ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a', 'hex'))
      let pk = new PubKey()
      pk.fromX(true, x)
      pk.toDer(true).toString('hex').should.equal('031ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a')
    })

    it('should return this uncompressed DER format', function () {
      let x = Bn.fromBuffer(new Buffer('1ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a', 'hex'))
      let pk = new PubKey()
      pk.fromX(true, x)
      pk.toDer(false).toString('hex').should.equal('041ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a7baad41d04514751e6851f5304fd243751703bed21b914f6be218c0fa354a341')
    })
  })

  describe('#toString', function () {
    it('should print this known public key', function () {
      let hex = '031ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a'
      let pk = new PubKey()
      pk.fromString(hex)
      pk.toString().should.equal(hex)
    })
  })

  describe('#validate', function () {
    it('should not throw an error if pubKey is valid', function () {
      let hex = '031ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a'
      let pk = new PubKey()
      pk.fromString(hex)
      should.exist(pk.validate())
    })

    it('should not throw an error if pubKey is invalid', function () {
      let hex = '041ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a0000000000000000000000000000000000000000000000000000000000000000'
      let pk = new PubKey()
      pk.fromString(hex)
      ;(function () {
        pk.validate()
      }).should.throw('Invalid y value of public key')
    })

    it('should not throw an error if pubKey is infinity', function () {
      let pk = new PubKey()
      pk.point = Point.getG().mul(Point.getN())
      ;(function () {
        pk.validate()
      }).should.throw('Point cannot be equal to Infinity')
    })
  })
})
