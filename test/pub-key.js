/* global describe,it */
'use strict'
import { Bn } from '../lib/bn'
import { Point } from '../lib/point'
import { PrivKey } from '../lib/priv-key'
import { PubKey } from '../lib/pub-key'
import should from 'should'

describe('PubKey', function () {
  it('should create a blank public key', function () {
    const pk = new PubKey()
    should.exist(pk)
  })

  it('should create a public key with a point', function () {
    const p = new Point()
    const pk = new PubKey({ point: p })
    should.exist(pk.point)
  })

  it('should create a public key with a point with this convenient method', function () {
    const p = new Point()
    const pk = new PubKey(p)
    should.exist(pk.point)
    pk.point.toString().should.equal(p.toString())
  })

  describe('#fromObject', function () {
    it('should make a public key from a point', function () {
      should.exist(new PubKey().fromObject({ point: Point.getG() }).point)
    })
  })

  describe('#fromJSON', function () {
    it('should input this public key', function () {
      const pk = new PubKey()
      pk.fromJSON(
        '00041ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a7baad41d04514751e6851f5304fd243751703bed21b914f6be218c0fa354a341'
      )
      pk.point
        .getX()
        .toString(16)
        .should.equal(
          '1ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a'
        )
      pk.point
        .getY()
        .toString(16)
        .should.equal(
          '7baad41d04514751e6851f5304fd243751703bed21b914f6be218c0fa354a341'
        )
    })
  })

  describe('#toJSON', function () {
    it('should output this pubKey', function () {
      const pk = new PubKey()
      const hex =
        '01041ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a7baad41d04514751e6851f5304fd243751703bed21b914f6be218c0fa354a341'
      pk
        .fromJSON(hex)
        .toJSON()
        .should.equal(hex)
    })

    it('should output this uncompressed pubKey', function () {
      const pk = new PubKey()
      const hex =
        '00041ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a7baad41d04514751e6851f5304fd243751703bed21b914f6be218c0fa354a341'
      pk
        .fromJSON(hex)
        .toJSON()
        .should.equal(hex)
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
    it('should result the same as fromPrivKey', async function () {
      const privKey = new PrivKey().fromRandom()
      const pubKey1 = new PubKey().fromPrivKey(privKey)
      const pubKey2 = await new PubKey().asyncFromPrivKey(privKey)
      pubKey1.toString().should.equal(pubKey2.toString())
    })

    it('should result the same as fromPrivKey', async function () {
      const privKey = new PrivKey().fromBn(new Bn(5))
      const pubKey1 = new PubKey().fromPrivKey(privKey)
      const pubKey2 = await new PubKey().asyncFromPrivKey(privKey)
      pubKey1.toString().should.equal(pubKey2.toString())
    })
  })

  describe('@asyncFromPrivKey', function () {
    it('should result the same as fromPrivKey', async function () {
      const privKey = new PrivKey().fromRandom()
      const pubKey1 = PubKey.fromPrivKey(privKey)
      const pubKey2 = await PubKey.asyncFromPrivKey(privKey)
      pubKey1.toString().should.equal(pubKey2.toString())
    })

    it('should result the same as fromPrivKey', async function () {
      const privKey = new PrivKey().fromBn(new Bn(5))
      const pubKey1 = PubKey.fromPrivKey(privKey)
      const pubKey2 = await PubKey.asyncFromPrivKey(privKey)
      pubKey1.toString().should.equal(pubKey2.toString())
    })
  })

  describe('#fromHex', function () {
    it('should parse this uncompressed public key', function () {
      const pk = new PubKey()
      pk.fromHex(
        '041ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a7baad41d04514751e6851f5304fd243751703bed21b914f6be218c0fa354a341'
      )
      pk.point
        .getX()
        .toString(16)
        .should.equal(
          '1ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a'
        )
      pk.point
        .getY()
        .toString(16)
        .should.equal(
          '7baad41d04514751e6851f5304fd243751703bed21b914f6be218c0fa354a341'
        )
    })
  })

  describe('#fromBuffer', function () {
    it('should parse this uncompressed public key', function () {
      const pk = new PubKey()
      pk.fromBuffer(
        Buffer.from(
          '041ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a7baad41d04514751e6851f5304fd243751703bed21b914f6be218c0fa354a341',
          'hex'
        )
      )
      pk.point
        .getX()
        .toString(16)
        .should.equal(
          '1ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a'
        )
      pk.point
        .getY()
        .toString(16)
        .should.equal(
          '7baad41d04514751e6851f5304fd243751703bed21b914f6be218c0fa354a341'
        )
    })

    it('should parse this compressed public key', function () {
      const pk = new PubKey()
      pk.fromBuffer(
        Buffer.from(
          '031ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a',
          'hex'
        )
      )
      pk.point
        .getX()
        .toString(16)
        .should.equal(
          '1ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a'
        )
      pk.point
        .getY()
        .toString(16)
        .should.equal(
          '7baad41d04514751e6851f5304fd243751703bed21b914f6be218c0fa354a341'
        )
    })

    it('should throw an error on this invalid public key', function () {
      const pk = new PubKey()
      ;(function () {
        pk.fromBuffer(
          Buffer.from(
            '091ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a',
            'hex'
          )
        )
      }.should.throw())
    })
  })

  describe('#asyncFromBuffer', function () {
    it('should derive the same as fromBuffer', async function () {
      const pubKey = new PubKey().fromPrivKey(new PrivKey().fromRandom())
      const pubKey1 = new PubKey().fromBuffer(pubKey.toBuffer())
      const pubKey2 = await new PubKey().asyncFromBuffer(pubKey.toBuffer())
      pubKey1.toString().should.equal(pubKey2.toString())
    })
  })

  describe('@asyncFromBuffer', function () {
    it('should derive the same as fromBuffer', async function () {
      const pubKey = PubKey.fromPrivKey(new PrivKey().fromRandom())
      const pubKey1 = PubKey.fromBuffer(pubKey.toBuffer())
      const pubKey2 = await PubKey.asyncFromBuffer(pubKey.toBuffer())
      pubKey1.toString().should.equal(pubKey2.toString())
    })
  })

  describe('#fromFastBuffer', function () {
    it('should convert from this known fast buffer', function () {
      const pubKey = new PubKey().fromFastBuffer(
        Buffer.from(
          '01041ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a7baad41d04514751e6851f5304fd243751703bed21b914f6be218c0fa354a341',
          'hex'
        )
      )
      pubKey.point
        .getX()
        .toString(16)
        .should.equal(
          '1ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a'
        )
    })
  })

  describe('#fromDer', function () {
    it('should parse this uncompressed public key', function () {
      const pk = new PubKey()
      pk.fromDer(
        Buffer.from(
          '041ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a7baad41d04514751e6851f5304fd243751703bed21b914f6be218c0fa354a341',
          'hex'
        )
      )
      pk.point
        .getX()
        .toString(16)
        .should.equal(
          '1ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a'
        )
      pk.point
        .getY()
        .toString(16)
        .should.equal(
          '7baad41d04514751e6851f5304fd243751703bed21b914f6be218c0fa354a341'
        )
    })

    it('should parse this compressed public key', function () {
      const pk = new PubKey()
      pk.fromDer(
        Buffer.from(
          '031ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a',
          'hex'
        )
      )
      pk.point
        .getX()
        .toString(16)
        .should.equal(
          '1ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a'
        )
      pk.point
        .getY()
        .toString(16)
        .should.equal(
          '7baad41d04514751e6851f5304fd243751703bed21b914f6be218c0fa354a341'
        )
    })

    it('should throw an error on this invalid public key', function () {
      const pk = new PubKey()
      ;(function () {
        pk.fromDer(
          Buffer.from(
            '091ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a',
            'hex'
          )
        )
      }.should.throw())
    })
  })

  describe('@fromDer', function () {
    it('should parse this uncompressed public key', function () {
      const pk = PubKey.fromDer(
        Buffer.from(
          '041ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a7baad41d04514751e6851f5304fd243751703bed21b914f6be218c0fa354a341',
          'hex'
        )
      )
      pk.point
        .getX()
        .toString(16)
        .should.equal(
          '1ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a'
        )
      pk.point
        .getY()
        .toString(16)
        .should.equal(
          '7baad41d04514751e6851f5304fd243751703bed21b914f6be218c0fa354a341'
        )
    })

    it('should parse this compressed public key', function () {
      const pk = PubKey.fromDer(
        Buffer.from(
          '031ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a',
          'hex'
        )
      )
      pk.point
        .getX()
        .toString(16)
        .should.equal(
          '1ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a'
        )
      pk.point
        .getY()
        .toString(16)
        .should.equal(
          '7baad41d04514751e6851f5304fd243751703bed21b914f6be218c0fa354a341'
        )
    })

    it('should throw an error on this invalid public key', function () {
      ;(function () {
        PubKey.fromDer(
          Buffer.from(
            '091ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a',
            'hex'
          )
        )
      }.should.throw())
    })
  })

  describe('#fromString', function () {
    it('should parse this known valid public key', function () {
      const pk = new PubKey()
      pk.fromString(
        '041ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a7baad41d04514751e6851f5304fd243751703bed21b914f6be218c0fa354a341'
      )
      pk.point
        .getX()
        .toString(16)
        .should.equal(
          '1ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a'
        )
      pk.point
        .getY()
        .toString(16)
        .should.equal(
          '7baad41d04514751e6851f5304fd243751703bed21b914f6be218c0fa354a341'
        )
    })
  })

  describe('#fromX', function () {
    it('should create this known public key', function () {
      const x = Bn.fromBuffer(
        Buffer.from(
          '1ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a',
          'hex'
        )
      )
      const pk = new PubKey()
      pk.fromX(true, x)
      pk.point
        .getX()
        .toString(16)
        .should.equal(
          '1ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a'
        )
      pk.point
        .getY()
        .toString(16)
        .should.equal(
          '7baad41d04514751e6851f5304fd243751703bed21b914f6be218c0fa354a341'
        )
    })
  })

  describe('@fromX', function () {
    it('should create this known public key', function () {
      const x = Bn.fromBuffer(
        Buffer.from(
          '1ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a',
          'hex'
        )
      )
      const pk = new PubKey()
      pk.fromX(true, x)
      pk.point
        .getX()
        .toString(16)
        .should.equal(
          '1ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a'
        )
      pk.point
        .getY()
        .toString(16)
        .should.equal(
          '7baad41d04514751e6851f5304fd243751703bed21b914f6be218c0fa354a341'
        )
    })
  })

  describe('#toHex', function () {
    it('should return this compressed DER format', function () {
      const x = new Bn().fromHex(
        '1ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a'
      )
      const pk = new PubKey()
      pk.fromX(true, x)
      pk
        .toHex()
        .should.equal(
          '031ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a'
        )
    })
  })

  describe('#toBuffer', function () {
    it('should return this compressed DER format', function () {
      const x = Bn.fromBuffer(
        Buffer.from(
          '1ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a',
          'hex'
        )
      )
      const pk = new PubKey()
      pk.fromX(true, x)
      pk
        .toBuffer()
        .toString('hex')
        .should.equal(
          '031ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a'
        )
    })
  })

  describe('#toFastBuffer', function () {
    it('should return fast buffer', function () {
      const x = Bn.fromBuffer(
        Buffer.from(
          '1ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a',
          'hex'
        )
      )
      const pk = new PubKey()
      pk.fromX(true, x)
      pk
        .toFastBuffer()
        .toString('hex')
        .should.equal(
          '01041ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a7baad41d04514751e6851f5304fd243751703bed21b914f6be218c0fa354a341'
        )
      pk.toFastBuffer().length.should.greaterThan(64)
    })
  })

  describe('#toDer', function () {
    it('should return this compressed DER format', function () {
      const x = Bn.fromBuffer(
        Buffer.from(
          '1ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a',
          'hex'
        )
      )
      const pk = new PubKey()
      pk.fromX(true, x)
      pk
        .toDer(true)
        .toString('hex')
        .should.equal(
          '031ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a'
        )
    })

    it('should return this uncompressed DER format', function () {
      const x = Bn.fromBuffer(
        Buffer.from(
          '1ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a',
          'hex'
        )
      )
      const pk = new PubKey()
      pk.fromX(true, x)
      pk
        .toDer(false)
        .toString('hex')
        .should.equal(
          '041ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a7baad41d04514751e6851f5304fd243751703bed21b914f6be218c0fa354a341'
        )
    })
  })

  describe('#toString', function () {
    it('should print this known public key', function () {
      const hex =
        '031ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a'
      const pk = new PubKey()
      pk.fromString(hex)
      pk.toString().should.equal(hex)
    })
  })

  describe('#validate', function () {
    it('should not throw an error if pubKey is valid', function () {
      const hex =
        '031ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a'
      const pk = new PubKey()
      pk.fromString(hex)
      should.exist(pk.validate())
    })

    it('should not throw an error if pubKey is invalid', function () {
      const hex =
        '041ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a0000000000000000000000000000000000000000000000000000000000000000'
      const pk = new PubKey()
      pk.fromString(hex)
      ;(function () {
        pk.validate()
      }.should.throw('Invalid y value of public key'))
    })

    it('should throw an error if pubKey is infinity', function () {
      const pk = new PubKey()
      let errm = ''
      try {
        pk.point = Point.getG().mul(Point.getN())
      } catch (err) {
        errm = err.message
      }
      errm.should.equal('point mul out of range')
    })
  })
})
