/* global describe,it */
'use strict'
import should from 'should'
import { Script } from '../lib/script'
import { TxIn } from '../lib/tx-in'
import { TxOut } from '../lib/tx-out'
import { VarInt } from '../lib/var-int'
import { Br } from '../lib/br'
import { Bn } from '../lib/bn'
import { KeyPair } from '../lib/key-pair'
import { Address } from '../lib/address'

describe('TxIn', function () {
  let txHashBuf = Buffer.alloc(32)
  txHashBuf.fill(0)
  let txOutNum = 0
  let script = new Script().fromString('OP_CHECKMULTISIG')
  let scriptVi = VarInt.fromNumber(script.toBuffer().length)
  let nSequence = 0
  let txIn = new TxIn().fromObject({
    txHashBuf: txHashBuf,
    txOutNum: txOutNum,
    scriptVi: scriptVi,
    script: script,
    nSequence: nSequence
  })

  it('should make a new txIn', function () {
    let txIn = new TxIn()
    should.exist(txIn)
    txIn = new TxIn()
    should.exist(txIn)
    let txHashBuf = Buffer.alloc(32)
    txHashBuf.fill(0)
    new TxIn(txHashBuf, 0).txHashBuf.length.should.equal(32)
  })

  describe('#initialize', function () {
    it('should default to 0xffffffff nSequence', function () {
      new TxIn().nSequence.should.equal(0xffffffff)
    })
  })

  describe('#fromObject', function () {
    it('should set these vars', function () {
      let txIn = new TxIn().fromObject({
        txHashBuf: txHashBuf,
        txOutNum: txOutNum,
        scriptVi: scriptVi,
        script: script,
        nSequence: nSequence
      })
      should.exist(txIn.txHashBuf)
      should.exist(txIn.txOutNum)
      should.exist(txIn.scriptVi)
      should.exist(txIn.script)
      should.exist(txIn.nSequence)
    })
  })

  describe('#fromProperties', function () {
    it('should make a new txIn', function () {
      let txIn = new TxIn().fromProperties(
        txHashBuf,
        txOutNum,
        script,
        nSequence
      )
      should.exist(txIn.scriptVi)
    })
  })

  describe('@fromProperties', function () {
    it('should make a new txIn', function () {
      let txIn = TxIn.fromProperties(txHashBuf, txOutNum, script, nSequence)
      should.exist(txIn.scriptVi)
    })
  })

  describe('#setScript', function () {
    it('should calculate the varInt size correctly', function () {
      let txIn2 = new TxIn(txIn)
      txIn2
        .setScript(new Script().fromString('OP_RETURN OP_RETURN OP_RETURN'))
        .scriptVi.toNumber()
        .should.equal(3)
    })
  })

  describe('#fromJSON', function () {
    it('should set these vars', function () {
      let txIn2 = new TxIn().fromJSON(txIn.toJSON())
      should.exist(txIn2.txHashBuf)
      should.exist(txIn2.txOutNum)
      should.exist(txIn2.scriptVi)
      should.exist(txIn2.script)
      should.exist(txIn2.nSequence)
    })
  })

  describe('#toJSON', function () {
    it('should set these vars', function () {
      let json = txIn.toJSON()
      should.exist(json.txHashBuf)
      should.exist(json.txOutNum)
      should.exist(json.scriptVi)
      should.exist(json.script)
      should.exist(json.nSequence)
    })
  })

  describe('#fromHex', function () {
    it('should convert this known buffer', function () {
      let hex =
        '00000000000000000000000000000000000000000000000000000000000000000000000001ae00000000'
      let txIn = new TxIn().fromHex(hex)
      txIn.scriptVi.toNumber().should.equal(1)
      txIn.script.toString().should.equal('OP_CHECKMULTISIG')
    })
  })

  describe('#fromBuffer', function () {
    it('should convert this known buffer', function () {
      let hex =
        '00000000000000000000000000000000000000000000000000000000000000000000000001ae00000000'
      let buf = Buffer.from(hex, 'hex')
      let txIn = new TxIn().fromBuffer(buf)
      txIn.scriptVi.toNumber().should.equal(1)
      txIn.script.toString().should.equal('OP_CHECKMULTISIG')
    })
  })

  describe('#fromBr', function () {
    it('should convert this known buffer', function () {
      let hex =
        '00000000000000000000000000000000000000000000000000000000000000000000000001ae00000000'
      let buf = Buffer.from(hex, 'hex')
      let br = new Br(buf)
      let txIn = new TxIn().fromBr(br)
      txIn.scriptVi.toNumber().should.equal(1)
      txIn.script.toString().should.equal('OP_CHECKMULTISIG')
    })
  })

  describe('#toHex', function () {
    it('should convert this known hex', function () {
      txIn
        .toHex()
        .should.equal(
          '00000000000000000000000000000000000000000000000000000000000000000000000001ae00000000'
        )
    })
  })

  describe('#toBuffer', function () {
    it('should convert this known buffer', function () {
      txIn
        .toBuffer()
        .toString('hex')
        .should.equal(
          '00000000000000000000000000000000000000000000000000000000000000000000000001ae00000000'
        )
    })
  })

  describe('#toBw', function () {
    it('should convert this known buffer', function () {
      txIn
        .toBw()
        .toBuffer()
        .toString('hex')
        .should.equal(
          '00000000000000000000000000000000000000000000000000000000000000000000000001ae00000000'
        )
    })
  })

  describe('#fromPubKeyHashTxOut', function () {
    it('should convert from pubKeyHash out', function () {
      let keyPair = new KeyPair().fromRandom()
      let address = new Address().fromPubKey(keyPair.pubKey)
      let txOut = TxOut.fromProperties(
        new Bn(1000),
        new Script().fromPubKeyHash(address.hashBuf)
      )
      let txHashBuf = Buffer.alloc(32)
      txHashBuf.fill(0)
      let txOutNum = 0
      let txIn = new TxIn().fromPubKeyHashTxOut(
        txHashBuf,
        txOutNum,
        txOut,
        keyPair.pubKey
      )
      should.exist(txIn)
    })
  })
})
