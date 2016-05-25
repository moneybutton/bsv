/* global describe,it */
'use strict'
let PrivKey = require('../lib/priv-key')
let Bn = require('../lib/bn')
let Point = require('../lib/point')
let should = require('chai').should()

describe('PrivKey', function () {
  let hex = '96c132224121b509b7d0a16245e957d9192609c5637c6228311287b1be21627a'
  let buf = new Buffer(hex, 'hex')
  let enctestnet = 'cSdkPxkAjA4HDr5VHgsebAPDEh9Gyub4HK8UJr2DFGGqKKy4K5sG'
  let enctu = '92jJzK4tbURm1C7udQXxeCBvXHoHJstDXRxAMouPG1k1XUaXdsu'
  let encmainnet = 'L2Gkw3kKJ6N24QcDuH4XDqt9cTqsKTVNDGz1CRZhk9cq4auDUbJy'
  let encmu = '5JxgQaFM1FMd38cd14e3mbdxsdSa9iM2BV6DHBYsvGzxkTNQ7Un'

  it('should satisfy these basic API features', function () {
    let privKey = new PrivKey()
    should.exist(privKey)
    privKey = new PrivKey()
    should.exist(privKey)

    new PrivKey().constructor.should.equal(new PrivKey().constructor)
    new PrivKey.Testnet().constructor.should.equal(new PrivKey.Testnet().constructor)

    let deps = {}
    PrivKey.inject(deps).should.equal(PrivKey.inject(deps))
    PrivKey.inject(deps).should.not.equal(PrivKey.inject({}))
  })

  it('should create a 0 private key with this convenience method', function () {
    let bn = new Bn(0)
    let privKey = new PrivKey(bn)
    privKey.bn.toString().should.equal(bn.toString())
  })

  it('should create a mainnet private key', function () {
    let privKey = new PrivKey(Bn.fromBuffer(buf), true)
    privKey.toString().should.equal(encmainnet)
  })

  it('should create an uncompressed testnet private key', function () {
    let privKey = new PrivKey.Testnet(Bn.fromBuffer(buf), false)
    privKey.toString().should.equal(enctu)
  })

  it('should create an uncompressed mainnet private key', function () {
    let privKey = new PrivKey(Bn.fromBuffer(buf), false)
    privKey.toString().should.equal(encmu)
  })

  describe('#fromObject', function () {
    it('should set bn', function () {
      should.exist(new PrivKey().fromObject({bn: Bn.fromBuffer(buf)}).bn)
    })
  })

  describe('#fromJSON', function () {
    it('should input this address correctly', function () {
      let privKey = new PrivKey()
      privKey.fromString(encmu)
      let privKey2 = new PrivKey()
      privKey2.fromJSON(privKey.toHex())
      privKey2.toWif().should.equal(encmu)
    })
  })

  describe('#toString', function () {
    it('should output this address correctly', function () {
      let privKey = new PrivKey()
      privKey.fromString(encmu)
      privKey.toString().should.equal(encmu)
    })
  })

  describe('#fromRandom', function () {
    it('should set bn gt 0 and lt n, and should be compressed', function () {
      let privKey = new PrivKey().fromRandom()
      privKey.bn.gt(new Bn(0)).should.equal(true)
      privKey.bn.lt(Point.getN()).should.equal(true)
      privKey.compressed.should.equal(true)
    })
  })

  describe('@fromRandom', function () {
    it('should set bn gt 0 and lt n, and should be compressed', function () {
      let privKey = PrivKey.fromRandom()
      privKey.bn.gt(new Bn(0)).should.equal(true)
      privKey.bn.lt(Point.getN()).should.equal(true)
      privKey.compressed.should.equal(true)
    })
  })

  describe('#toHex', function () {
    it('should return a hex string', function () {
      let privKey = new PrivKey().fromBn(new Bn(5))
      privKey.toHex().should.equal('80000000000000000000000000000000000000000000000000000000000000000501')
    })
  })

  describe('#toBuffer', function () {
    it('should return a buffer', function () {
      let privKey = new PrivKey().fromBn(new Bn(5))
      privKey.toBuffer().toString('hex').should.equal('80000000000000000000000000000000000000000000000000000000000000000501')
    })
  })

  describe('#fromHex', function () {
    it('should return a hex string', function () {
      let privKey = new PrivKey().fromHex('80000000000000000000000000000000000000000000000000000000000000000501')
      privKey.toHex().should.equal('80000000000000000000000000000000000000000000000000000000000000000501')
    })
  })

  describe('#fromBuffer', function () {
    it('should return a buffer', function () {
      let privKey = new PrivKey().fromBuffer(new Buffer('80000000000000000000000000000000000000000000000000000000000000000501', 'hex'))
      privKey.toBuffer().toString('hex').should.equal('80000000000000000000000000000000000000000000000000000000000000000501')
    })

    it('should throw an error if buffer is wrong length', function () {
      ;(function () {
        new PrivKey().fromBuffer(new Buffer('8000000000000000000000000000000000000000000000000000000000000000050100', 'hex'))
      }).should.throw('LEngth of privKey buffer must be 33 (uncompressed pubKey) or 34 (compressed pubKey)')
      ;(function () {
        new PrivKey().fromBuffer(new Buffer('8000000000000000000000000000000000000000000000000000000000000005', 'hex'))
      }).should.throw('LEngth of privKey buffer must be 33 (uncompressed pubKey) or 34 (compressed pubKey)')
    })

    it('should throw an error if buffer has wrong versionByteNum byte', function () {
      (function () {
        new PrivKey().fromBuffer(new Buffer('90000000000000000000000000000000000000000000000000000000000000000501', 'hex'))
      }).should.throw('Invalid versionByteNum byte')
    })
  })

  describe('#toBn', function () {
    it('should return a bn', function () {
      let privKey = new PrivKey().fromBn(new Bn(5))
      privKey.toBn().eq(new Bn(5)).should.equal(true)
    })
  })

  describe('#fromBn', function () {
    it('should create a privKey from a bignum', function () {
      let privKey = new PrivKey().fromBn(new Bn(5))
      privKey.bn.toString().should.equal('5')
    })
  })

  describe('@fromBn', function () {
    it('should create a privKey from a bignum', function () {
      let privKey = PrivKey.fromBn(new Bn(5))
      privKey.bn.toString().should.equal('5')
    })
  })

  describe('#validate', function () {
    it('should unvalidate these privKeys', function () {
      let privKey = new PrivKey()
      privKey.compressed = true
      privKey.bn = Point.getN()
      ;(function () {
        privKey.validate()
      }).should.throw('Number must be less than N')
      privKey.bn = Point.getN().sub(1)
      privKey.compressed = undefined
      ;(function () {
        privKey.validate()
      }).should.throw('Must specify whether the corresponding public key is compressed or not (true or false)')
      privKey.compressed = true
      privKey.validate().should.equal(privKey)
    })
  })

  describe('#fromWif', function () {
    it('should parse this compressed testnet address correctly', function () {
      let privKey = new PrivKey()
      privKey.fromWif(encmainnet)
      privKey.toWif().should.equal(encmainnet)
    })
  })

  describe('@fromWif', function () {
    it('should parse this compressed testnet address correctly', function () {
      let privKey = PrivKey.fromWif(encmainnet)
      privKey.toWif().should.equal(encmainnet)
    })
  })

  describe('#toWif', function () {
    it('should parse this compressed testnet address correctly', function () {
      let privKey = new PrivKey.Testnet()
      privKey.fromWif(enctestnet)
      privKey.toWif().should.equal(enctestnet)
    })
  })

  describe('#fromString', function () {
    it('should parse this uncompressed testnet address correctly', function () {
      let privKey = new PrivKey.Testnet()
      privKey.fromString(enctu)
      privKey.toWif().should.equal(enctu)
    })
  })

  describe('#toString', function () {
    it('should parse this uncompressed mainnet address correctly', function () {
      let privKey = new PrivKey()
      privKey.fromString(encmu)
      privKey.toString().should.equal(encmu)
    })
  })
})
