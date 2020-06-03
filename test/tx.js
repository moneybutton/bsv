/* global describe,it */
'use strict'
import { Bn } from '../lib/bn'
import { Br } from '../lib/br'
import { KeyPair } from '../lib/key-pair'
import { Script } from '../lib/script'
import { Sig } from '../lib/sig'
import { Tx } from '../lib/tx'
import { TxIn } from '../lib/tx-in'
import { TxOut } from '../lib/tx-out'
import { VarInt } from '../lib/var-int'
import { Interp } from '../lib/interp'
import should from 'should'
import sinon from 'sinon'

import vectorsBitcoindSighash from './vectors/bitcoind/sighash.json'
import vectorsBitcoinABCSighash from './vectors/bitcoin-abc/sighash.json'
import vectorsBitcoindTxValid from './vectors/bitcoind/tx_valid.json'
import vectorsBitcoindTxInvalid from './vectors/bitcoind/tx_invalid.json'
import largesttxvector from './vectors/largesttx.json'
import fixture from './vectors/bip69.json'

describe('Tx', function () {
  const txIn = new TxIn().fromBuffer(
    Buffer.from(
      '00000000000000000000000000000000000000000000000000000000000000000000000001ae00000000',
      'hex'
    )
  )
  const txOut = new TxOut().fromBuffer(Buffer.from('050000000000000001ae', 'hex'))
  const tx = new Tx().fromObject({
    versionBytesNum: 0,
    txInsVi: VarInt.fromNumber(1),
    txIns: [txIn],
    txOutsVi: VarInt.fromNumber(1),
    txOuts: [txOut],
    nLockTime: 0
  })
  const txhex =
    '000000000100000000000000000000000000000000000000000000000000000000000000000000000001ae0000000001050000000000000001ae00000000'
  const txbuf = Buffer.from(txhex, 'hex')

  const tx2idhex =
    '8c9aa966d35bfeaf031409e0001b90ccdafd8d859799eb945a3c515b8260bcf2'
  const tx2hex =
    '01000000029e8d016a7b0dc49a325922d05da1f916d1e4d4f0cb840c9727f3d22ce8d1363f000000008c493046022100e9318720bee5425378b4763b0427158b1051eec8b08442ce3fbfbf7b30202a44022100d4172239ebd701dae2fbaaccd9f038e7ca166707333427e3fb2a2865b19a7f27014104510c67f46d2cbb29476d1f0b794be4cb549ea59ab9cc1e731969a7bf5be95f7ad5e7f904e5ccf50a9dc1714df00fbeb794aa27aaff33260c1032d931a75c56f2ffffffffa3195e7a1ab665473ff717814f6881485dc8759bebe97e31c301ffe7933a656f020000008b48304502201c282f35f3e02a1f32d2089265ad4b561f07ea3c288169dedcf2f785e6065efa022100e8db18aadacb382eed13ee04708f00ba0a9c40e3b21cf91da8859d0f7d99e0c50141042b409e1ebbb43875be5edde9c452c82c01e3903d38fa4fd89f3887a52cb8aea9dc8aec7e2c9d5b3609c03eb16259a2537135a1bf0f9c5fbbcbdbaf83ba402442ffffffff02206b1000000000001976a91420bb5c3bfaef0231dc05190e7f1c8e22e098991e88acf0ca0100000000001976a9149e3e2d23973a04ec1b02be97c30ab9f2f27c3b2c88ac00000000'
  const tx2buf = Buffer.from(tx2hex, 'hex')

  it('should make a new transaction', function () {
    let tx = new Tx()
    should.exist(tx)
    tx = new Tx()
    should.exist(tx)

    Tx.fromBuffer(txbuf)
      .toBuffer()
      .toString('hex')
      .should.equal(txhex)

    // should set known defaults
    tx.versionBytesNum.should.equal(1)
    tx.txInsVi.toNumber().should.equal(0)
    tx.txIns.length.should.equal(0)
    tx.txOutsVi.toNumber().should.equal(0)
    tx.txOuts.length.should.equal(0)
    tx.nLockTime.should.equal(0)
  })

  describe('#constructor', function () {
    it('should set these known defaults', function () {
      const tx = new Tx()
      tx.versionBytesNum.should.equal(1)
      tx.txInsVi.toNumber().should.equal(0)
      tx.txIns.length.should.equal(0)
      tx.txOutsVi.toNumber().should.equal(0)
      tx.txOuts.length.should.equal(0)
      tx.nLockTime.should.equal(0)
    })
  })

  describe('#clone', function () {
    it('should clone a tx', function () {
      const tx1 = Tx.fromHex(tx2hex)
      const tx2 = tx1.clone()
      tx2.should.not.equal(tx1)
      tx2.toHex().should.equal(tx1.toHex())
    })
  })

  describe('#cloneByBuffer', function () {
    it('should clone a tx by buffer', function () {
      const tx1 = Tx.fromHex(tx2hex)
      tx1.toJSON = sinon.spy()
      const tx2 = tx1.cloneByBuffer()
      tx1.toJSON.calledOnce.should.equal(false)
      tx2.should.not.equal(tx1)
      tx2.toHex().should.equal(tx1.toHex())
    })
  })

  describe('#fromObject', function () {
    it('should set all the basic parameters', function () {
      const tx = new Tx().fromObject({
        versionBytesNum: 0,
        txInsVi: VarInt.fromNumber(1),
        txIns: [txIn],
        txOutsVi: VarInt.fromNumber(1),
        txOuts: [txOut],
        nLockTime: 0
      })
      should.exist(tx.versionBytesNum)
      should.exist(tx.txInsVi)
      should.exist(tx.txIns)
      should.exist(tx.txOutsVi)
      should.exist(tx.txOuts)
      should.exist(tx.nLockTime)
    })
  })

  describe('#fromJSON', function () {
    it('should set all the basic parameters', function () {
      const tx = new Tx().fromJSON({
        versionBytesNum: 0,
        txInsVi: VarInt.fromNumber(1).toJSON(),
        txIns: [txIn.toJSON()],
        txOutsVi: VarInt.fromNumber(1).toJSON(),
        txOuts: [txOut.toJSON()],
        nLockTime: 0
      })
      should.exist(tx.versionBytesNum)
      should.exist(tx.txInsVi)
      should.exist(tx.txIns)
      should.exist(tx.txOutsVi)
      should.exist(tx.txOuts)
      should.exist(tx.nLockTime)
    })
  })

  describe('#toJSON', function () {
    it('should recover all the basic parameters', function () {
      const json = tx.toJSON()
      should.exist(json.versionBytesNum)
      should.exist(json.txInsVi)
      should.exist(json.txIns)
      should.exist(json.txOutsVi)
      should.exist(json.txOuts)
      should.exist(json.nLockTime)
    })
  })

  describe('#fromHex', function () {
    it('should recover from this known tx', function () {
      new Tx()
        .fromHex(txhex)
        .toHex()
        .should.equal(txhex)
    })

    it('should recover from this known tx from the blockchain', function () {
      new Tx()
        .fromHex(tx2hex)
        .toHex()
        .should.equal(tx2hex)
    })
  })

  describe('#fromBuffer', function () {
    it('should recover from this known tx', function () {
      new Tx()
        .fromBuffer(txbuf)
        .toBuffer()
        .toString('hex')
        .should.equal(txhex)
    })

    it('should recover from this known tx from the blockchain', function () {
      new Tx()
        .fromBuffer(tx2buf)
        .toBuffer()
        .toString('hex')
        .should.equal(tx2hex)
    })
  })

  describe('#fromBr', function () {
    it('should recover from this known tx', function () {
      new Tx()
        .fromBr(new Br(txbuf))
        .toBuffer()
        .toString('hex')
        .should.equal(txhex)
    })
  })

  describe('#toHex', function () {
    it('should produce this known tx', function () {
      new Tx()
        .fromHex(txhex)
        .toHex()
        .should.equal(txhex)
    })
  })

  describe('#toBuffer', function () {
    it('should produce this known tx', function () {
      new Tx()
        .fromBuffer(txbuf)
        .toBuffer()
        .toString('hex')
        .should.equal(txhex)
    })
  })

  describe('#toBw', function () {
    it('should produce this known tx', function () {
      new Tx()
        .fromBuffer(txbuf)
        .toBw()
        .toBuffer()
        .toString('hex')
        .should.equal(txhex)
    })
  })

  describe('#sighash', function () {
    it('should hash this transaction', function () {
      tx.sighash(0, 0, new Script()).length.should.equal(32)
    })

    it('should return 1 for the SIGHASH_SINGLE bug', function () {
      const tx = Tx.fromBuffer(tx2buf)
      tx.txOuts.length = 1
      tx.txOutsVi = VarInt.fromNumber(1)
      tx
        .sighash(Sig.SIGHASH_SINGLE, 1, new Script())
        .toString('hex')
        .should.equal(
          '0000000000000000000000000000000000000000000000000000000000000001'
        )
    })
  })

  describe('#asyncSighash', function () {
    it('should hash this transaction', async function () {
      const hashBuf = await tx.asyncSighash(0, 0, new Script())
      hashBuf.length.should.equal(32)
    })

    it('should return 1 for the SIGHASH_SINGLE bug', async function () {
      const tx = Tx.fromBuffer(tx2buf)
      tx.txOuts.length = 1
      tx.txOutsVi = VarInt.fromNumber(1)
      const hashBuf = await tx.asyncSighash(Sig.SIGHASH_SINGLE, 1, new Script())
      hashBuf
        .toString('hex')
        .should.equal(
          '0000000000000000000000000000000000000000000000000000000000000001'
        )
    })
  })

  describe('#sign', function () {
    it('should return a signature', function () {
      const keyPair = new KeyPair().fromRandom()
      const sig1 = tx.sign(keyPair, Sig.SIGHASH_ALL, 0, new Script())
      should.exist(sig1)
      const sig2 = tx.sign(keyPair, Sig.SIGHASH_SINGLE, 0, new Script())
      const sig3 = tx.sign(
        keyPair,
        Sig.SIGHASH_ALL,
        0,
        new Script().fromString('OP_RETURN')
      )
      sig1.toString().should.not.equal(sig2.toString())
      sig1.toString().should.not.equal(sig3.toString())
    })
  })

  describe('#asyncSign', function () {
    it('should return a signature', async function () {
      const keyPair = new KeyPair().fromRandom()
      const sig1 = tx.sign(keyPair, Sig.SIGHASH_ALL, 0, new Script())
      const sig1b = await tx.asyncSign(keyPair, Sig.SIGHASH_ALL, 0, new Script())
      const sig2 = tx.sign(keyPair, Sig.SIGHASH_SINGLE, 0, new Script())
      const sig2b = await tx.asyncSign(
        keyPair,
        Sig.SIGHASH_SINGLE,
        0,
        new Script()
      )
      const sig3 = tx.sign(
        keyPair,
        Sig.SIGHASH_ALL,
        0,
        new Script().fromString('OP_RETURN')
      )
      const sig3b = await tx.asyncSign(
        keyPair,
        Sig.SIGHASH_ALL,
        0,
        new Script().fromString('OP_RETURN')
      )
      sig1.toString().should.equal(sig1b.toString())
      sig2.toString().should.equal(sig2b.toString())
      sig3.toString().should.equal(sig3b.toString())
    })
  })

  describe('#verify', function () {
    it('should return a signature', function () {
      const keyPair = new KeyPair().fromRandom()
      const sig1 = tx.sign(keyPair, Sig.SIGHASH_ALL, 0, new Script())
      tx.verify(sig1, keyPair.pubKey, 0, new Script()).should.equal(true)
    })
  })

  describe('#asyncVerify', function () {
    it('should return a signature', async function () {
      const keyPair = new KeyPair().fromRandom()
      const sig1 = tx.sign(keyPair, Sig.SIGHASH_ALL, 0, new Script())
      const verified = await tx.asyncVerify(sig1, keyPair.pubKey, 0, new Script())
      verified.should.equal(true)
    })
  })

  describe('#hash', function () {
    it('should correctly calculate the hash of this known transaction', function () {
      const tx = Tx.fromBuffer(tx2buf)
      const txHashBuf = Buffer.from(
        Array.apply([], Buffer.from(tx2idhex, 'hex')).reverse()
      )
      tx
        .hash()
        .toString('hex')
        .should.equal(txHashBuf.toString('hex'))
    })
  })

  describe('#asyncHash', function () {
    it('should correctly calculate the hash of this known transaction', async function () {
      const tx = Tx.fromBuffer(tx2buf)
      const txHashBuf = Buffer.from(
        Array.apply([], Buffer.from(tx2idhex, 'hex')).reverse()
      )
      const hashBuf = await tx.asyncHash()
      hashBuf.toString('hex').should.equal(txHashBuf.toString('hex'))
    })
  })

  describe('#id', function () {
    it('should correctly calculate the id of this known transaction', function () {
      const tx = Tx.fromBuffer(tx2buf)
      tx
        .id()
        .should.equal(tx2idhex)
    })
  })

  describe('#asyncId', function () {
    it('should correctly calculate the id of this known transaction', async function () {
      const tx = Tx.fromBuffer(tx2buf)
      const idbuf = await tx.asyncId()
      idbuf.should.equal(tx2idhex)
    })
  })

  describe('#addTxIn', function () {
    it('should add an input', function () {
      const txIn = new TxIn()
      const tx = new Tx()
      tx.txInsVi.toNumber().should.equal(0)
      tx.addTxIn(txIn)
      tx.txInsVi.toNumber().should.equal(1)
      tx.txIns.length.should.equal(1)
    })
  })

  describe('#addTxOut', function () {
    it('should add an output', function () {
      const txOut = new TxOut()
      const tx = new Tx()
      tx.txOutsVi.toNumber().should.equal(0)
      tx.addTxOut(txOut)
      tx.txOutsVi.toNumber().should.equal(1)
      tx.txOuts.length.should.equal(1)
    })
  })

  describe('bectors: bip69 (from bitcoinjs)', function () {
    // returns index-based order of sorted against original
    function getIndexOrder (original, sorted) {
      return sorted.map((value) => {
        return original.indexOf(value)
      })
    }

    fixture.inputs.forEach((inputSet) => {
      it(inputSet.description, () => {
        const tx = new Tx()
        const txIns = inputSet.inputs.map((input) => {
          const txHashBuf = Buffer.from(input.txId, 'hex').reverse()
          const txOutNum = input.vout
          const script = new Script()
          const txIn = TxIn.fromProperties(txHashBuf, txOutNum, script)
          return txIn
        })
        tx.txIns = [...txIns]
        tx.sort()
        getIndexOrder(txIns, tx.txIns).toString().should.equal(inputSet.expected.toString())
      })
    })

    fixture.outputs.forEach((outputSet) => {
      it(outputSet.description, () => {
        const tx = new Tx()
        const txOuts = outputSet.outputs.map(function (output) {
          const txOut = TxOut.fromProperties(new Bn(output.value), Script.fromAsmString(output.script))
          return txOut
        })
        tx.txOuts = [...txOuts]
        tx.sort()
        getIndexOrder(txOuts, tx.txOuts).toString().should.equal(outputSet.expected.toString())
      })
    })
  })

  describe('vectors: a 1mb transaction', function () {
    it('should find the correct id of this (valid, on the blockchain) 1 mb transaction', function () {
      const txidhex = largesttxvector.txidhex
      const txhex = largesttxvector.txhex
      const tx = Tx.fromHex(txhex)
      const txid = tx.id()
      txid.should.equal(txidhex)
    })
  })

  describe('vectors: sighash and serialization', function () {
    vectorsBitcoindSighash.forEach(function (vector, i) {
      if (i === 0) {
        return
      }
      it('should pass bitcoind sighash test vector ' + i, function () {
        const txbuf = Buffer.from(vector[0], 'hex')
        const scriptbuf = Buffer.from(vector[1], 'hex')
        const subScript = new Script().fromBuffer(scriptbuf)
        const nIn = vector[2]
        const nHashType = vector[3]
        const sighashBuf = Buffer.from(vector[4], 'hex')
        const tx = Tx.fromBuffer(txbuf)

        // make sure transacion to/from buffer is isomorphic
        tx
          .toHex()
          .should.equal(txbuf.toString('hex'))

        // sighash ought to be correct
        tx
          .sighash(nHashType, nIn, subScript)
          .toString('hex')
          .should.equal(sighashBuf.toString('hex'))
      })
    })

    vectorsBitcoinABCSighash.forEach(function (vector, i) {
      if (i === 0) {
        return
      }
      it('should pass bitcoin-abc sighash test vector ' + i, function () {
        if (vector[0] === 'Test vectors for SIGHASH_FORKID') {
          return
        }
        const txbuf = Buffer.from(vector[0], 'hex')
        const scriptbuf = Buffer.from(vector[1], 'hex')
        const subScript = new Script().fromBuffer(scriptbuf)
        const nIn = vector[2]
        const nHashType = vector[3]
        const sighashBuf = Buffer.from(vector[4], 'hex')
        const tx = Tx.fromBuffer(txbuf)

        // make sure transacion to/from buffer is isomorphic
        tx
          .toBuffer()
          .toString('hex')
          .should.equal(txbuf.toString('hex'))

        // sighash ought to be correct
        const valueBn = new Bn(0)
        let flags = 0
        if (nHashType & Sig.SIGHASH_FORKID) {
          flags = Interp.SCRIPT_ENABLE_SIGHASH_FORKID
        }
        tx
          .sighash(nHashType, nIn, subScript, valueBn, flags)
          .toString('hex')
          .should.equal(sighashBuf.toString('hex'))
      })
    })

    let j = 0
    vectorsBitcoindTxValid.forEach(function (vector, i) {
      if (vector.length === 1) {
        return
      }
      it(
        'should correctly serialized/deserialize tx_valid test vector ' + j,
        function () {
          const txhex = vector[1]
          const txbuf = Buffer.from(vector[1], 'hex')
          const tx = Tx.fromBuffer(txbuf)
          tx
            .toBuffer()
            .toString('hex')
            .should.equal(txhex)
        }
      )
      j++
    })

    j = 0
    vectorsBitcoindTxInvalid.forEach(function (vector, i) {
      if (vector.length === 1) {
        return
      }
      it(
        'should correctly serialized/deserialize tx_invalid test vector ' + j,
        function () {
          const txhex = vector[1]
          const txbuf = Buffer.from(vector[1], 'hex')
          const tx = Tx.fromBuffer(txbuf)
          tx
            .toBuffer()
            .toString('hex')
            .should.equal(txhex)
        }
      )
      j++
    })
  })
})
