/* global describe,it */
'use strict'
let Bn = require('../lib/bn')
let Br = require('../lib/br')
let Script = require('../lib/script')
let TxOut = require('../lib/tx-out')
let VarInt = require('../lib/var-int')
let should = require('chai').should()

describe('TxOut', function () {
  let valueBn = new Bn(5)
  let script = new Script().fromString('OP_CHECKMULTISIG')
  let scriptVi = VarInt.fromNumber(script.toBuffer().length)
  let txOut = new TxOut().fromObject({
    valueBn: valueBn,
    scriptVi: scriptVi,
    script: script
  })

  it('should make a new txOut', function () {
    let txOut = new TxOut()
    should.exist(txOut)
    new TxOut(valueBn, scriptVi, script).valueBn.toString().should.equal('5')
  })

  describe('#fromObject', function () {
    it('should set this object', function () {
      let txOut = new TxOut().fromObject({
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
      let txOut2 = new TxOut(txOut)
      txOut2.setScript(new Script().fromString('OP_RETURN OP_RETURN OP_RETURN')).scriptVi.toNumber().should.equal(3)
    })
  })

  describe('#fromProperties', function () {
    it('should make a new txOut', function () {
      let valueBn = Bn(0)
      let script = Script.fromString('OP_RETURN')
      let txOut = new TxOut().fromProperties(valueBn, script)
      txOut.scriptVi.toNumber().should.equal(1)
    })
  })

  describe('@fromProperties', function () {
    it('should make a new txOut', function () {
      let valueBn = Bn(0)
      let script = Script.fromString('OP_RETURN')
      let txOut = TxOut.fromProperties(valueBn, script)
      txOut.scriptVi.toNumber().should.equal(1)
    })
  })

  describe('#fromJson', function () {
    it('should set from this json', function () {
      let txOut = new TxOut().fromJson({
        valueBn: valueBn.toJson(),
        scriptVi: scriptVi.toJson(),
        script: script.toJson()
      })
      should.exist(txOut.valueBn)
      should.exist(txOut.scriptVi)
      should.exist(txOut.script)
    })
  })

  describe('#toJson', function () {
    it('should return this json', function () {
      let txOut = new TxOut().fromJson({
        valueBn: valueBn.toJson(),
        scriptVi: scriptVi.toJson(),
        script: script.toJson()
      })
      let json = txOut.toJson()
      should.exist(json.valueBn)
      should.exist(json.scriptVi)
      should.exist(json.script)
    })
  })

  describe('#fromHex', function () {
    it('should make this txIn from this known hex', function () {
      let txOut = new TxOut().fromHex('050000000000000001ae')
      txOut.toBuffer().toString('hex').should.equal('050000000000000001ae')
    })
  })

  describe('#fromBuffer', function () {
    it('should make this txIn from this known buffer', function () {
      let txOut = new TxOut().fromBuffer(new Buffer('050000000000000001ae', 'hex'))
      txOut.toBuffer().toString('hex').should.equal('050000000000000001ae')
    })
  })

  describe('#fromBr', function () {
    it('should make this txIn from this known buffer', function () {
      let txOut = new TxOut().fromBr(new Br(new Buffer('050000000000000001ae', 'hex')))
      txOut.toBuffer().toString('hex').should.equal('050000000000000001ae')
    })
  })

  describe('#toBuffer', function () {
    it('should output this known buffer', function () {
      let txOut = new TxOut().fromBr(new Br(new Buffer('050000000000000001ae', 'hex')))
      txOut.toBuffer().toString('hex').should.equal('050000000000000001ae')
    })
  })

  describe('#toBw', function () {
    it('should output this known buffer', function () {
      let txOut = new TxOut().fromBr(new Br(new Buffer('050000000000000001ae', 'hex')))
      txOut.toBw().toBuffer().toString('hex').should.equal('050000000000000001ae')
    })
  })
})
