let bsv = require('./')
let Transaction = bsv.Transaction
let Random = bsv.crypto.Random
let Script = bsv.Script

var fromAddress = 'mszYqVnqKoQx4jcTdJXxwKAissE3Jbrrc1'
var toAddress = 'mrU9pEmAx26HcbKVrABvgL7AwA5fjNFoDc'
var changeAddress = 'mgBCJAsvzgT2qNNeXsoECg2uPKrUsZ76up'
var privateKey = 'cSBnVM4xvxarwGQuAfQFwqDg9k5tErHUHzgWsEfD4zdwUasvqRVY'

let n = 10000
let satoshis = 1e3
let total = satoshis * n - satoshis / 2
let tx = new Transaction()
for (let i = 0; i < n; i++) {
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

let start = Date.now()
tx.sign(privateKey)
let finish = Date.now()

console.log('', n, 'inputs', 'signing:', finish - start, 'ms')
