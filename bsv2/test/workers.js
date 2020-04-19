/* global describe,it */
'use strict'
let Bip32 = require('../lib/bip-32')
let Ecies = require('../lib/ecies')
let Hash = require('../lib/hash')
let PrivKey = require('../lib/priv-key')
let PubKey = require('../lib/pub-key')
let KeyPair = require('../lib/key-pair')
let Workers = require('../lib/workers')
let should = require('should')

describe('Workers', function () {
  it('should satisfy this basic API', function () {
    let workers = new Workers()
    should.exist(workers.nativeWorkers)
    should.exist(workers)
  })

  it('should handle a bunch of things at the same time', async function () {
    this.timeout(6000)
    let n = 100
    let str = Bip32.fromString(
      'xprv9s21ZrQH143K2SX7qL4vxLnbDHtupmfrkv96s1N3eeqKa4LnS5ZNMzhiSQWqL1fmkeF1rF7ndtvDoYH4sKJLMMpaJup21c7C3kyAg8DfbPQ'
    ).toString()
    let arr = []
    for (let i = 0; i < n; i++) {
      arr[i] = Bip32.asyncFromString(str)
    }
    arr.length.should.equal(n)
    await Promise.all(arr)
  })

  it('should handle several big things at the same time', async function () {
    this.timeout(10000)
    let messageBuf = Buffer.from('0'.repeat(10000))
    let fromKeyPair = KeyPair.fromRandom()
    let toKeyPair = KeyPair.fromRandom()
    let toPubKey = toKeyPair.pubKey
    let toPrivKey = toKeyPair.privKey
    let encBuf = await Ecies.asyncBitcoreEncrypt(messageBuf, toPubKey, fromKeyPair)
    await Promise.all([
      Ecies.asyncBitcoreDecrypt(encBuf, toPrivKey),
      Ecies.asyncBitcoreDecrypt(encBuf, toPrivKey),
      Ecies.asyncBitcoreDecrypt(encBuf, toPrivKey),
      Ecies.asyncBitcoreDecrypt(encBuf, toPrivKey),
      Ecies.asyncBitcoreDecrypt(encBuf, toPrivKey),
      Ecies.asyncBitcoreDecrypt(encBuf, toPrivKey),
      Ecies.asyncBitcoreDecrypt(encBuf, toPrivKey),
      Ecies.asyncBitcoreDecrypt(encBuf, toPrivKey),
      Ecies.asyncBitcoreDecrypt(encBuf, toPrivKey),
      Ecies.asyncBitcoreDecrypt(encBuf, toPrivKey),
      Ecies.asyncBitcoreDecrypt(encBuf, toPrivKey),
      Ecies.asyncBitcoreDecrypt(encBuf, toPrivKey),
      Ecies.asyncBitcoreDecrypt(encBuf, toPrivKey),
      Ecies.asyncBitcoreDecrypt(encBuf, toPrivKey),
      Ecies.asyncBitcoreDecrypt(encBuf, toPrivKey)
    ])
  })

  describe('#asyncObjectMethod', function () {
    it('should compute this method in the workers', async function () {
      let bip32 = new Bip32().fromRandom()
      let workersResult = await Workers.asyncObjectMethod(bip32, 'toString', [])
      let str = JSON.parse(workersResult.resbuf.toString())
      str[0].should.equal('x')
    })

    it('should compute this method with Yours Bitcoin object in args in the workers', async function () {
      let privKey = new PrivKey().fromRandom()
      let pubKey1 = new PubKey().fromPrivKey(privKey)
      let workersResult = await Workers.asyncObjectMethod(
        new PubKey(),
        'fromPrivKey',
        [privKey]
      )
      let pubKey2 = new PubKey().fromFastBuffer(workersResult.resbuf)
      pubKey1.toString().should.equal(pubKey2.toString())
    })
  })

  describe('@asyncClassMethod', function () {
    it('should compute this method in the workers', async function () {
      let buf = Buffer.from([0, 1, 2, 3, 4])
      let args = [buf]
      let workersResult = await Workers.asyncClassMethod(Hash, 'sha1', args)
      let hashBuf1 = workersResult.resbuf
      let hashBuf2 = Hash.sha1(buf)
      Buffer.compare(hashBuf1, hashBuf2).should.equal(0)
    })
  })
})
