/* global describe,it */
'use strict'
let should = require('chai').should()
let Interp = require('../lib/interp')
let Tx = require('../lib/tx')
let Script = require('../lib/script')
let Bn = require('../lib/bn')
let KeyPair = require('../lib/key-pair')
let Sig = require('../lib/sig')
let scriptValid = require('./vectors/bitcoind/script_valid')
let scriptInvalid = require('./vectors/bitcoind/script_invalid')

describe('Interp', function () {
  it('should make a new interp', function () {
    let interp = new Interp()
    ;(interp instanceof Interp).should.equal(true)
    interp.stack.length.should.equal(0)
    interp.altStack.length.should.equal(0)
    interp.pc.should.equal(0)
    interp.pBeginCodeHash.should.equal(0)
    interp.nOpCount.should.equal(0)
    interp.ifStack.length.should.equal(0)
    interp.errStr.should.equal('')
    interp.flags.should.equal(0)
    interp = new Interp()
    ;(interp instanceof Interp).should.equal(true)
    interp.stack.length.should.equal(0)
    interp.altStack.length.should.equal(0)
    interp.pc.should.equal(0)
    interp.pBeginCodeHash.should.equal(0)
    interp.nOpCount.should.equal(0)
    interp.ifStack.length.should.equal(0)
    interp.errStr.should.equal('')
    interp.flags.should.equal(0)
  })

  describe('#fromJson', function () {
    it('should convert a json to an interp', function () {
      let interp = new Interp().fromObject({script: new Script(), stack: ['00'], altStack: ['00']})
      let json = interp.toJson()
      let interp2 = new Interp().fromJson(json)
      should.exist(interp2.script)
      should.exist(interp2.stack[0])
      should.exist(interp2.altStack[0])
    })
  })

  describe('#fromFastBuffer', function () {
    it('should convert an interp buf to an interp', function () {
      let interp = new Interp().fromObject({script: new Script(), stack: ['00'], altStack: ['00']})
      let buf = interp.toFastBuffer()
      let interp2 = new Interp().fromFastBuffer(buf)
      should.exist(interp2.script)
      should.exist(interp2.stack[0])
      should.exist(interp2.altStack[0])
    })

    it('should convert an interp buf to an interp', function () {
      let interp = new Interp().fromObject({script: new Script(), stack: ['00'], altStack: ['00'], tx: new Tx()})
      let buf = interp.toFastBuffer()
      let interp2 = new Interp().fromFastBuffer(buf)
      should.exist(interp2.script)
      should.exist(interp2.stack[0])
      should.exist(interp2.altStack[0])
    })
  })

  describe('#toJson', function () {
    it('should convert an interp to json', function () {
      let interp = new Interp().fromObject({script: new Script()})
      let json = interp.toJson()
      should.exist(json.script)
      should.not.exist(json.tx)
    })
  })

  describe('#toFastBuffer', function () {
    it('should convert an interp to buf with no tx', function () {
      let interp = new Interp().fromObject({script: new Script()})
      Buffer.isBuffer(interp.toFastBuffer()).should.equal(true)
    })

    it('should convert an interp to buf with a tx', function () {
      let interp = new Interp().fromObject({script: new Script(), tx: new Tx()})
      Buffer.isBuffer(interp.toFastBuffer()).should.equal(true)
    })
  })

  describe('@castToBool', function () {
    it('should cast these bufs to bool correctly', function () {
      Interp.castToBool(new Bn(0).toSm({endian: 'little'})).should.equal(false)
      Interp.castToBool(new Buffer('0080', 'hex')).should.equal(false) // negative 0
      Interp.castToBool(new Bn(1).toSm({endian: 'little'})).should.equal(true)
      Interp.castToBool(new Bn(-1).toSm({endian: 'little'})).should.equal(true)

      let buf = new Buffer('00', 'hex')
      let bool = new Bn().fromSm(buf, {endian: 'little'}).cmp(0) !== 0
      Interp.castToBool(buf).should.equal(bool)
    })
  })

  describe('#getDebugObject', function () {
    it('should get a failure explanation object', function () {
      let scriptSig = Script.fromBitcoindString('0x47 0x3044022057292e2d4dfe775becdd0a9e6547997c728cdf35390f6a017da56d654d374e4902206b643be2fc53763b4e284845bfea2c597d2dc7759941dce937636c9d341b71ed01')
      let scriptPubKey = Script.fromBitcoindString('0x41 0x0679be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8 CHECKSIG')
      let flags = Interp.SCRIPT_VERIFY_P2SH | Interp.SCRIPT_VERIFY_CHECKLOCKTIMEVERIFY | Interp.SCRIPT_VERIFY_CHECKSEQUENCEVERIFY

      let hashBuf = new Buffer(32)
      hashBuf.fill(0)
      let credtx = new Tx()
      credtx.addTxIn(hashBuf, 0xffffffff, new Script().writeString('OP_0 OP_0'), 0xffffffff)
      credtx.addTxOut(new Bn(0), scriptPubKey)

      let idbuf = credtx.hash()
      let spendtx = new Tx()
      spendtx.addTxIn(idbuf, 0, new Script(), 0xffffffff)
      spendtx.addTxOut(new Bn(0), new Script())

      let interp = new Interp()
      interp.verify(scriptSig, scriptPubKey, spendtx, 0, flags)
      let debugObject = interp.getDebugObject()
      should.exist(debugObject.errStr)
      should.exist(debugObject.scriptStr)
      should.exist(debugObject.pc)
      should.exist(debugObject.opCodeStr)
    })
  })

  describe('#getDebugString', function () {
    it('should get a failure explanation object', function () {
      let scriptSig = Script.fromBitcoindString('0x47 0x3044022057292e2d4dfe775becdd0a9e6547997c728cdf35390f6a017da56d654d374e4902206b643be2fc53763b4e284845bfea2c597d2dc7759941dce937636c9d341b71ed01')
      let scriptPubKey = Script.fromBitcoindString('0x41 0x0679be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8 CHECKSIG')
      let flags = Interp.SCRIPT_VERIFY_P2SH | Interp.SCRIPT_VERIFY_CHECKLOCKTIMEVERIFY | Interp.SCRIPT_VERIFY_CHECKSEQUENCEVERIFY

      let hashBuf = new Buffer(32)
      hashBuf.fill(0)
      let credtx = new Tx()
      credtx.addTxIn(hashBuf, 0xffffffff, new Script().writeString('OP_0 OP_0'), 0xffffffff)
      credtx.addTxOut(new Bn(0), scriptPubKey)

      let idbuf = credtx.hash()
      let spendtx = new Tx()
      spendtx.addTxIn(idbuf, 0, new Script(), 0xffffffff)
      spendtx.addTxOut(new Bn(0), new Script())

      let interp = new Interp()
      interp.verify(scriptSig, scriptPubKey, spendtx, 0, flags)
      let debugString = interp.getDebugString()
      debugString.should.equal('{\n  "errStr": "",\n  "scriptStr": "65 0x0679be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8 OP_CHECKSIG",\n  "pc": 1,\n  "stack": [\n    "01"\n  ],\n  "altStack": [],\n  "opCodeStr": "OP_CHECKSIG"\n}')
    })
  })

  describe('#verify', function () {
    it('should verify or unverify these trivial scripts from script_valid.json', function () {
      let verified
      verified = new Interp().verify(new Script().writeString('OP_1'), new Script().writeString('OP_1'), new Tx(), 0)
      verified.should.equal(true)
      verified = new Interp().verify(new Script().writeString('OP_1'), new Script().writeString('OP_0'), new Tx(), 0)
      verified.should.equal(false)
      verified = new Interp().verify(new Script().writeString('OP_0'), new Script().writeString('OP_1'), new Tx(), 0)
      verified.should.equal(true)
      verified = new Interp().verify(new Script().writeString('OP_CODESEPARATOR'), new Script().writeString('OP_1'), new Tx(), 0)
      verified.should.equal(true)
      verified = new Interp().verify(new Script().writeString(''), new Script().writeString('OP_DEPTH OP_0 OP_EQUAL'), new Tx(), 0)
      verified.should.equal(true)
      verified = new Interp().verify(new Script().writeString('OP_1 OP_2'), new Script().writeString('OP_2 OP_EQUALVERIFY OP_1 OP_EQUAL'), new Tx(), 0)
      verified.should.equal(true)
      verified = new Interp().verify(new Script().writeString('9 0x000000000000000010'), new Script().writeString(''), new Tx(), 0)
      verified.should.equal(true)
      verified = new Interp().verify(new Script().writeString('OP_1'), new Script().writeString('OP_15 OP_ADD OP_16 OP_EQUAL'), new Tx(), 0)
      verified.should.equal(true)
      verified = new Interp().verify(new Script().writeString('OP_0'), new Script().writeString('OP_IF OP_VER OP_ELSE OP_1 OP_ENDIF'), new Tx(), 0)
      verified.should.equal(true)
    })

    it('should verify this new pay-to-pubKey script', function () {
      let keyPair = new KeyPair().fromRandom()
      let scriptPubKey = new Script().writeBuffer(keyPair.pubKey.toDer(true)).writeString('OP_CHECKSIG')

      let hashBuf = new Buffer(32)
      hashBuf.fill(0)
      let credtx = new Tx()
      credtx.addTxIn(hashBuf, 0xffffffff, new Script().writeString('OP_0 OP_0'), 0xffffffff)
      credtx.addTxOut(new Bn(0), scriptPubKey)

      let idbuf = credtx.hash()
      let spendtx = new Tx()
      spendtx.addTxIn(idbuf, 0, new Script(), 0xffffffff)
      spendtx.addTxOut(new Bn(0), new Script())

      let sig = spendtx.sign(keyPair, Sig.SIGHASH_ALL, 0, scriptPubKey)
      let scriptSig = new Script().writeBuffer(sig.toTxFormat())
      spendtx.txIns[0].setScript(scriptSig)

      let interp = new Interp()
      let verified = interp.verify(scriptSig, scriptPubKey, spendtx, 0)
      verified.should.equal(true)
    })

    it('should verify this pay-to-pubKey script from script_valid.json', function () {
      let scriptSig = new Script().fromBitcoindString('0x47 0x3044022007415aa37ce7eaa6146001ac8bdefca0ddcba0e37c5dc08c4ac99392124ebac802207d382307fd53f65778b07b9c63b6e196edeadf0be719130c5db21ff1e700d67501')
      let scriptPubKey = new Script().fromBitcoindString('0x41 0x0479be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8 CHECKSIG')

      let hashBuf = new Buffer(32)
      hashBuf.fill(0)
      let credtx = new Tx()
      credtx.addTxIn(hashBuf, 0xffffffff, new Script().writeString('OP_0 OP_0'), 0xffffffff)
      credtx.addTxOut(new Bn(0), scriptPubKey)

      let idbuf = credtx.hash()
      let spendtx = new Tx()
      spendtx.addTxIn(idbuf, 0, scriptSig, 0xffffffff)
      spendtx.addTxOut(new Bn(0), new Script())

      let interp = new Interp()
      let verified = interp.verify(scriptSig, scriptPubKey, spendtx, 0, 0)
      verified.should.equal(true)
    })
  })

  describe('vectors', function () {
    let c

    c = 0
    scriptValid.forEach(function (vector, i) {
      if (vector.length === 1) {
        return
      }
      c++
      it('should verify scriptValid vector ' + c, function () {
        let scriptSig = new Script().fromBitcoindString(vector[0])
        let scriptPubKey = new Script().fromBitcoindString(vector[1])
        let flags = Interp.getFlags(vector[2])

        let hashBuf = new Buffer(32)
        hashBuf.fill(0)
        let credtx = new Tx()
        credtx.addTxIn(hashBuf, 0xffffffff, new Script().writeString('OP_0 OP_0'), 0xffffffff)
        credtx.addTxOut(new Bn(0), scriptPubKey)

        let idbuf = credtx.hash()
        let spendtx = new Tx()
        spendtx.addTxIn(idbuf, 0, scriptSig, 0xffffffff)
        spendtx.addTxOut(new Bn(0), new Script())

        let interp = new Interp()
        let verified = interp.verify(scriptSig, scriptPubKey, spendtx, 0, flags)
        verified.should.equal(true)
      })
    })

    c = 0
    scriptInvalid.forEach(function (vector, i) {
      if (vector.length === 1) {
        return
      }
      c++
      it('should unverify scriptInvalid vector ' + c, function () {
        let scriptSig = new Script().fromBitcoindString(vector[0])
        let scriptPubKey = new Script().fromBitcoindString(vector[1])
        let flags = Interp.getFlags(vector[2])

        let hashBuf = new Buffer(32)
        hashBuf.fill(0)
        let credtx = new Tx()
        credtx.addTxIn(hashBuf, 0xffffffff, new Script().writeString('OP_0 OP_0'), 0xffffffff)
        credtx.addTxOut(new Bn(0), scriptPubKey)

        let idbuf = credtx.hash()
        let spendtx = new Tx()
        spendtx.addTxIn(idbuf, 0, scriptSig, 0xffffffff)
        spendtx.addTxOut(new Bn(0), new Script())

        let interp = new Interp()
        let verified = interp.verify(scriptSig, scriptPubKey, spendtx, 0, flags)
        verified.should.equal(false)
      })
    })
  })
})
