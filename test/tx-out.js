/* global describe,it */
'use strict'
import { Bn } from '../lib/bn'
import { Br } from '../lib/br'
import { Script } from '../lib/script'
import { TxOut } from '../lib/tx-out'
import { VarInt } from '../lib/var-int'
import should from 'should'

describe('TxOut', function () {
  const valueBn = new Bn(5)
  const script = new Script().fromString('OP_CHECKMULTISIG')
  const scriptVi = VarInt.fromNumber(script.toBuffer().length)
  const txOut = new TxOut().fromObject({
    valueBn: valueBn,
    scriptVi: scriptVi,
    script: script
  })

  it('should make a new txOut', function () {
    const txOut = new TxOut()
    should.exist(txOut)
    new TxOut(valueBn, scriptVi, script).valueBn.toString().should.equal('5')
  })

  describe('#fromObject', function () {
    it('should set this object', function () {
      const txOut = new TxOut().fromObject({
        valueBn: valueBn,
        scriptVi: scriptVi,
        script: script
      })
      should.exist(txOut.valueBn)
      should.exist(txOut.scriptVi)
      should.exist(txOut.script)
    })
  })

  describe('#setScript', function () {
    it('should set the script size correctly', function () {
      const txOut2 = new TxOut(txOut)
      txOut2
        .setScript(new Script().fromString('OP_RETURN OP_RETURN OP_RETURN'))
        .scriptVi.toNumber()
        .should.equal(3)
    })
  })

  describe('#fromProperties', function () {
    it('should make a new txOut', function () {
      const valueBn = Bn(0)
      const script = Script.fromString('OP_RETURN')
      const txOut = new TxOut().fromProperties(valueBn, script)
      txOut.scriptVi.toNumber().should.equal(1)
    })
  })

  describe('@fromProperties', function () {
    it('should make a new txOut', function () {
      const valueBn = Bn(0)
      const script = Script.fromString('OP_RETURN')
      const txOut = TxOut.fromProperties(valueBn, script)
      txOut.scriptVi.toNumber().should.equal(1)
    })
  })

  describe('#fromJSON', function () {
    it('should set from this json', function () {
      const txOut = new TxOut().fromJSON({
        valueBn: valueBn.toJSON(),
        scriptVi: scriptVi.toJSON(),
        script: script.toJSON()
      })
      should.exist(txOut.valueBn)
      should.exist(txOut.scriptVi)
      should.exist(txOut.script)
    })
  })

  describe('#toJSON', function () {
    it('should return this json', function () {
      const txOut = new TxOut().fromJSON({
        valueBn: valueBn.toJSON(),
        scriptVi: scriptVi.toJSON(),
        script: script.toJSON()
      })
      const json = txOut.toJSON()
      should.exist(json.valueBn)
      should.exist(json.scriptVi)
      should.exist(json.script)
    })
  })

  describe('#fromHex', function () {
    it('should make this txIn from this known hex', function () {
      const txOut = new TxOut().fromHex('050000000000000001ae')
      txOut
        .toBuffer()
        .toString('hex')
        .should.equal('050000000000000001ae')
    })

    it('should work with this problematic json', function () {
      const json = {
        valueBn: '20000',
        scriptVi: '56',
        script: 'OP_SHA256 32 0x8cc17e2a2b10e1da145488458a6edec4a1fdb1921c2d5ccbc96aa0ed31b4d5f8 OP_EQUALVERIFY OP_DUP OP_HASH160 20 0x1451baa3aad777144a0759998a03538018dd7b4b OP_EQUALVERIFY OP_CHECKSIGVERIFY OP_EQUALVERIFY OP_DUP OP_HASH160 20 0x1451baa3aad777144a0759998a03538018dd7b4b OP_EQUALVERIFY OP_CHECKSIG'
      }
      const txOut = TxOut.fromJSON(json)
      txOut.toString().should.equal(TxOut.fromHex(txOut.toHex()).toString())
    })
  })

  describe('#fromBuffer', function () {
    it('should make this txIn from this known buffer', function () {
      const txOut = new TxOut().fromBuffer(
        Buffer.from('050000000000000001ae', 'hex')
      )
      txOut
        .toBuffer()
        .toString('hex')
        .should.equal('050000000000000001ae')
    })
  })

  describe('#fromBr', function () {
    it('should make this txIn from this known buffer', function () {
      const txOut = new TxOut().fromBr(
        new Br(Buffer.from('050000000000000001ae', 'hex'))
      )
      txOut
        .toBuffer()
        .toString('hex')
        .should.equal('050000000000000001ae')
    })
  })

  describe('#toBuffer', function () {
    it('should output this known buffer', function () {
      const txOut = new TxOut().fromBr(
        new Br(Buffer.from('050000000000000001ae', 'hex'))
      )
      txOut
        .toBuffer()
        .toString('hex')
        .should.equal('050000000000000001ae')
    })
  })

  describe('#toBw', function () {
    it('should output this known buffer', function () {
      const txOut = new TxOut().fromBr(
        new Br(Buffer.from('050000000000000001ae', 'hex'))
      )
      txOut
        .toBw()
        .toBuffer()
        .toString('hex')
        .should.equal('050000000000000001ae')
    })
  })
})
