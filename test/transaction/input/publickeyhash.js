'use strict'
/* jshint unused: false */

require('chai').should()

var bsv = require('../../..')
var Transaction = bsv.Transaction
var PrivateKey = bsv.PrivateKey
var Address = bsv.Address
var Script = bsv.Script
var Networks = bsv.Networks

describe('PublicKeyHashInput', function () {
  var privateKey = new PrivateKey('KwF9LjRraetZuEjR8VqEq539z137LW5anYDUnVK11vM3mNMHTWb4')
  var publicKey = privateKey.publicKey
  var address = new Address(publicKey, Networks.livenet)

  var output = {
    address: '33zbk2aSZYdNbRsMPPt6jgy6Kq1kQreqeb',
    txId: '66e64ef8a3b384164b78453fa8c8194de9a473ba14f89485a0e433699daec140',
    outputIndex: 0,
    script: new Script(address),
    satoshis: 1000000
  }
  it('can count missing signatures', function () {
    var transaction = new Transaction()
      .from(output)
      .to(address, 1000000)
    var input = transaction.inputs[0]

    input.isFullySigned().should.equal(false)
    transaction.sign(privateKey)
    input.isFullySigned().should.equal(true)
  })
  it('it\'s size can be estimated', function () {
    var transaction = new Transaction()
      .from(output)
      .to(address, 1000000)
    var input = transaction.inputs[0]
    input._estimateSize().should.equal(149)
  })
  it('it\'s signature can be removed', function () {
    var transaction = new Transaction()
      .from(output)
      .to(address, 1000000)
    var input = transaction.inputs[0]

    transaction.sign(privateKey)
    input.clearSignatures()
    input.isFullySigned().should.equal(false)
  })
  it('returns an empty array if private key mismatches', function () {
    var transaction = new Transaction()
      .from(output)
      .to(address, 1000000)
    var input = transaction.inputs[0]
    var signatures = input.getSignatures(transaction, new PrivateKey(), 0)
    signatures.length.should.equal(0)
  })
})
