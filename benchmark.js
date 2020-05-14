
let bsv = require('./')

let Address = bsv.Address
let PrivKey = bsv.PrivKey
let PubKey = bsv.PubKey
let TxBuilder = bsv.TxBuilder
let TxOut = bsv.TxOut
let Random = bsv.Random
let Bn = bsv.Bn
let KeyPair = bsv.KeyPair

var randhex = 'adf4953b2e679fdc453d9cec93ba26c3bd9f0fb875975f3d72ed0c6c6835e26e'
var randbn = new Bn().fromHex(randhex)
var privateKey = PrivKey.fromBn(randbn)
var publicKey = PubKey.fromPrivKey(privateKey)
var keyPair = new KeyPair(privateKey, publicKey)
var fromAddress = Address.fromPrivKey(privateKey)
var toAddress = fromAddress
var changeAddress = toAddress

let n = 10000
let satoshis = 1e3
// let total = satoshis * n - satoshis / 2
let txb = new TxBuilder()
for (let i = 0; i < n; i++) {
  let txOut = TxOut.fromProperties(new Bn(satoshis), fromAddress.toTxOutScript())
  let txHashBuf = Random.getRandomBuffer(32)
  let txOutNum = 0
  txb.inputFromPubKeyHash(txHashBuf, txOutNum, txOut, publicKey)
}
txb = txb.outputToAddress(new Bn(satoshis), toAddress)
txb = txb.setChangeAddress(changeAddress)
txb.setFeePerKbNum(500)
let useAllInputs = true
{
  let start = Date.now()
  txb.build(useAllInputs)
  let finish = Date.now()
  console.log('building: ', finish - start, 'ms')
}

{
  let start = Date.now()
  for (let i = 0; i < txb.txIns.length; i++) {
    txb.signTxIn(i, keyPair)
  }
  let finish = Date.now()
  console.log('', n, 'inputs', 'signing: ', finish - start, 'ms')
}
