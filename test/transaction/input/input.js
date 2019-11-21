'use strict'

var should = require('chai').should()
var expect = require('chai').expect
var _ = require('../../../lib/util/_')

var bsv = require('../../..')
var errors = bsv.errors
var PrivateKey = bsv.PrivateKey
var Address = bsv.Address
var Script = bsv.Script
var Networks = bsv.Networks
var Input = bsv.Transaction.Input

describe('Transaction.Input', function () {
  var privateKey = new PrivateKey('KwF9LjRraetZuEjR8VqEq539z137LW5anYDUnVK11vM3mNMHTWb4')
  var publicKey = privateKey.publicKey
  var address = new Address(publicKey, Networks.livenet)
  var output = {
    address: '33zbk2aSZYdNbRsMPPt6jgy6Kq1kQreqeb',
    prevTxId: '66e64ef8a3b384164b78453fa8c8194de9a473ba14f89485a0e433699daec140',
    outputIndex: 0,
    script: new Script(address),
    satoshis: 1000000
  }
  var coinbase = {
    prevTxId: '0000000000000000000000000000000000000000000000000000000000000000',
    outputIndex: 0xFFFFFFFF,
    script: new Script(),
    satoshis: 1000000
  }

  var coinbaseJSON = JSON.stringify({
    prevTxId: '0000000000000000000000000000000000000000000000000000000000000000',
    outputIndex: 4294967295,
    script: ''
  })

  it('has abstract methods: "getSignatures", "isFullySigned", "addSignature", "clearSignatures"', function () {
    var input = new Input(output)
    _.each(['getSignatures', 'isFullySigned', 'addSignature', 'clearSignatures'], function (method) {
      expect(function () {
        return input[method]()
      }).to.throw(errors.AbstractMethodInvoked)
    })
  })
  it('detects coinbase transactions', function () {
    new Input(output).isNull().should.equal(false)
    var ci = new Input(coinbase)
    ci.isNull().should.equal(true)
  })

  describe('instantiation', function () {
    it('works without new', function () {
      var input = Input()
      should.exist(input)
    })
    it('fails with no script info', function () {
      expect(function () {
        var input = new Input({})
        input.toString()
      }).to.throw('Need a script to create an input')
    })
    it('fromObject should work', function () {
      var jsonData = JSON.parse(coinbaseJSON)
      var input = Input.fromObject(jsonData)
      should.exist(input)
      input.prevTxId.toString('hex').should.equal(jsonData.prevTxId)
      input.outputIndex.should.equal(jsonData.outputIndex)
    })
    it('fromObject should work', function () {
      var input = Input.fromObject(JSON.parse(coinbaseJSON))
      var obj = input.toObject()
      Input.fromObject(obj).should.deep.equal(input)
      obj.script = 42
      Input.fromObject.bind(null, obj).should.throw('Invalid argument type: script')
    })
  })

  it('_estimateSize returns correct size', function () {
    var input = new Input(output)
    input._estimateSize().should.equal(66)
  })

  it('defaults isFinal correctly', function () {
    new Input(output).isFinal().should.equal(true)
  })

  it('handles isFinal when sequence number is set to non default value', function () {
    new Input({ ...output, sequenceNumber: 0 }).isFinal().should.equal(false)
  })
})
