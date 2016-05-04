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
    interp.altstack.length.should.equal(0)
    interp.pc.should.equal(0)
    interp.pbegincodehash.should.equal(0)
    interp.nOpCount.should.equal(0)
    interp.ifstack.length.should.equal(0)
    interp.errstr.should.equal('')
    interp.flags.should.equal(0)
    interp = Interp()
    ;(interp instanceof Interp).should.equal(true)
    interp.stack.length.should.equal(0)
    interp.altstack.length.should.equal(0)
    interp.pc.should.equal(0)
    interp.pbegincodehash.should.equal(0)
    interp.nOpCount.should.equal(0)
    interp.ifstack.length.should.equal(0)
    interp.errstr.should.equal('')
    interp.flags.should.equal(0)
  })

  describe('#fromJson', function () {
    it('should convert a json to an interp', function () {
      let interp = Interp().fromObject({script: Script(), stack: ['00'], altstack: ['00']})
      let json = interp.toJson()
      let interp2 = Interp().fromJson(json)
      should.exist(interp2.script)
      should.exist(interp2.stack[0])
      should.exist(interp2.altstack[0])
    })
  })

  describe('#fromFastBuffer', function () {
    it('should convert an interp buf to an interp', function () {
      let interp = Interp().fromObject({script: Script(), stack: ['00'], altstack: ['00']})
      let buf = interp.toFastBuffer()
      let interp2 = Interp().fromFastBuffer(buf)
      should.exist(interp2.script)
      should.exist(interp2.stack[0])
      should.exist(interp2.altstack[0])
    })

    it('should convert an interp buf to an interp', function () {
      let interp = Interp().fromObject({script: Script(), stack: ['00'], altstack: ['00'], tx: Tx()})
      let buf = interp.toFastBuffer()
      let interp2 = Interp().fromFastBuffer(buf)
      should.exist(interp2.script)
      should.exist(interp2.stack[0])
      should.exist(interp2.altstack[0])
    })
  })

  describe('#toJson', function () {
    it('should convert an interp to json', function () {
      let interp = Interp().fromObject({script: Script()})
      let json = interp.toJson()
      should.exist(json.script)
      should.not.exist(json.tx)
    })
  })

  describe('#toFastBuffer', function () {
    it('should convert an interp to buf with no tx', function () {
      let interp = Interp().fromObject({script: Script()})
      Buffer.isBuffer(interp.toFastBuffer()).should.equal(true)
    })

    it('should convert an interp to buf with a tx', function () {
      let interp = Interp().fromObject({script: Script(), tx: Tx()})
      Buffer.isBuffer(interp.toFastBuffer()).should.equal(true)
    })
  })

  describe('@castToBool', function () {
    it('should cast these bufs to bool correctly', function () {
      Interp.castToBool(Bn(0).toSm({endian: 'little'})).should.equal(false)
      Interp.castToBool(new Buffer('0080', 'hex')).should.equal(false) // negative 0
      Interp.castToBool(Bn(1).toSm({endian: 'little'})).should.equal(true)
      Interp.castToBool(Bn(-1).toSm({endian: 'little'})).should.equal(true)

      let buf = new Buffer('00', 'hex')
      let bool = Bn().fromSm(buf, {endian: 'little'}).cmp(0) !== 0
      Interp.castToBool(buf).should.equal(bool)
    })
  })

  describe('#verify', function () {
    it('should verify or unverify these trivial scripts from script_valid.json', function () {
      let verified
      verified = Interp().verify(Script().writeString('OP_1'), Script().writeString('OP_1'), Tx(), 0)
      verified.should.equal(true)
      verified = Interp().verify(Script().writeString('OP_1'), Script().writeString('OP_0'), Tx(), 0)
      verified.should.equal(false)
      verified = Interp().verify(Script().writeString('OP_0'), Script().writeString('OP_1'), Tx(), 0)
      verified.should.equal(true)
      verified = Interp().verify(Script().writeString('OP_CODESEPARATOR'), Script().writeString('OP_1'), Tx(), 0)
      verified.should.equal(true)
      verified = Interp().verify(Script().writeString(''), Script().writeString('OP_DEPTH OP_0 OP_EQUAL'), Tx(), 0)
      verified.should.equal(true)
      verified = Interp().verify(Script().writeString('OP_1 OP_2'), Script().writeString('OP_2 OP_EQUALVERIFY OP_1 OP_EQUAL'), Tx(), 0)
      verified.should.equal(true)
      verified = Interp().verify(Script().writeString('9 0x000000000000000010'), Script().writeString(''), Tx(), 0)
      verified.should.equal(true)
      verified = Interp().verify(Script().writeString('OP_1'), Script().writeString('OP_15 OP_ADD OP_16 OP_EQUAL'), Tx(), 0)
      verified.should.equal(true)
      verified = Interp().verify(Script().writeString('OP_0'), Script().writeString('OP_IF OP_VER OP_ELSE OP_1 OP_ENDIF'), Tx(), 0)
      verified.should.equal(true)
    })

    it('should verify this new pay-to-pubKey script', function () {
      let keyPair = KeyPair().fromRandom()
      let scriptPubKey = Script().writeBuffer(keyPair.pubKey.toDer(true)).writeString('OP_CHECKSIG')

      let hashBuf = new Buffer(32)
      hashBuf.fill(0)
      let credtx = Tx()
      credtx.addTxIn(hashBuf, 0xffffffff, Script().writeString('OP_0 OP_0'), 0xffffffff)
      credtx.addTxOut(Bn(0), scriptPubKey)

      let idbuf = credtx.hash()
      let spendtx = Tx()
      spendtx.addTxIn(idbuf, 0, Script(), 0xffffffff)
      spendtx.addTxOut(Bn(0), Script())

      let sig = spendtx.sign(keyPair, Sig.SIGHASH_ALL, 0, scriptPubKey)
      let scriptSig = Script().writeBuffer(sig.toTxFormat())
      spendtx.txins[0].setScript(scriptSig)

      let interp = Interp()
      let verified = interp.verify(scriptSig, scriptPubKey, spendtx, 0)
      verified.should.equal(true)
    })

    it('should verify this pay-to-pubKey script from script_valid.json', function () {
      let scriptSig = Script().fromBitcoindString('0x47 0x3044022007415aa37ce7eaa6146001ac8bdefca0ddcba0e37c5dc08c4ac99392124ebac802207d382307fd53f65778b07b9c63b6e196edeadf0be719130c5db21ff1e700d67501')
      let scriptPubKey = Script().fromBitcoindString('0x41 0x0479be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8 CHECKSIG')

      let hashBuf = new Buffer(32)
      hashBuf.fill(0)
      let credtx = Tx()
      credtx.addTxIn(hashBuf, 0xffffffff, Script().writeString('OP_0 OP_0'), 0xffffffff)
      credtx.addTxOut(Bn(0), scriptPubKey)

      let idbuf = credtx.hash()
      let spendtx = Tx()
      spendtx.addTxIn(idbuf, 0, scriptSig, 0xffffffff)
      spendtx.addTxOut(Bn(0), Script())

      let interp = Interp()
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
        let scriptSig = Script().fromBitcoindString(vector[0])
        let scriptPubKey = Script().fromBitcoindString(vector[1])
        let flags = Interp.getFlags(vector[2])

        let hashBuf = new Buffer(32)
        hashBuf.fill(0)
        let credtx = Tx()
        credtx.addTxIn(hashBuf, 0xffffffff, Script().writeString('OP_0 OP_0'), 0xffffffff)
        credtx.addTxOut(Bn(0), scriptPubKey)

        let idbuf = credtx.hash()
        let spendtx = Tx()
        spendtx.addTxIn(idbuf, 0, scriptSig, 0xffffffff)
        spendtx.addTxOut(Bn(0), Script())

        let interp = Interp()
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
        let scriptSig = Script().fromBitcoindString(vector[0])
        let scriptPubKey = Script().fromBitcoindString(vector[1])
        let flags = Interp.getFlags(vector[2])

        let hashBuf = new Buffer(32)
        hashBuf.fill(0)
        let credtx = Tx()
        credtx.addTxIn(hashBuf, 0xffffffff, Script().writeString('OP_0 OP_0'), 0xffffffff)
        credtx.addTxOut(Bn(0), scriptPubKey)

        let idbuf = credtx.hash()
        let spendtx = Tx()
        spendtx.addTxIn(idbuf, 0, scriptSig, 0xffffffff)
        spendtx.addTxOut(Bn(0), Script())

        let interp = Interp()
        let verified = interp.verify(scriptSig, scriptPubKey, spendtx, 0, flags)
        verified.should.equal(false)
      })
    })
  })
})
