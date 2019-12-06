'use strict'

var bsv = require('../../')

var Benchmark = require('benchmark')

var Transaction = bsv.Transaction
var Random = bsv.crypto.Random
var Script = bsv.Script
var fromAddress = 'mszYqVnqKoQx4jcTdJXxwKAissE3Jbrrc1'
var toAddress = 'mrU9pEmAx26HcbKVrABvgL7AwA5fjNFoDc'
var changeAddress = 'mgBCJAsvzgT2qNNeXsoECg2uPKrUsZ76up'
var privateKey = 'cSBnVM4xvxarwGQuAfQFwqDg9k5tErHUHzgWsEfD4zdwUasvqRVY'

var Benchmarking = function Benchmarking () {
  if (!(this instanceof Benchmarking)) {
    return new Benchmarking()
  }
  return this
}

Benchmarking.asyncFlag = false

Benchmarking.prototype._createUnsignedTx = function _createUnsignedTx (numInputs) {
  let satoshis = 1e3
  let total = satoshis * numInputs - satoshis / 2
  let tx = new Transaction()
  for (let i = 0; i < numInputs; i++) {
    tx = tx.from({
      txId: Random.getRandomBuffer(32).toString('hex'),
      outputIndex: 0,
      script: Script.buildPublicKeyHashOut(fromAddress).toString(),
      satoshis: satoshis
    })
  }
  tx = tx.to([{
    address: toAddress,
    satoshis: total
  }])
    .change(changeAddress)
  return tx
}

Benchmarking.signNumInputs = function (numInputsArray) {
  let benchmarking = new Benchmarking()
  let suite = new Benchmark.Suite()
  numInputsArray.forEach(n => {
    let id = 'Sign#NumInputs' + n
    let tx = benchmarking._createUnsignedTx(n)
    suite.add(id, function () {
      tx.sign(privateKey)
    })
  })
  // add listeners
  suite.on('cycle', function (event) {
    console.log(String(event.target))
  })
  suite.run({ 'async': this.asyncFlag })
}

Benchmarking.createNumInputs = function (numInputsArray) {
  let benchmarking = new Benchmarking()
  let suite = new Benchmark.Suite()
  numInputsArray.forEach(n => {
    let id = 'Create#NumInputs' + n
    suite.add(id, function () {
      benchmarking._createUnsignedTx(n)
    })
  })
  suite.on('cycle', function (event) {
    console.log(String(event.target))
  })
  suite.run({ 'async': this.asyncFlag })
}

Benchmarking.createAndSignNumInputs = function (numInputsArray) {
  let benchmarking = new Benchmarking()
  let suite = new Benchmark.Suite()
  numInputsArray.forEach(n => {
    let id = 'CreateAndSign#NumInputs' + n
    let testfn = function () {
      let tx = benchmarking._createUnsignedTx(n)
      tx.sign(privateKey)
    }
    suite.add(id, function () {
      testfn()
    })
  })
  suite.on('cycle', function (event) {
    console.log(String(event.target))
  })
  suite.run({ 'async': this.asyncFlag })
}

module.exports = Benchmarking
