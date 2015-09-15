'use strict'
let should = require('chai').should()
let Pubkey = require('../lib/pubkey')
let Point = require('../lib/point')
let BN = require('../lib/bn')
let Privkey = require('../lib/privkey')

describe('Pubkey', function () {
  it('should create a blank public key', function () {
    let pk = new Pubkey()
    should.exist(pk)
  })

  it('should create a public key with a point', function () {
    let p = Point()
    let pk = new Pubkey({point: p})
    should.exist(pk.point)
  })

  it('should create a public key with a point with this convenient method', function () {
    let p = Point()
    let pk = new Pubkey(p)
    should.exist(pk.point)
    pk.point.toString().should.equal(p.toString())
  })

  describe('#fromObject', function () {
    it('should make a public key from a point', function () {
      should.exist(Pubkey().fromObject({point: Point.getG()}).point)
    })

  })

  describe('#fromJSON', function () {
    it('should input this public key', function () {
      let pk = new Pubkey()
      pk.fromJSON('041ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a7baad41d04514751e6851f5304fd243751703bed21b914f6be218c0fa354a341')
      pk.point.getX().toString(16).should.equal('1ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a')
      pk.point.getY().toString(16).should.equal('7baad41d04514751e6851f5304fd243751703bed21b914f6be218c0fa354a341')
    })

  })

  describe('#toJSON', function () {
    it('should output this pubkey', function () {
      let pk = new Pubkey()
      let hex = '041ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a7baad41d04514751e6851f5304fd243751703bed21b914f6be218c0fa354a341'
      pk.fromJSON(hex).toJSON().should.equal(hex)
    })

  })

  describe('#fromPrivkey', function () {
    it('should make a public key from a privkey', function () {
      should.exist(Pubkey().fromPrivkey(Privkey().fromRandom()))
    })

  })

  describe('#fromHex', function () {
    it('should parse this uncompressed public key', function () {
      let pk = new Pubkey()
      pk.fromHex('041ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a7baad41d04514751e6851f5304fd243751703bed21b914f6be218c0fa354a341')
      pk.point.getX().toString(16).should.equal('1ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a')
      pk.point.getY().toString(16).should.equal('7baad41d04514751e6851f5304fd243751703bed21b914f6be218c0fa354a341')
    })

  })

  describe('#fromBuffer', function () {
    it('should parse this uncompressed public key', function () {
      let pk = new Pubkey()
      pk.fromBuffer(new Buffer('041ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a7baad41d04514751e6851f5304fd243751703bed21b914f6be218c0fa354a341', 'hex'))
      pk.point.getX().toString(16).should.equal('1ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a')
      pk.point.getY().toString(16).should.equal('7baad41d04514751e6851f5304fd243751703bed21b914f6be218c0fa354a341')
    })

    it('should parse this compressed public key', function () {
      let pk = new Pubkey()
      pk.fromBuffer(new Buffer('031ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a', 'hex'))
      pk.point.getX().toString(16).should.equal('1ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a')
      pk.point.getY().toString(16).should.equal('7baad41d04514751e6851f5304fd243751703bed21b914f6be218c0fa354a341')
    })

    it('should throw an error on this invalid public key', function () {
      let pk = new Pubkey();(function () {
        pk.fromBuffer(new Buffer('091ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a', 'hex'))
      }).should.throw()
    })

  })

  describe('#fromDER', function () {
    it('should parse this uncompressed public key', function () {
      let pk = new Pubkey()
      pk.fromDER(new Buffer('041ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a7baad41d04514751e6851f5304fd243751703bed21b914f6be218c0fa354a341', 'hex'))
      pk.point.getX().toString(16).should.equal('1ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a')
      pk.point.getY().toString(16).should.equal('7baad41d04514751e6851f5304fd243751703bed21b914f6be218c0fa354a341')
    })

    it('should parse this compressed public key', function () {
      let pk = new Pubkey()
      pk.fromDER(new Buffer('031ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a', 'hex'))
      pk.point.getX().toString(16).should.equal('1ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a')
      pk.point.getY().toString(16).should.equal('7baad41d04514751e6851f5304fd243751703bed21b914f6be218c0fa354a341')
    })

    it('should throw an error on this invalid public key', function () {
      let pk = new Pubkey();(function () {
        pk.fromDER(new Buffer('091ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a', 'hex'))
      }).should.throw()
    })

  })

  describe('#fromString', function () {
    it('should parse this known valid public key', function () {
      let pk = new Pubkey()
      pk.fromString('041ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a7baad41d04514751e6851f5304fd243751703bed21b914f6be218c0fa354a341')
      pk.point.getX().toString(16).should.equal('1ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a')
      pk.point.getY().toString(16).should.equal('7baad41d04514751e6851f5304fd243751703bed21b914f6be218c0fa354a341')
    })

  })

  describe('#fromX', function () {
    it('should create this known public key', function () {
      let x = BN.fromBuffer(new Buffer('1ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a', 'hex'))
      let pk = new Pubkey()
      pk.fromX(true, x)
      pk.point.getX().toString(16).should.equal('1ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a')
      pk.point.getY().toString(16).should.equal('7baad41d04514751e6851f5304fd243751703bed21b914f6be218c0fa354a341')
    })

  })

  describe('#toHex', function () {
    it('should return this compressed DER format', function () {
      let x = BN().fromHex('1ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a')
      let pk = new Pubkey()
      pk.fromX(true, x)
      pk.toHex().should.equal('031ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a')
    })

  })

  describe('#toBuffer', function () {
    it('should return this compressed DER format', function () {
      let x = BN.fromBuffer(new Buffer('1ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a', 'hex'))
      let pk = new Pubkey()
      pk.fromX(true, x)
      pk.toBuffer().toString('hex').should.equal('031ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a')
    })

  })

  describe('#toDER', function () {
    it('should return this compressed DER format', function () {
      let x = BN.fromBuffer(new Buffer('1ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a', 'hex'))
      let pk = new Pubkey()
      pk.fromX(true, x)
      pk.toDER(true).toString('hex').should.equal('031ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a')
    })

    it('should return this uncompressed DER format', function () {
      let x = BN.fromBuffer(new Buffer('1ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a', 'hex'))
      let pk = new Pubkey()
      pk.fromX(true, x)
      pk.toDER(false).toString('hex').should.equal('041ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a7baad41d04514751e6851f5304fd243751703bed21b914f6be218c0fa354a341')
    })

  })

  describe('#toString', function () {
    it('should print this known public key', function () {
      let hex = '031ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a'
      let pk = new Pubkey()
      pk.fromString(hex)
      pk.toString().should.equal(hex)
    })

  })

  describe('#validate', function () {
    it('should not throw an error if pubkey is valid', function () {
      let hex = '031ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a'
      let pk = new Pubkey()
      pk.fromString(hex)
      should.exist(pk.validate())
    })

    it('should not throw an error if pubkey is invalid', function () {
      let hex = '041ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a0000000000000000000000000000000000000000000000000000000000000000'
      let pk = new Pubkey()
      pk.fromString(hex);(function () {
        pk.validate()
      }).should.throw('Invalid y value of public key')
    })

    it('should not throw an error if pubkey is infinity', function () {
      let pk = new Pubkey()
      pk.point = Point.getG().mul(Point.getN());(function () {
        pk.validate()
      }).should.throw('Point cannot be equal to Infinity')
    })

  })

})
