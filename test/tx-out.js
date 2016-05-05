/* global describe,it */
'use strict'
let Bn = require('../lib/bn')
let Br = require('../lib/br')
let Script = require('../lib/script')
let TxOut = require('../lib/tx-out')
let VarInt = require('../lib/var-int')
let should = require('chai').should()

describe('TxOut', function () {
  let valuebn = new Bn(5)
  let script = new Script().fromString('OP_CHECKMULTISIG')
  let scriptVi = VarInt.fromNumber(script.toBuffer().length)
  let txout = new TxOut().fromObject({
    valuebn: valuebn,
    scriptVi: scriptVi,
    script: script
  })

  it('should make a new txout', function () {
    let txout = new TxOut()
    should.exist(txout)
    new TxOut(valuebn, scriptVi, script).valuebn.toString().should.equal('5')
  })

  describe('#fromObject', function () {
    it('should set this object', function () {
      let txout = new TxOut().fromObject({
        valuebn: valuebn,
        scriptVi: scriptVi,
        script: script
      })
      should.exist(txout.valuebn)
      should.exist(txout.scriptVi)
      should.exist(txout.script)
    })
  })

  describe('#setScript', function () {
    it('should set the script size correctly', function () {
      let txout2 = new TxOut(txout)
      txout2.setScript(new Script().fromString('OP_RETURN OP_RETURN OP_RETURN')).scriptVi.toNumber().should.equal(3)
    })
  })

  describe('#fromProperties', function () {
    it('should make a new txOut', function () {
      let valuebn = Bn(0)
      let script = Script.fromString('OP_RETURN')
      let txOut = new TxOut().fromProperties(valuebn, script)
      txOut.scriptVi.toNumber().should.equal(1)
    })
  })

  describe('@fromProperties', function () {
    it('should make a new txOut', function () {
      let valuebn = Bn(0)
      let script = Script.fromString('OP_RETURN')
      let txOut = TxOut.fromProperties(valuebn, script)
      txOut.scriptVi.toNumber().should.equal(1)
    })
  })

  describe('#fromJson', function () {
    it('should set from this json', function () {
      let txout = new TxOut().fromJson({
        valuebn: valuebn.toJson(),
        scriptVi: scriptVi.toJson(),
        script: script.toJson()
      })
      should.exist(txout.valuebn)
      should.exist(txout.scriptVi)
      should.exist(txout.script)
    })
  })

  describe('#toJson', function () {
    it('should return this json', function () {
      let txout = new TxOut().fromJson({
        valuebn: valuebn.toJson(),
        scriptVi: scriptVi.toJson(),
        script: script.toJson()
      })
      let json = txout.toJson()
      should.exist(json.valuebn)
      should.exist(json.scriptVi)
      should.exist(json.script)
    })
  })

  describe('#fromHex', function () {
    it('should make this txin from this known hex', function () {
      let txout = new TxOut().fromHex('050000000000000001ae')
      txout.toBuffer().toString('hex').should.equal('050000000000000001ae')
    })
  })

  describe('#fromBuffer', function () {
    it('should make this txin from this known buffer', function () {
      let txout = new TxOut().fromBuffer(new Buffer('050000000000000001ae', 'hex'))
      txout.toBuffer().toString('hex').should.equal('050000000000000001ae')
    })
  })

  describe('#fromBr', function () {
    it('should make this txin from this known buffer', function () {
      let txout = new TxOut().fromBr(new Br(new Buffer('050000000000000001ae', 'hex')))
      txout.toBuffer().toString('hex').should.equal('050000000000000001ae')
    })
  })

  describe('#toBuffer', function () {
    it('should output this known buffer', function () {
      let txout = new TxOut().fromBr(new Br(new Buffer('050000000000000001ae', 'hex')))
      txout.toBuffer().toString('hex').should.equal('050000000000000001ae')
    })
  })

  describe('#toBw', function () {
    it('should output this known buffer', function () {
      let txout = new TxOut().fromBr(new Br(new Buffer('050000000000000001ae', 'hex')))
      txout.toBw().toBuffer().toString('hex').should.equal('050000000000000001ae')
    })
  })
})
