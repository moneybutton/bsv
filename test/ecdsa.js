/* global describe,it */
'use strict'
let Bn = require('../lib/bn')
let Ecdsa = require('../lib/ecdsa')
let Hash = require('../lib/hash')
let KeyPair = require('../lib/key-pair')
let PrivKey = require('../lib/priv-key')
let PubKey = require('../lib/pub-key')
let Sig = require('../lib/sig')
let asink = require('asink')
let Point = require('../lib/point')
let should = require('chai').should()
let vectors = require('./vectors/ecdsa')

describe('Ecdsa', function () {
  it('should create a blank ecdsa', function () {
    let ecdsa = new Ecdsa()
    should.exist(ecdsa)
  })

  let ecdsa = new Ecdsa()
  ecdsa.hashBuf = Hash.sha256(new Buffer('test data'))
  ecdsa.keyPair = new KeyPair()
  ecdsa.keyPair.privKey = new PrivKey().fromBn(new Bn().fromBuffer(new Buffer('fee0a1f7afebf9d2a5a80c0c98a31c709681cce195cbcd06342b517970c0be1e', 'hex')))
  ecdsa.keyPair.pubKey = new PubKey().fromObject({
    point: new Point(new Bn().fromBuffer(new Buffer('ac242d242d23be966085a2b2b893d989f824e06c9ad0395a8a52f055ba39abb2', 'hex')),
      new Bn().fromBuffer(new Buffer('4836ab292c105a711ed10fcfd30999c31ff7c02456147747e03e739ad527c380', 'hex')))
  })

  describe('#fromObject', function () {
    it('should set hashBuf', function () {
      should.exist(new Ecdsa().fromObject({hashBuf: ecdsa.hashBuf}).hashBuf)
    })
  })

  describe('#toJson', function () {
    it('should return json', function () {
      let json = ecdsa.toJson()
      should.exist(json.keyPair)
      should.exist(json.hashBuf)
    })
  })

  describe('#fromJson', function () {
    it('should convert from json', function () {
      let json = ecdsa.toJson()
      let ecdsa2 = new Ecdsa().fromJson(json)
      should.exist(ecdsa2.keyPair)
      should.exist(ecdsa2.hashBuf)
    })
  })

  describe('#toBuffer', function () {
    it('should return buffer', function () {
      let buf = ecdsa.toBuffer()
      Buffer.isBuffer(buf).should.equal(true)
    })
  })

  describe('#fromBuffer', function () {
    it('should return from buffer', function () {
      let buf = ecdsa.toBuffer()
      let ecdsa2 = new Ecdsa().fromBuffer(buf)
      should.exist(ecdsa2.keyPair)
      should.exist(ecdsa2.hashBuf)
    })
  })

  describe('#calcrecovery', function () {
    it('should calculate pubKey recovery number', function () {
      ecdsa.randomK()
      ecdsa.sign()
      ecdsa.calcrecovery()
      should.exist(ecdsa.sig.recovery)
    })

    it('should calculate this known pubKey recovery number', function () {
      let hashBuf = Hash.sha256(new Buffer('some data'))
      let r = new Bn('71706645040721865894779025947914615666559616020894583599959600180037551395766', 10)
      let s = new Bn('109412465507152403114191008482955798903072313614214706891149785278625167723646', 10)
      let ecdsa = new Ecdsa()
      ecdsa.keyPair = new KeyPair().fromPrivKey(new PrivKey().fromBn(new Bn().fromBuffer(Hash.sha256(new Buffer('test')))))
      ecdsa.hashBuf = hashBuf
      ecdsa.sig = Sig.fromObject({r: r, s: s})

      ecdsa.calcrecovery()
      ecdsa.sig.recovery.should.equal(1)
    })

    it('should do a round trip with signature parsing', function () {
      ecdsa.calcrecovery()
      let pubKey = ecdsa.keyPair.pubKey
      let sig = ecdsa.sig
      let hashBuf = ecdsa.hashBuf
      Ecdsa.sig2PubKey(sig, hashBuf).toHex().should.equal(pubKey.toHex())

      sig = sig.fromCompact(sig.toCompact())
      Ecdsa.sig2PubKey(sig, hashBuf).toHex().should.equal(pubKey.toHex())
    })
  })

  describe('#asyncCalcrecovery', function () {
    it('should calculate pubKey recovery number', function () {
      return asink(function * () {
        ecdsa.randomK()
        ecdsa.sign()
        yield ecdsa.asyncCalcrecovery()
        should.exist(ecdsa.sig.recovery)
      }, this)
    })

    it('should calculate this known pubKey recovery number', function () {
      return asink(function * () {
        let hashBuf = Hash.sha256(new Buffer('some data'))
        let r = new Bn('71706645040721865894779025947914615666559616020894583599959600180037551395766', 10)
        let s = new Bn('109412465507152403114191008482955798903072313614214706891149785278625167723646', 10)
        let ecdsa = new Ecdsa()
        ecdsa.keyPair = new KeyPair().fromPrivKey(new PrivKey().fromBn(new Bn().fromBuffer(Hash.sha256(new Buffer('test')))))
        ecdsa.hashBuf = hashBuf
        ecdsa.sig = Sig.fromObject({r: r, s: s})

        yield ecdsa.asyncCalcrecovery()
        ecdsa.sig.recovery.should.equal(1)
      }, this)
    })

    it('should do a round trip with signature parsing', function () {
      return asink(function * () {
        yield ecdsa.asyncCalcrecovery()
        let pubKey = ecdsa.keyPair.pubKey
        let sig = ecdsa.sig
        let hashBuf = ecdsa.hashBuf
        Ecdsa.sig2PubKey(sig, hashBuf).toHex().should.equal(pubKey.toHex())

        sig = sig.fromCompact(sig.toCompact())
        Ecdsa.sig2PubKey(sig, hashBuf).toHex().should.equal(pubKey.toHex())
      }, this)
    })
  })

  describe('@calcrecovery', function () {
    it('should calculate pubKey recovery number same as #calcrecovery', function () {
      ecdsa.randomK()
      ecdsa.sign()
      let sig1 = ecdsa.calcrecovery().sig
      let sig2 = Ecdsa.calcrecovery(ecdsa.sig, ecdsa.keyPair.pubKey, ecdsa.hashBuf)
      Buffer.compare(sig1.toCompact(), sig2.toCompact()).should.equal(0)
    })

    it('should calulate this known pubKey recovery number same as #calcrecovery', function () {
      let hashBuf = Hash.sha256(new Buffer('some data'))
      let r = new Bn('71706645040721865894779025947914615666559616020894583599959600180037551395766', 10)
      let s = new Bn('109412465507152403114191008482955798903072313614214706891149785278625167723646', 10)
      let ecdsa = new Ecdsa()
      ecdsa.keyPair = new KeyPair().fromPrivKey(new PrivKey().fromBn(new Bn().fromBuffer(Hash.sha256(new Buffer('test')))))
      ecdsa.hashBuf = hashBuf
      ecdsa.sig = Sig.fromObject({r: r, s: s})

      let sig1 = ecdsa.calcrecovery().sig
      let sig2 = Ecdsa.calcrecovery(ecdsa.sig, ecdsa.keyPair.pubKey, ecdsa.hashBuf)
      Buffer.compare(sig1.toCompact(), sig2.toCompact()).should.equal(0)
    })
  })

  describe('@asyncCalcrecovery', function () {
    it('should calculate pubKey recovery number same as #calcrecovery', function () {
      return asink(function * () {
        ecdsa.randomK()
        ecdsa.sign()
        let sig1 = ecdsa.calcrecovery().sig
        let sig2 = yield Ecdsa.asyncCalcrecovery(ecdsa.sig, ecdsa.keyPair.pubKey, ecdsa.hashBuf)
        Buffer.compare(sig1.toCompact(), sig2.toCompact()).should.equal(0)
      }, this)
    })

    it('should calulate this known pubKey recovery number same as #calcrecovery', function () {
      return asink(function * () {
        let hashBuf = Hash.sha256(new Buffer('some data'))
        let r = new Bn('71706645040721865894779025947914615666559616020894583599959600180037551395766', 10)
        let s = new Bn('109412465507152403114191008482955798903072313614214706891149785278625167723646', 10)
        let ecdsa = new Ecdsa()
        ecdsa.keyPair = new KeyPair().fromPrivKey(new PrivKey().fromBn(new Bn().fromBuffer(Hash.sha256(new Buffer('test')))))
        ecdsa.hashBuf = hashBuf
        ecdsa.sig = Sig.fromObject({r: r, s: s})

        let sig1 = ecdsa.calcrecovery().sig
        let sig2 = yield Ecdsa.asyncCalcrecovery(ecdsa.sig, ecdsa.keyPair.pubKey, ecdsa.hashBuf)
        Buffer.compare(sig1.toCompact(), sig2.toCompact()).should.equal(0)
      }, this)
    })
  })

  describe('#fromString', function () {
    it('should to a round trip with to string', function () {
      let str = ecdsa.toString()
      let ecdsa2 = new Ecdsa()
      ecdsa2.fromString(str)
      should.exist(ecdsa.hashBuf)
      should.exist(ecdsa.keyPair)
    })
  })

  describe('#randomK', function () {
    it('should generate a new random k when called twice in a row', function () {
      ecdsa.randomK()
      let k1 = ecdsa.k
      ecdsa.randomK()
      let k2 = ecdsa.k
      ;(k1.cmp(k2) === 0).should.equal(false)
    })

    it('should generate a random k that is (almost always) greater than this relatively small number', function () {
      ecdsa.randomK()
      let k1 = ecdsa.k
      let k2 = new Bn(Math.pow(2, 32)).mul(new Bn(Math.pow(2, 32))).mul(new Bn(Math.pow(2, 32)))
      k2.gt(k1).should.equal(false)
    })
  })

  describe('#deterministicK', function () {
    it('should generate the same deterministic k', function () {
      ecdsa.deterministicK()
      ecdsa.k.toBuffer().toString('hex').should.equal('fcce1de7a9bcd6b2d3defade6afa1913fb9229e3b7ddf4749b55c4848b2a196e')
    })

    it('should generate the same deterministic k if badrs is set', function () {
      ecdsa.deterministicK(0)
      ecdsa.k.toBuffer().toString('hex').should.equal('fcce1de7a9bcd6b2d3defade6afa1913fb9229e3b7ddf4749b55c4848b2a196e')
      ecdsa.deterministicK(1)
      ecdsa.k.toBuffer().toString('hex').should.not.equal('fcce1de7a9bcd6b2d3defade6afa1913fb9229e3b7ddf4749b55c4848b2a196e')
      ecdsa.k.toBuffer().toString('hex').should.equal('727fbcb59eb48b1d7d46f95a04991fc512eb9dbf9105628e3aec87428df28fd8')
    })

    it('should compute this test vector correctly', function () {
      // test fixture from bitcoinjs
      // https://github.com/bitcoinjs/bitcoinjs-lib/blob/10630873ebaa42381c5871e20336fbfb46564ac8/test/fixtures/ecdsa.json#L6
      let ecdsa = new Ecdsa()
      ecdsa.hashBuf = Hash.sha256(new Buffer('Everything should be made as simple as possible, but not simpler.'))
      ecdsa.keyPair = new KeyPair().fromPrivKey(new PrivKey().fromObject({bn: new Bn(1)}))
      ecdsa.deterministicK()
      ecdsa.k.toBuffer().toString('hex').should.equal('ec633bd56a5774a0940cb97e27a9e4e51dc94af737596a0c5cbb3d30332d92a5')
      ecdsa.sign()
      ecdsa.sig.r.toString().should.equal('23362334225185207751494092901091441011938859014081160902781146257181456271561')
      ecdsa.sig.s.toString().should.equal('50433721247292933944369538617440297985091596895097604618403996029256432099938')
    })
  })

  describe('#sig2PubKey', function () {
    it('should calculate the correct public key', function () {
      ecdsa.k = new Bn('114860389168127852803919605627759231199925249596762615988727970217268189974335', 10)
      ecdsa.sign()
      ecdsa.sig.recovery = 0
      let pubKey = ecdsa.sig2PubKey()
      pubKey.point.eq(ecdsa.keyPair.pubKey.point).should.equal(true)
    })

    it('should calculate the correct public key for this signature with low s', function () {
      ecdsa.k = new Bn('114860389168127852803919605627759231199925249596762615988727970217268189974335', 10)
      ecdsa.sig = new Sig().fromString('3045022100ec3cfe0e335791ad278b4ec8eac93d0347a97877bb1d54d35d189e225c15f6650220278cf15b05ce47fb37d2233802899d94c774d5480bba9f0f2d996baa13370c43')
      ecdsa.sig.recovery = 0
      let pubKey = ecdsa.sig2PubKey()
      pubKey.point.eq(ecdsa.keyPair.pubKey.point).should.equal(true)
    })

    it('should calculate the correct public key for this signature with high s', function () {
      ecdsa.k = new Bn('114860389168127852803919605627759231199925249596762615988727970217268189974335', 10)
      ecdsa.sign()
      ecdsa.sig = new Sig().fromString('3046022100ec3cfe0e335791ad278b4ec8eac93d0347a97877bb1d54d35d189e225c15f665022100d8730ea4fa31b804c82ddcc7fd766269f33a079ea38e012c9238f2e2bcff34fe')
      ecdsa.sig.recovery = 1
      let pubKey = ecdsa.sig2PubKey()
      pubKey.point.eq(ecdsa.keyPair.pubKey.point).should.equal(true)
    })
  })

  describe('#asyncSig2pubKey', function () {
    it('should calculate the correct public key', function () {
      return asink(function * () {
        ecdsa.k = new Bn('114860389168127852803919605627759231199925249596762615988727970217268189974335', 10)
        ecdsa.sign()
        ecdsa.sig.recovery = 0
        let pubKey = yield ecdsa.asyncSig2pubKey()
        pubKey.point.eq(ecdsa.keyPair.pubKey.point).should.equal(true)
      }, this)
    })

    it('should calculate the correct public key for this signature with low s', function () {
      return asink(function * () {
        ecdsa.k = new Bn('114860389168127852803919605627759231199925249596762615988727970217268189974335', 10)
        ecdsa.sig = new Sig().fromString('3045022100ec3cfe0e335791ad278b4ec8eac93d0347a97877bb1d54d35d189e225c15f6650220278cf15b05ce47fb37d2233802899d94c774d5480bba9f0f2d996baa13370c43')
        ecdsa.sig.recovery = 0
        let pubKey = yield ecdsa.asyncSig2pubKey()
        pubKey.point.eq(ecdsa.keyPair.pubKey.point).should.equal(true)
      }, this)
    })

    it('should calculate the correct public key for this signature with high s', function () {
      return asink(function * () {
        ecdsa.k = new Bn('114860389168127852803919605627759231199925249596762615988727970217268189974335', 10)
        ecdsa.sign()
        ecdsa.sig = new Sig().fromString('3046022100ec3cfe0e335791ad278b4ec8eac93d0347a97877bb1d54d35d189e225c15f665022100d8730ea4fa31b804c82ddcc7fd766269f33a079ea38e012c9238f2e2bcff34fe')
        ecdsa.sig.recovery = 1
        let pubKey = yield ecdsa.asyncSig2pubKey()
        pubKey.point.eq(ecdsa.keyPair.pubKey.point).should.equal(true)
      }, this)
    })
  })

  describe('@sig2PubKey', function () {
    it('should calculate the correct public key', function () {
      ecdsa.k = new Bn('114860389168127852803919605627759231199925249596762615988727970217268189974335', 10)
      ecdsa.sign()
      ecdsa.sig.recovery = 0
      let pubKey1 = ecdsa.sig2PubKey()
      let pubKey2 = Ecdsa.sig2PubKey(ecdsa.sig, ecdsa.hashBuf)
      pubKey1.toString().should.equal(pubKey2.toString())
    })

    it('should calculate the correct public key for this signature with low s', function () {
      ecdsa.k = new Bn('114860389168127852803919605627759231199925249596762615988727970217268189974335', 10)
      ecdsa.sig = new Sig().fromString('3045022100ec3cfe0e335791ad278b4ec8eac93d0347a97877bb1d54d35d189e225c15f6650220278cf15b05ce47fb37d2233802899d94c774d5480bba9f0f2d996baa13370c43')
      ecdsa.sig.recovery = 0
      let pubKey1 = ecdsa.sig2PubKey()
      let pubKey2 = Ecdsa.sig2PubKey(ecdsa.sig, ecdsa.hashBuf)
      pubKey1.toString().should.equal(pubKey2.toString())
    })

    it('should calculate the correct public key for this signature with high s', function () {
      ecdsa.k = new Bn('114860389168127852803919605627759231199925249596762615988727970217268189974335', 10)
      ecdsa.sign()
      ecdsa.sig = new Sig().fromString('3046022100ec3cfe0e335791ad278b4ec8eac93d0347a97877bb1d54d35d189e225c15f665022100d8730ea4fa31b804c82ddcc7fd766269f33a079ea38e012c9238f2e2bcff34fe')
      ecdsa.sig.recovery = 1
      let pubKey1 = ecdsa.sig2PubKey()
      let pubKey2 = Ecdsa.sig2PubKey(ecdsa.sig, ecdsa.hashBuf)
      pubKey1.toString().should.equal(pubKey2.toString())
    })
  })

  describe('@asyncSig2pubKey', function () {
    it('should calculate the correct public key', function () {
      return asink(function * () {
        ecdsa.k = new Bn('114860389168127852803919605627759231199925249596762615988727970217268189974335', 10)
        ecdsa.sign()
        ecdsa.sig.recovery = 0
        let pubKey1 = ecdsa.sig2PubKey()
        let pubKey2 = yield Ecdsa.asyncSig2pubKey(ecdsa.sig, ecdsa.hashBuf)
        pubKey1.toString().should.equal(pubKey2.toString())
      }, this)
    })

    it('should calculate the correct public key for this signature with low s', function () {
      return asink(function * () {
        ecdsa.k = new Bn('114860389168127852803919605627759231199925249596762615988727970217268189974335', 10)
        ecdsa.sig = new Sig().fromString('3045022100ec3cfe0e335791ad278b4ec8eac93d0347a97877bb1d54d35d189e225c15f6650220278cf15b05ce47fb37d2233802899d94c774d5480bba9f0f2d996baa13370c43')
        ecdsa.sig.recovery = 0
        let pubKey1 = ecdsa.sig2PubKey()
        let pubKey2 = yield Ecdsa.asyncSig2pubKey(ecdsa.sig, ecdsa.hashBuf)
        pubKey1.toString().should.equal(pubKey2.toString())
      }, this)
    })

    it('should calculate the correct public key for this signature with high s', function () {
      return asink(function * () {
        ecdsa.k = new Bn('114860389168127852803919605627759231199925249596762615988727970217268189974335', 10)
        ecdsa.sign()
        ecdsa.sig = new Sig().fromString('3046022100ec3cfe0e335791ad278b4ec8eac93d0347a97877bb1d54d35d189e225c15f665022100d8730ea4fa31b804c82ddcc7fd766269f33a079ea38e012c9238f2e2bcff34fe')
        ecdsa.sig.recovery = 1
        let pubKey1 = ecdsa.sig2PubKey()
        let pubKey2 = yield Ecdsa.asyncSig2pubKey(ecdsa.sig, ecdsa.hashBuf)
        pubKey1.toString().should.equal(pubKey2.toString())
      }, this)
    })
  })

  describe('#verifyStr', function () {
    it('should return an error if the hash is invalid', function () {
      let ecdsa = new Ecdsa()
      ecdsa.verifyStr().should.equal('hashBuf must be a 32 byte buffer')
    })

    it('should return an error if the pubKey is invalid', function () {
      let ecdsa = new Ecdsa()
      ecdsa.hashBuf = Hash.sha256(new Buffer('test'))
      ecdsa.verifyStr().indexOf('Invalid pubKey').should.equal(0)
    })

    it('should return an error if r, s are invalid', function () {
      let ecdsa = new Ecdsa()
      ecdsa.hashBuf = Hash.sha256(new Buffer('test'))
      let pk = new PubKey()
      pk.fromDer(new Buffer('041ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a7baad41d04514751e6851f5304fd243751703bed21b914f6be218c0fa354a341', 'hex'))
      ecdsa.keyPair = new KeyPair()
      ecdsa.keyPair.pubKey = pk
      ecdsa.sig = new Sig()
      ecdsa.sig.r = new Bn(0)
      ecdsa.sig.s = new Bn(0)
      ecdsa.verifyStr().should.equal('r and s not in range')
    })

    it('should return an error if the signature is incorrect', function () {
      ecdsa.sig = new Sig()
      ecdsa.sig.fromString('3046022100e9915e6236695f093a4128ac2a956c40ed971531de2f4f41ba05fac7e2bd019c02210094e6a4a769cc7f2a8ab3db696c7cd8d56bcdbfff860a8c81de4bc6a798b90827')
      ecdsa.sig.r = ecdsa.sig.r.add(new Bn(1))
      ecdsa.verifyStr().should.equal('Invalid signature')
    })
  })

  describe('#sign', function () {
    it('should create a valid signature', function () {
      ecdsa.randomK()
      ecdsa.sign()
      ecdsa.verify().verified.should.equal(true)
    })

    it('should should throw an error if hashBuf is not 32 bytes', function () {
      let ecdsa2 = new Ecdsa().fromObject({
        hashBuf: ecdsa.hashBuf.slice(0, 31),
        keyPair: ecdsa.keyPair
      })
      ecdsa2.randomK()
      ;(function () {
        ecdsa2.sign()
      }).should.throw('hashBuf must be a 32 byte buffer')
    })

    it('should default to deterministicK', function () {
      let ecdsa2 = new Ecdsa().fromObject(ecdsa)
      ecdsa2.k = undefined
      let called = 0
      let deterministicK = ecdsa2.deterministicK.bind(ecdsa2)
      ecdsa2.deterministicK = function () {
        deterministicK()
        called++
      }
      ecdsa2.sign()
      called.should.equal(1)
    })
  })

  describe('#asyncSign', function () {
    it('should create the same signature as sign', function () {
      return asink(function * () {
        ecdsa.sign()
        let sig = ecdsa.sig
        let sig2 = ecdsa.sig
        yield ecdsa.asyncSign()
        sig.toString().should.equal(sig2.toString())
      }, this)
    })
  })

  describe('#signRandomK', function () {
    it('should produce a signature, and be different when called twice', function () {
      ecdsa.signRandomK()
      should.exist(ecdsa.sig)
      let ecdsa2 = new Ecdsa().fromObject(ecdsa)
      ecdsa2.signRandomK()
      ecdsa.sig.toString().should.not.equal(ecdsa2.sig.toString())
    })
  })

  describe('#toString', function () {
    it('should convert this to a string', function () {
      let str = ecdsa.toString()
      ;(typeof str === 'string').should.equal(true)
    })
  })

  describe('#verify', function () {
    it('should verify a signature that was just signed', function () {
      ecdsa.sig = new Sig()
      ecdsa.sig.fromString('3046022100e9915e6236695f093a4128ac2a956c40ed971531de2f4f41ba05fac7e2bd019c02210094e6a4a769cc7f2a8ab3db696c7cd8d56bcdbfff860a8c81de4bc6a798b90827')
      ecdsa.verify().verified.should.equal(true)
    })

    it('should verify this known good signature', function () {
      ecdsa.signRandomK()
      ecdsa.verify().verified.should.equal(true)
    })
  })

  describe('#asyncVerify', function () {
    it('should verify this known good signature', function () {
      return asink(function * () {
        ecdsa.verified = undefined
        ecdsa.signRandomK()
        yield ecdsa.asyncVerify()
        ecdsa.verified.should.equal(true)
      }, this)
    })
  })

  describe('@sign', function () {
    it('should produce a signature', function () {
      let sig = Ecdsa.sign(ecdsa.hashBuf, ecdsa.keyPair)
      ;(sig instanceof Sig).should.equal(true)
    })
  })

  describe('@asyncSign', function () {
    it('should produce the same signature as @sign', function () {
      return asink(function * () {
        let sig = Ecdsa.sign(ecdsa.hashBuf, ecdsa.keyPair)
        let sigstr = sig.toString()
        let sig2 = yield Ecdsa.asyncSign(ecdsa.hashBuf, ecdsa.keyPair)
        let sig2str = sig2.toString()
        sigstr.should.equal(sig2str)
      }, this)
    })
  })

  describe('@verify', function () {
    it('should verify a valid signature, and unverify an invalid signature', function () {
      let sig = Ecdsa.sign(ecdsa.hashBuf, ecdsa.keyPair)
      Ecdsa.verify(ecdsa.hashBuf, sig, ecdsa.keyPair.pubKey).should.equal(true)
      let fakesig = new Sig(sig.r.add(1), sig.s)
      Ecdsa.verify(ecdsa.hashBuf, fakesig, ecdsa.keyPair.pubKey).should.equal(false)
    })

    it('should work with big and little endian', function () {
      let sig = Ecdsa.sign(ecdsa.hashBuf, ecdsa.keyPair, 'big')
      Ecdsa.verify(ecdsa.hashBuf, sig, ecdsa.keyPair.pubKey, 'big').should.equal(true)
      Ecdsa.verify(ecdsa.hashBuf, sig, ecdsa.keyPair.pubKey, 'little').should.equal(false)
      sig = Ecdsa.sign(ecdsa.hashBuf, ecdsa.keyPair, 'little')
      Ecdsa.verify(ecdsa.hashBuf, sig, ecdsa.keyPair.pubKey, 'big').should.equal(false)
      Ecdsa.verify(ecdsa.hashBuf, sig, ecdsa.keyPair.pubKey, 'little').should.equal(true)
    })
  })

  describe('@asyncVerify', function () {
    it('should verify a valid signature, and unverify an invalid signature', function () {
      return asink(function * () {
        let sig = Ecdsa.sign(ecdsa.hashBuf, ecdsa.keyPair)
        let verified = yield Ecdsa.asyncVerify(ecdsa.hashBuf, sig, ecdsa.keyPair.pubKey)
        verified.should.equal(true)
        let fakesig = new Sig(sig.r.add(1), sig.s)
        verified = yield Ecdsa.asyncVerify(ecdsa.hashBuf, fakesig, ecdsa.keyPair.pubKey)
        verified.should.equal(false)
      }, this)
    })
  })

  describe('vectors', function () {
    vectors.valid.forEach(function (obj, i) {
      it('should validate valid vector ' + i, function () {
        let ecdsa = new Ecdsa().fromObject({
          keyPair: new KeyPair().fromPrivKey(new PrivKey().fromBn(new Bn().fromBuffer(new Buffer(obj.d, 'hex')))),
          k: new Bn().fromBuffer(new Buffer(obj.k, 'hex')),
          hashBuf: Hash.sha256(new Buffer(obj.message)),
          sig: new Sig().fromObject({
            r: new Bn(obj.signature.r),
            s: new Bn(obj.signature.s),
            recovery: obj.i
          })
        })
        let ecdsa2 = new Ecdsa().fromObject(ecdsa)
        ecdsa2.k = undefined
        ecdsa2.sign()
        ecdsa2.calcrecovery()
        ecdsa2.k.toString().should.equal(ecdsa.k.toString())
        ecdsa2.sig.toString().should.equal(ecdsa.sig.toString())
        ecdsa2.sig.recovery.should.equal(ecdsa.sig.recovery)
        ecdsa.verify().verified.should.equal(true)
      })
    })

    vectors.invalid.verifystr.forEach(function (obj, i) {
      it('should validate invalid.verifystr vector ' + i + ': ' + obj.description, function () {
        let ecdsa = new Ecdsa().fromObject({
          keyPair: new KeyPair().fromObject({pubKey: new PubKey().fromObject({point: Point.fromX(true, 1)})}),
          sig: new Sig(new Bn(obj.signature.r), new Bn(obj.signature.s)),
          hashBuf: Hash.sha256(new Buffer(obj.message))
        })
        ecdsa.verifyStr().should.equal(obj.exception)
      })
    })

    vectors.deterministicK.forEach(function (obj, i) {
      it('should validate deterministicK vector ' + i, function () {
        let hashBuf = Hash.sha256(new Buffer(obj.message))
        let privKey = new PrivKey().fromObject({bn: new Bn().fromBuffer(new Buffer(obj.privkey, 'hex'))})
        let ecdsa = new Ecdsa().fromObject({
          keyPair: new KeyPair().fromObject({privKey: privKey}),
          hashBuf: hashBuf
        })
        ecdsa.deterministicK(0).k.toString('hex').should.equal(obj.k_bad00)
        ecdsa.deterministicK(1).k.toString('hex').should.equal(obj.k_bad01)
        ecdsa.deterministicK(15).k.toString('hex').should.equal(obj.k_bad15)
      })
    })
  })
})
