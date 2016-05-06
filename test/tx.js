/* global describe,it */
'use strict'
let Br = require('../lib/br')
let KeyPair = require('../lib/key-pair')
let Script = require('../lib/script')
let Sig = require('../lib/sig')
let Tx = require('../lib/tx')
let TxIn = require('../lib/tx-in')
let TxOut = require('../lib/tx-out')
let VarInt = require('../lib/var-int')
let asink = require('asink')
let should = require('chai').should()

let vectorsSighash = require('./vectors/bitcoind/sighash')
let vectorsTxValid = require('./vectors/bitcoind/tx_valid')
let vectorsTxInvalid = require('./vectors/bitcoind/tx_invalid')
let largesttxvector = require('./vectors/largesttx')

describe('Tx', function () {
  let txIn = new TxIn().fromBuffer(new Buffer('00000000000000000000000000000000000000000000000000000000000000000000000001ae00000000', 'hex'))
  let txOut = new TxOut().fromBuffer(new Buffer('050000000000000001ae', 'hex'))
  let tx = new Tx().fromObject({
    version: 0,
    txInsVi: VarInt.fromNumber(1),
    txIns: [txIn],
    txOutsVi: VarInt.fromNumber(1),
    txOuts: [txOut],
    nLockTime: 0
  })
  let txhex = '000000000100000000000000000000000000000000000000000000000000000000000000000000000001ae0000000001050000000000000001ae00000000'
  let txbuf = new Buffer(txhex, 'hex')

  let tx2idhex = '8c9aa966d35bfeaf031409e0001b90ccdafd8d859799eb945a3c515b8260bcf2'
  let tx2hex = '01000000029e8d016a7b0dc49a325922d05da1f916d1e4d4f0cb840c9727f3d22ce8d1363f000000008c493046022100e9318720bee5425378b4763b0427158b1051eec8b08442ce3fbfbf7b30202a44022100d4172239ebd701dae2fbaaccd9f038e7ca166707333427e3fb2a2865b19a7f27014104510c67f46d2cbb29476d1f0b794be4cb549ea59ab9cc1e731969a7bf5be95f7ad5e7f904e5ccf50a9dc1714df00fbeb794aa27aaff33260c1032d931a75c56f2ffffffffa3195e7a1ab665473ff717814f6881485dc8759bebe97e31c301ffe7933a656f020000008b48304502201c282f35f3e02a1f32d2089265ad4b561f07ea3c288169dedcf2f785e6065efa022100e8db18aadacb382eed13ee04708f00ba0a9c40e3b21cf91da8859d0f7d99e0c50141042b409e1ebbb43875be5edde9c452c82c01e3903d38fa4fd89f3887a52cb8aea9dc8aec7e2c9d5b3609c03eb16259a2537135a1bf0f9c5fbbcbdbaf83ba402442ffffffff02206b1000000000001976a91420bb5c3bfaef0231dc05190e7f1c8e22e098991e88acf0ca0100000000001976a9149e3e2d23973a04ec1b02be97c30ab9f2f27c3b2c88ac00000000'
  let tx2buf = new Buffer(tx2hex, 'hex')

  it('should make a new transaction', function () {
    let tx = new Tx()
    should.exist(tx)
    tx = new Tx()
    should.exist(tx)

    Tx.fromBuffer(txbuf).toBuffer().toString('hex').should.equal(txhex)

    // should set known defaults
    tx.version.should.equal(1)
    tx.txInsVi.toNumber().should.equal(0)
    tx.txIns.length.should.equal(0)
    tx.txOutsVi.toNumber().should.equal(0)
    tx.txOuts.length.should.equal(0)
    tx.nLockTime.should.equal(0)
  })

  describe('#initialize', function () {
    it('should set these known defaults', function () {
      let tx = new Tx()
      tx.initialize()
      tx.version.should.equal(1)
      tx.txInsVi.toNumber().should.equal(0)
      tx.txIns.length.should.equal(0)
      tx.txOutsVi.toNumber().should.equal(0)
      tx.txOuts.length.should.equal(0)
      tx.nLockTime.should.equal(0)
    })
  })

  describe('#fromObject', function () {
    it('should set all the basic parameters', function () {
      let tx = new Tx().fromObject({
        version: 0,
        txInsVi: VarInt.fromNumber(1),
        txIns: [txIn],
        txOutsVi: VarInt.fromNumber(1),
        txOuts: [txOut],
        nLockTime: 0
      })
      should.exist(tx.version)
      should.exist(tx.txInsVi)
      should.exist(tx.txIns)
      should.exist(tx.txOutsVi)
      should.exist(tx.txOuts)
      should.exist(tx.nLockTime)
    })
  })

  describe('#fromJson', function () {
    it('should set all the basic parameters', function () {
      let tx = new Tx().fromJson({
        version: 0,
        txInsVi: VarInt.fromNumber(1).toJson(),
        txIns: [txIn.toJson()],
        txOutsVi: VarInt.fromNumber(1).toJson(),
        txOuts: [txOut.toJson()],
        nLockTime: 0
      })
      should.exist(tx.version)
      should.exist(tx.txInsVi)
      should.exist(tx.txIns)
      should.exist(tx.txOutsVi)
      should.exist(tx.txOuts)
      should.exist(tx.nLockTime)
    })
  })

  describe('#toJson', function () {
    it('should recover all the basic parameters', function () {
      let json = tx.toJson()
      should.exist(json.version)
      should.exist(json.txInsVi)
      should.exist(json.txIns)
      should.exist(json.txOutsVi)
      should.exist(json.txOuts)
      should.exist(json.nLockTime)
    })
  })

  describe('#fromHex', function () {
    it('should recover from this known tx', function () {
      new Tx().fromHex(txhex).toHex().should.equal(txhex)
    })

    it('should recover from this known tx from the blockchain', function () {
      new Tx().fromHex(tx2hex).toHex().should.equal(tx2hex)
    })
  })

  describe('#fromBuffer', function () {
    it('should recover from this known tx', function () {
      new Tx().fromBuffer(txbuf).toBuffer().toString('hex').should.equal(txhex)
    })

    it('should recover from this known tx from the blockchain', function () {
      new Tx().fromBuffer(tx2buf).toBuffer().toString('hex').should.equal(tx2hex)
    })
  })

  describe('#fromBr', function () {
    it('should recover from this known tx', function () {
      new Tx().fromBr(new Br(txbuf)).toBuffer().toString('hex').should.equal(txhex)
    })
  })

  describe('#toHex', function () {
    it('should produce this known tx', function () {
      new Tx().fromHex(txhex).toHex().should.equal(txhex)
    })
  })

  describe('#toBuffer', function () {
    it('should produce this known tx', function () {
      new Tx().fromBuffer(txbuf).toBuffer().toString('hex').should.equal(txhex)
    })
  })

  describe('#toBw', function () {
    it('should produce this known tx', function () {
      new Tx().fromBuffer(txbuf).toBw().toBuffer().toString('hex').should.equal(txhex)
    })
  })

  describe('#sighash', function () {
    it('should hash this transaction', function () {
      tx.sighash(0, 0, new Script()).length.should.equal(32)
    })

    it('should return 1 for the SIGHASH_SINGLE bug', function () {
      let tx = Tx.fromBuffer(tx2buf)
      tx.txOuts.length = 1
      tx.txOutsVi = VarInt.fromNumber(1)
      tx.sighash(Sig.SIGHASH_SINGLE, 1, new Script()).toString('hex').should.equal('0000000000000000000000000000000000000000000000000000000000000001')
    })
  })

  describe('#asyncSighash', function () {
    it('should hash this transaction', function () {
      return asink(function * () {
        let hashBuf = yield tx.asyncSighash(0, 0, new Script())
        hashBuf.length.should.equal(32)
      }, this)
    })

    it('should return 1 for the SIGHASH_SINGLE bug', function () {
      return asink(function * () {
        let tx = Tx.fromBuffer(tx2buf)
        tx.txOuts.length = 1
        tx.txOutsVi = VarInt.fromNumber(1)
        let hashBuf = yield tx.asyncSighash(Sig.SIGHASH_SINGLE, 1, new Script())
        hashBuf.toString('hex').should.equal('0000000000000000000000000000000000000000000000000000000000000001')
      }, this)
    })
  })

  describe('#sign', function () {
    it('should return a signature', function () {
      let keyPair = new KeyPair().fromRandom()
      let sig1 = tx.sign(keyPair, Sig.SIGHASH_ALL, 0, new Script())
      should.exist(sig1)
      let sig2 = tx.sign(keyPair, Sig.SIGHASH_SINGLE, 0, new Script())
      let sig3 = tx.sign(keyPair, Sig.SIGHASH_ALL, 0, new Script().fromString('OP_RETURN'))
      sig1.toString(should.not.equal(sig2.toString()))
      sig1.toString(should.not.equal(sig3.toString()))
    })
  })

  describe('#asyncSign', function () {
    it('should return a signature', function () {
      return asink(function * () {
        let keyPair = new KeyPair().fromRandom()
        let sig1 = tx.sign(keyPair, Sig.SIGHASH_ALL, 0, new Script())
        let sig1b = yield tx.asyncSign(keyPair, Sig.SIGHASH_ALL, 0, new Script())
        let sig2 = tx.sign(keyPair, Sig.SIGHASH_SINGLE, 0, new Script())
        let sig2b = yield tx.asyncSign(keyPair, Sig.SIGHASH_SINGLE, 0, new Script())
        let sig3 = tx.sign(keyPair, Sig.SIGHASH_ALL, 0, new Script().fromString('OP_RETURN'))
        let sig3b = yield tx.asyncSign(keyPair, Sig.SIGHASH_ALL, 0, new Script().fromString('OP_RETURN'))
        sig1.toString().should.equal(sig1b.toString())
        sig2.toString().should.equal(sig2b.toString())
        sig3.toString().should.equal(sig3b.toString())
      }, this)
    })
  })

  describe('#verify', function () {
    it('should return a signature', function () {
      let keyPair = new KeyPair().fromRandom()
      let sig1 = tx.sign(keyPair, Sig.SIGHASH_ALL, 0, new Script())
      tx.verify(sig1, keyPair.pubKey, 0, new Script()).should.equal(true)
    })
  })

  describe('#asyncVerify', function () {
    it('should return a signature', function () {
      return asink(function * () {
        let keyPair = new KeyPair().fromRandom()
        let sig1 = tx.sign(keyPair, Sig.SIGHASH_ALL, 0, new Script())
        let verified = yield tx.asyncVerify(sig1, keyPair.pubKey, 0, new Script())
        verified.should.equal(true)
      }, this)
    })
  })

  describe('#hash', function () {
    it('should correctly calculate the hash of this known transaction', function () {
      let tx = Tx.fromBuffer(tx2buf)
      let txHashBuf = new Buffer(Array.apply([], new Buffer(tx2idhex, 'hex')).reverse())
      tx.hash().toString('hex').should.equal(txHashBuf.toString('hex'))
    })
  })

  describe('#asyncHash', function () {
    it('should correctly calculate the hash of this known transaction', function () {
      return asink(function * () {
        let tx = Tx.fromBuffer(tx2buf)
        let txHashBuf = new Buffer(Array.apply([], new Buffer(tx2idhex, 'hex')).reverse())
        let hashBuf = yield tx.asyncHash()
        hashBuf.toString('hex').should.equal(txHashBuf.toString('hex'))
      }, this)
    })
  })

  describe('#id', function () {
    it('should correctly calculate the id of this known transaction', function () {
      let tx = Tx.fromBuffer(tx2buf)
      tx.id().toString('hex').should.equal(tx2idhex)
    })
  })

  describe('#asyncId', function () {
    it('should correctly calculate the id of this known transaction', function () {
      return asink(function * () {
        let tx = Tx.fromBuffer(tx2buf)
        let idbuf = yield tx.id()
        idbuf.toString('hex').should.equal(tx2idhex)
      }, this)
    })
  })

  describe('#addTxIn', function () {
    it('should add an input', function () {
      let txIn = new TxIn()
      let tx = new Tx()
      tx.txInsVi.toNumber().should.equal(0)
      tx.addTxIn(txIn)
      tx.txInsVi.toNumber().should.equal(1)
      tx.txIns.length.should.equal(1)
    })
  })

  describe('#addTxOut', function () {
    it('should add an output', function () {
      let txOut = new TxOut()
      let tx = new Tx()
      tx.txOutsVi.toNumber().should.equal(0)
      tx.addTxOut(txOut)
      tx.txOutsVi.toNumber().should.equal(1)
      tx.txOuts.length.should.equal(1)
    })
  })

  describe('vectors: a 1mb transaction', function () {
    it('should find the correct id of this (valid, on the blockchain) 1 mb transaction', function () {
      let txidhex = largesttxvector.txidhex
      let txhex = largesttxvector.txhex
      let tx = Tx.fromHex(txhex)
      let txid = tx.id()
      txid.toString('hex').should.equal(txidhex)
    })
  })

  describe('vectors: sighash and serialization', function () {
    vectorsSighash.forEach(function (vector, i) {
      if (i === 0) {
        return
      }
      it('should pass sighash test vector ' + i, function () {
        let txbuf = new Buffer(vector[0], 'hex')
        let scriptbuf = new Buffer(vector[1], 'hex')
        let subScript = new Script().fromBuffer(scriptbuf)
        let nIn = vector[2]
        let nHashType = vector[3]
        let sighashBuf = new Buffer(vector[4], 'hex')
        let tx = Tx.fromBuffer(txbuf)

        // make sure transacion to/from buffer is isomorphic
        tx.toBuffer().toString('hex').should.equal(txbuf.toString('hex'))

        // sighash ought to be correct
        tx.sighash(nHashType, nIn, subScript).toString('hex').should.equal(sighashBuf.toString('hex'))
      })
    })

    let j = 0
    vectorsTxValid.forEach(function (vector, i) {
      if (vector.length === 1) {
        return
      }
      it('should correctly serialized/deserialize tx_valid test vector ' + j, function () {
        let txhex = vector[1]
        let txbuf = new Buffer(vector[1], 'hex')
        let tx = Tx.fromBuffer(txbuf)
        tx.toBuffer().toString('hex').should.equal(txhex)
      })
      j++
    })

    j = 0
    vectorsTxInvalid.forEach(function (vector, i) {
      if (vector.length === 1) {
        return
      }
      it('should correctly serialized/deserialize tx_invalid test vector ' + j, function () {
        let txhex = vector[1]
        let txbuf = new Buffer(vector[1], 'hex')
        let tx = Tx.fromBuffer(txbuf)
        tx.toBuffer().toString('hex').should.equal(txhex)
      })
      j++
    })
  })
})
