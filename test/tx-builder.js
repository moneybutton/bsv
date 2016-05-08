/* global describe,it,before */
'use strict'
let Address = require('../lib/address')
let Bn = require('../lib/bn')
let Interp = require('../lib/interp')
let KeyPair = require('../lib/key-pair')
let PrivKey = require('../lib/priv-key')
let PubKey = require('../lib/pub-key')
let Script = require('../lib/script')
let Sig = require('../lib/sig')
let Tx = require('../lib/tx')
let TxBuilder = require('../lib/tx-builder')
let TxOut = require('../lib/tx-out')
let TxOutMap = require('../lib/tx-out-map')
let TxVerifier = require('../lib/tx-verifier')
let asink = require('asink')
let should = require('chai').should()
let sinon = require('sinon')

describe('TxBuilder', function () {
  it('should make a new txbuilder', function () {
    let txb = new TxBuilder()
    ;(txb instanceof TxBuilder).should.equal(true)
    should.exist(txb.tx)
    txb = new TxBuilder()
    ;(txb instanceof TxBuilder).should.equal(true)
    should.exist(txb.tx)
    txb = new TxBuilder({
      tx: new Tx()
    })
    should.exist(txb.tx)
  })

  function prepareTxBuilder () {
    let txb = new TxBuilder()

    // make change address
    let privKey = new PrivKey().fromBn(new Bn(1))
    let keyPair = new KeyPair().fromPrivKey(privKey)
    let changeaddr = new Address().fromPubKey(keyPair.pubKey)

    // make addresses to send from
    let privKey1 = new PrivKey().fromBn(new Bn(2))
    let keyPair1 = new KeyPair().fromPrivKey(privKey1)
    let addr1 = new Address().fromPubKey(keyPair1.pubKey)

    let privKey2 = new PrivKey().fromBn(new Bn(3))
    let keyPair2 = new KeyPair().fromPrivKey(privKey2)
    let addr2 = new Address().fromPubKey(keyPair2.pubKey)

    let privKey3 = new PrivKey().fromBn(new Bn(3))
    let keyPair3 = new KeyPair().fromPrivKey(privKey3)
    let addr3 = new Address().fromPubKey(keyPair3.pubKey)

    // make addresses to send to
    let saddr1 = addr1
    let saddr2 = new Address().fromRedeemScript(new Script().fromString('OP_RETURN')) // fake, unredeemable p2sh address

    // txOuts that we are spending

    // pubKeyHash out
    let scriptout1 = new Script().fromString('OP_DUP OP_HASH160 20 0x' + addr1.hashBuf.toString('hex') + ' OP_EQUALVERIFY OP_CHECKSIG')

    // pubKeyHash out
    let scriptout2 = new Script().fromString('OP_DUP OP_HASH160 20 0x' + addr2.hashBuf.toString('hex') + ' OP_EQUALVERIFY OP_CHECKSIG')

    // p2sh 2-of-2 multisig out
    let redeemScript3 = new Script().fromPubKeys(2, [keyPair1.pubKey, keyPair2.pubKey])
    let address3 = new Address().fromRedeemScript(redeemScript3)
    let scriptout3 = address3.toScript()

    // p2sh 2-of-3 multisig out
    let redeemScript4 = new Script().fromPubKeys(2, [keyPair1.pubKey, keyPair2.pubKey, keyPair3.pubKey])
    let address4 = new Address().fromRedeemScript(redeemScript4)
    let scriptout4 = address4.toScript()

    let txOut1 = TxOut.fromProperties(new Bn(1e8), scriptout1)
    let txOut2 = TxOut.fromProperties(new Bn(1e8), scriptout2)
    let txOut3 = TxOut.fromProperties(new Bn(1e8), scriptout3)
    let txOut4 = TxOut.fromProperties(new Bn(1e8), scriptout4)
    // total balance: 4e8

    let txHashBuf = new Buffer(32)
    txHashBuf.fill(0)
    let txOutNum1 = 0
    let txOutNum2 = 1
    let txOutNum3 = 2
    let txOutNum4 = 3

    txb.setFeePerKbNum(0.0001e8)
    txb.setChangeAddress(changeaddr)
    txb.inputFromPubKeyHash(txHashBuf, txOutNum1, txOut1, keyPair1.pubKey)
    txb.inputFromPubKeyHash(txHashBuf, txOutNum2, txOut2, keyPair2.pubKey)
    txb.inputFromScriptHashMultiSig(txHashBuf, txOutNum3, txOut3, redeemScript3)
    txb.inputFromScriptHashMultiSig(txHashBuf, txOutNum4, txOut4, redeemScript4)
    txb.outputToAddress(new Bn(2e8), saddr1) // pubKeyHash address
    txb.outputToAddress(new Bn(1e8), saddr2) // p2sh address
    // total sending: 2e8 (plus fee)
    // txb.randomizeInputs()
    // txb.randomizeOutputs()

    return {
      txb,
      keyPair1,
      keyPair2,
      keyPair3,
      addr1,
      addr2,
      addr3,
      saddr1,
      saddr2,
      changeaddr,
      txOut1,
      txOut2,
      txOut3,
      txOut4
    }
  }

  function prepareAndBuildTxBuilder () {
    let obj = prepareTxBuilder()
    obj.txb.build()
    return obj
  }

  describe('#toJson', function () {
    it('should convert this txb to JSON', function () {
      let obj = prepareAndBuildTxBuilder()
      let txb = obj.txb
      let json = txb.toJson()
      should.exist(json.tx)
      should.exist(json.txIns)
      should.exist(json.txIns[0])
      should.exist(json.txOuts)
      should.exist(json.uTxOutMap)
      should.exist(json.txOuts[0])
      should.exist(json.changeScript)
      should.exist(json.feePerKbNum)
    })
  })

  describe('#fromJson', function () {
    it('should convert to/from json isomorphically', function () {
      let obj = prepareAndBuildTxBuilder()
      let txb = obj.txb
      let json = txb.toJson()
      let txb2 = new TxBuilder().fromJson(json)
      let json2 = txb2.toJson()
      json2.tx.should.equal(json.tx)
      json2.txIns[0].should.equal(json.txIns[0])
      json2.txOuts[0].should.equal(json.txOuts[0])
      JSON.stringify(json2.uTxOutMap).should.equal(JSON.stringify(json.uTxOutMap))
      json2.changeScript.should.equal(json.changeScript)
      json2.feePerKbNum.should.equal(json.feePerKbNum)
    })
  })

  describe('#setFeePerKbNum', function () {
    it('should set the feePerKbNum', function () {
      let obj = prepareTxBuilder()
      let txb = obj.txb
      txb.setFeePerKbNum(1000)
      txb.feePerKbNum.should.equal(1000)
    })
  })

  describe('#setChangeAddress', function () {
    it('should set the change address', function () {
      let obj = prepareTxBuilder()
      let txb = obj.txb
      let privKey = new PrivKey().fromRandom()
      let address = new Address().fromPrivKey(privKey)
      txb.setChangeAddress(address)
      txb.changeScript.toString().should.equal(address.toScript().toString())
    })
  })

  describe('#setChangeScript', function () {
    it('should set the changeScript', function () {
      let obj = prepareTxBuilder()
      let txb = obj.txb
      let privKey = new PrivKey().fromRandom()
      let address = new Address().fromPrivKey(privKey)
      txb.setChangeScript(address.toScript())
      txb.changeScript.toString().should.equal(address.toScript().toString())
    })
  })

  describe('#setNLocktime', function () {
    it('should set the nLockTime', function () {
      let obj = prepareTxBuilder()
      let txb = obj.txb
      txb.setNLocktime(1)
      txb.build()
      txb.tx.nLockTime.should.equal(1)
    })
  })

  describe('#setVersion', function () {
    it('should set the versionBytesNum', function () {
      let obj = prepareTxBuilder()
      let txb = obj.txb
      txb.setVersion(2)
      txb.build()
      txb.tx.versionBytesNum.should.equal(2)
    })
  })

  describe('#importPartiallySignedTx', function () {
    it('should set tx', function () {
      let tx = new Tx()
      let txb = new TxBuilder().importPartiallySignedTx(tx)
      should.exist(txb.tx)
    })

    it('should set tx and uTxOutMap', function () {
      let tx = new Tx()
      let uTxOutMap = new TxOutMap()
      let txb = new TxBuilder().importPartiallySignedTx(tx, uTxOutMap)
      should.exist(txb.tx)
      should.exist(txb.uTxOutMap)
    })
  })

  describe('#outputToAddress', function () {
    it('should add a scriptHash address', function () {
      let hashBuf = new Buffer(20)
      hashBuf.fill(0)
      let address = new Address().fromRedeemScript(new Script().fromScriptHash(hashBuf))
      let txb = new TxBuilder()
      txb.outputToAddress(new Bn(0), address)
      txb.txOuts.length.should.equal(1)
    })

    it('should add a pubKeyHash address', function () {
      let pubKey = new PubKey().fromPrivKey(new PrivKey().fromRandom())
      let address = new Address().fromPubKey(pubKey)
      let txb = new TxBuilder()
      txb.outputToAddress(new Bn(0), address)
      txb.txOuts.length.should.equal(1)
    })
  })

  describe('#outputToScript', function () {
    it('should add an OP_RETURN output', function () {
      let script = new Script().fromString('OP_RETURN')
      let txb = new TxBuilder()
      txb.outputToScript(new Bn(0), script)
      txb.txOuts.length.should.equal(1)
    })
  })

  describe('@allSigsPresent', function () {
    it('should know all sigs are or are not present these scripts', function () {
      let script
      script = new Script().fromString('OP_0 71 0x304402204c99f293ca4d84f01e8f319e93978866877c948628cb4d4ff5ccdf42ae8434cc02206516aa37dcd9f50ddb2f7484aeaef3c0fbab77db60eeafd5ad91b0ba54b715e901 72 0x3045022100ff53e3f8ee64eb0f816a85a244d5e3bc20e7ade814e4377be5279a12130c8414022068e00c79272539d03357d4d589bf4c0c7a517023aaa2abe3f341c26ca9077d0801 OP_PUSHDATA1 105 0x522102c6047f9441ed7d6d3045406e95c07cd85c778e4b8cef3ca7abac09b95c709ee52102f9308a019258c31049344f85f89d5229b531c845836f99b08601f113bce036f92102f9308a019258c31049344f85f89d5229b531c845836f99b08601f113bce036f953ae')
      TxBuilder.allSigsPresent(2, script).should.equal(true)
      script = new Script().fromString('OP_0 71 0x304402204c99f293ca4d84f01e8f319e93978866877c948628cb4d4ff5ccdf42ae8434cc02206516aa37dcd9f50ddb2f7484aeaef3c0fbab77db60eeafd5ad91b0ba54b715e901 71 0x304402204c99f293ca4d84f01e8f319e93978866877c948628cb4d4ff5ccdf42ae8434cc02206516aa37dcd9f50ddb2f7484aeaef3c0fbab77db60eeafd5ad91b0ba54b715e901 72 0x3045022100ff53e3f8ee64eb0f816a85a244d5e3bc20e7ade814e4377be5279a12130c8414022068e00c79272539d03357d4d589bf4c0c7a517023aaa2abe3f341c26ca9077d0801 OP_PUSHDATA1 105 0x522102c6047f9441ed7d6d3045406e95c07cd85c778e4b8cef3ca7abac09b95c709ee52102f9308a019258c31049344f85f89d5229b531c845836f99b08601f113bce036f92102f9308a019258c31049344f85f89d5229b531c845836f99b08601f113bce036f953ae')
      TxBuilder.allSigsPresent(3, script).should.equal(true)
      script = new Script().fromString('OP_0 OP_0 71 0x304402204c99f293ca4d84f01e8f319e93978866877c948628cb4d4ff5ccdf42ae8434cc02206516aa37dcd9f50ddb2f7484aeaef3c0fbab77db60eeafd5ad91b0ba54b715e901 72 0x3045022100ff53e3f8ee64eb0f816a85a244d5e3bc20e7ade814e4377be5279a12130c8414022068e00c79272539d03357d4d589bf4c0c7a517023aaa2abe3f341c26ca9077d0801 OP_PUSHDATA1 105 0x522102c6047f9441ed7d6d3045406e95c07cd85c778e4b8cef3ca7abac09b95c709ee52102f9308a019258c31049344f85f89d5229b531c845836f99b08601f113bce036f92102f9308a019258c31049344f85f89d5229b531c845836f99b08601f113bce036f953ae')
      TxBuilder.allSigsPresent(3, script).should.equal(false)
    })
  })

  describe('@removeBlankSigs', function () {
    it('should know all sigs are or are not present these scripts', function () {
      let script
      script = new Script().fromString('OP_0 OP_0 71 0x304402204c99f293ca4d84f01e8f319e93978866877c948628cb4d4ff5ccdf42ae8434cc02206516aa37dcd9f50ddb2f7484aeaef3c0fbab77db60eeafd5ad91b0ba54b715e901 72 0x3045022100ff53e3f8ee64eb0f816a85a244d5e3bc20e7ade814e4377be5279a12130c8414022068e00c79272539d03357d4d589bf4c0c7a517023aaa2abe3f341c26ca9077d0801 OP_PUSHDATA1 105 0x522102c6047f9441ed7d6d3045406e95c07cd85c778e4b8cef3ca7abac09b95c709ee52102f9308a019258c31049344f85f89d5229b531c845836f99b08601f113bce036f92102f9308a019258c31049344f85f89d5229b531c845836f99b08601f113bce036f953ae')
      TxBuilder.allSigsPresent(3, script).should.equal(false)
      script = TxBuilder.removeBlankSigs(script)
      TxBuilder.allSigsPresent(2, script).should.equal(true)
    })
  })

  describe('#inputFromScript', function () {
    it('should add an input from a script', function () {
      let keyPair = new KeyPair().fromRandom()
      let address = new Address().fromPubKey(keyPair.pubKey)
      let txOut = TxOut.fromProperties(new Bn(1000), new Script().fromPubKeyHash(address.hashBuf))
      let script = new Script().fromString('OP_RETURN')
      let txHashBuf = new Buffer(32)
      txHashBuf.fill(0)
      let txOutNum = 0
      let txbuilder = new TxBuilder().inputFromScript(txHashBuf, txOutNum, txOut, script)
      txbuilder.txIns.length.should.equal(1)
    })

    it('should add an input from a script and set nSequence', function () {
      let keyPair = new KeyPair().fromRandom()
      let address = new Address().fromPubKey(keyPair.pubKey)
      let txOut = TxOut.fromProperties(new Bn(1000), new Script().fromPubKeyHash(address.hashBuf))
      let script = new Script().fromString('OP_RETURN')
      let txHashBuf = new Buffer(32)
      txHashBuf.fill(0)
      let txOutNum = 0
      let txbuilder = new TxBuilder().inputFromScript(txHashBuf, txOutNum, txOut, script, 0xf0f0f0f0)
      txbuilder.txIns.length.should.equal(1)
      txbuilder.txIns[0].nSequence.should.equal(0xf0f0f0f0)
    })
  })

  describe('#inputFromPubKeyHash', function () {
    it('should add an input from a pubKeyHash output', function () {
      let keyPair = new KeyPair().fromRandom()
      let address = new Address().fromPubKey(keyPair.pubKey)
      let txOut = TxOut.fromProperties(new Bn(1000), new Script().fromPubKeyHash(address.hashBuf))
      let txHashBuf = new Buffer(32)
      txHashBuf.fill(0)
      let txOutNum = 0
      let txbuilder = new TxBuilder().inputFromPubKeyHash(txHashBuf, txOutNum, txOut, keyPair.pubKey)
      Buffer.compare(txbuilder.txIns[0].script.chunks[1].buf, keyPair.pubKey.toBuffer()).should.equal(0)
    })

    it('should add an input from a pubKeyHash output and set nSequence', function () {
      let keyPair = new KeyPair().fromRandom()
      let address = new Address().fromPubKey(keyPair.pubKey)
      let txOut = TxOut.fromProperties(new Bn(1000), new Script().fromPubKeyHash(address.hashBuf))
      let txHashBuf = new Buffer(32)
      txHashBuf.fill(0)
      let txOutNum = 0
      let txbuilder = new TxBuilder().inputFromPubKeyHash(txHashBuf, txOutNum, txOut, keyPair.pubKey, 0xf0f0f0f0)
      Buffer.compare(txbuilder.txIns[0].script.chunks[1].buf, keyPair.pubKey.toBuffer()).should.equal(0)
      txbuilder.txIns[0].nSequence.should.equal(0xf0f0f0f0)
    })
  })

  describe('#inputFromScriptHashMultiSig', function () {
    it('should add an input from a scriptHash output', function () {
      let keyPair1 = new KeyPair().fromRandom()
      let keyPair2 = new KeyPair().fromRandom()
      let script = new Script().fromPubKeys(2, [keyPair1.pubKey, keyPair2.pubKey])
      let address = new Address().fromRedeemScript(script)
      let txOut = TxOut.fromProperties(new Bn(1000), new Script().fromScriptHash(address.hashBuf))
      let txHashBuf = new Buffer(32)
      txHashBuf.fill(0)
      let txOutNum = 0
      let txbuilder = new TxBuilder().inputFromScriptHashMultiSig(txHashBuf, txOutNum, txOut, script)
      Buffer.compare(txbuilder.txIns[0].script.chunks[3].buf, script.toBuffer()).should.equal(0)
    })

    it('should add an input from a scriptHash output and set nSequence', function () {
      let keyPair1 = new KeyPair().fromRandom()
      let keyPair2 = new KeyPair().fromRandom()
      let script = new Script().fromPubKeys(2, [keyPair1.pubKey, keyPair2.pubKey])
      let address = new Address().fromRedeemScript(script)
      let txOut = TxOut.fromProperties(new Bn(1000), new Script().fromScriptHash(address.hashBuf))
      let txHashBuf = new Buffer(32)
      txHashBuf.fill(0)
      let txOutNum = 0
      let txbuilder = new TxBuilder().inputFromScriptHashMultiSig(txHashBuf, txOutNum, txOut, script, 0xf0f0f0f0)
      Buffer.compare(txbuilder.txIns[0].script.chunks[3].buf, script.toBuffer()).should.equal(0)
      txbuilder.txIns[0].nSequence.should.equal(0xf0f0f0f0)
    })
  })

  describe('#getSig', function () {
    let txb, keyPair1, txOut1

    before(function () {
      let obj = prepareAndBuildTxBuilder()
      txb = obj.txb
      keyPair1 = obj.keyPair1
      txOut1 = obj.txOut1
    })

    it('should sign and verify synchronously', function () {
      let sig = txb.getSig(keyPair1, Sig.SIGHASH_ALL, 0, keyPair1, txOut1)
      ;(sig instanceof Sig).should.equal(true)
    })
  })

  describe('#sign', function () {
    let txb, keyPair1, keyPair2, saddr1, changeaddr, txOut1

    before(function () {
      let obj = prepareAndBuildTxBuilder()
      txb = obj.txb
      keyPair1 = obj.keyPair1
      keyPair2 = obj.keyPair2
      saddr1 = obj.saddr1
      changeaddr = obj.changeaddr
      txOut1 = obj.txOut1
    })

    it('should sign and verify synchronously', function () {
      txb.sign(0, keyPair1)
      txb.sign(1, keyPair2)

      // transaction not fully signed yet, so should be invalid
      TxVerifier.verify(txb.tx, txb.uTxOutMap, Interp.SCRIPT_VERIFY_P2SH).should.equal(false)

      txb.sign(2, keyPair1) // 2-of-2 needs 2 sigs
      txb.sign(2, keyPair2) // 2-of-2 needs 2 sigs

      txb.sign(3, keyPair1) // 2-of-3 needs 2 sigs
      txb.sign(3, keyPair2) // 2-of-3 needs 2 sigs

      txb.tx.txOuts[0].script.chunks[2].buf.toString('hex').should.equal(saddr1.hashBuf.toString('hex'))
      txb.tx.txOuts[0].valueBn.eq(2e8).should.equal(true)
      txb.tx.txOuts[1].valueBn.eq(1e8).should.equal(true)
      txb.tx.txOuts[2].valueBn.gt(546).should.equal(true)
      txb.tx.txOuts[2].valueBn.eq(1e8 - 0.0001e8).should.equal(true)
      txb.tx.txOuts[2].script.chunks[2].buf.toString('hex').should.equal(changeaddr.hashBuf.toString('hex'))

      TxVerifier.verify(txb.tx, txb.uTxOutMap, Interp.SCRIPT_VERIFY_P2SH).should.equal(true)
    })

    it('should pass in txOut', function () {
      txb.txOutmap = sinon.spy()
      txb.uTxOutMap = {
        get: sinon.spy()
      }
      txb.sign(0, keyPair1, txOut1)
      txb.uTxOutMap.get.calledOnce.should.equal(false)
    })
  })

  describe('#asyncGetSig', function () {
    let txb, keyPair1, txOut1

    before(function () {
      let obj = prepareAndBuildTxBuilder()
      txb = obj.txb
      keyPair1 = obj.keyPair1
      txOut1 = obj.txOut1
    })

    it('should sign and verify synchronously', function () {
      return asink(function * () {
        let sig = yield txb.asyncGetSig(keyPair1, Sig.SIGHASH_ALL, 0, keyPair1, txOut1)
        ;(sig instanceof Sig).should.equal(true)
      }, this)
    })
  })

  describe('#asyncSign', function () {
    let txb, keyPair1, keyPair2, saddr1, changeaddr, txOut1

    before(function () {
      let obj = prepareAndBuildTxBuilder()
      txb = obj.txb
      keyPair1 = obj.keyPair1
      keyPair2 = obj.keyPair2
      saddr1 = obj.saddr1
      changeaddr = obj.changeaddr
      txOut1 = obj.txOut1
    })

    it('should sign and verify asynchronously', function () {
      return asink(function * () {
        // or:
        yield txb.asyncSign(0, keyPair1)
        yield txb.asyncSign(1, keyPair2)

        // transaction not fully signed yet, so should be invalid
        TxVerifier.verify(txb.tx, txb.uTxOutMap, Interp.SCRIPT_VERIFY_P2SH).should.equal(false)

        yield txb.asyncSign(2, keyPair1) // 2-of-2 needs 2 sigs
        yield txb.asyncSign(2, keyPair2) // 2-of-2 needs 2 sigs

        yield txb.asyncSign(3, keyPair1) // 2-of-3 needs 2 sigs
        yield txb.asyncSign(3, keyPair2) // 2-of-3 needs 2 sigs

        txb.tx.txOuts[0].script.chunks[2].buf.toString('hex').should.equal(saddr1.hashBuf.toString('hex'))
        txb.tx.txOuts[0].valueBn.eq(2e8).should.equal(true)
        txb.tx.txOuts[1].valueBn.eq(1e8).should.equal(true)
        txb.tx.txOuts[2].valueBn.gt(546).should.equal(true)
        txb.tx.txOuts[2].valueBn.eq(1e8 - 0.0001e8).should.equal(true)
        txb.tx.txOuts[2].script.chunks[2].buf.toString('hex').should.equal(changeaddr.hashBuf.toString('hex'))

        TxVerifier.verify(txb.tx, txb.uTxOutMap, Interp.SCRIPT_VERIFY_P2SH).should.equal(true)
      }, this)
    })

    it('should pass in txOut', function () {
      return asink(function * () {
        txb.txOutmap = sinon.spy()
        txb.uTxOutMap = {
          get: sinon.spy()
        }
        yield txb.asyncSign(0, keyPair1, txOut1)
        txb.uTxOutMap.get.calledOnce.should.equal(false)
      }, this)
    })
  })
})
