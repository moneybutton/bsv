/* global describe,it,before */
'use strict'
import { Address } from '../lib/address'
import { Bn } from '../lib/bn'
import { Interp } from '../lib/interp'
import { KeyPair } from '../lib/key-pair'
import { PrivKey } from '../lib/priv-key'
import { PubKey } from '../lib/pub-key'
import { Script } from '../lib/script'
import { Sig } from '../lib/sig'
import { Tx } from '../lib/tx'
import { TxBuilder } from '../lib/tx-builder'
import { TxOut } from '../lib/tx-out'
import { TxOutMap } from '../lib/tx-out-map'
import { TxVerifier } from '../lib/tx-verifier'
import should from 'should'
import sinon from 'sinon'

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
    const txb = new TxBuilder()

    // make change address
    const privKey = new PrivKey().fromBn(new Bn(1))
    const keyPair = new KeyPair().fromPrivKey(privKey)
    const changeaddr = new Address().fromPubKey(keyPair.pubKey)

    // make addresses to send from
    const privKey1 = new PrivKey().fromBn(new Bn(2))
    const keyPair1 = new KeyPair().fromPrivKey(privKey1)
    const addr1 = new Address().fromPubKey(keyPair1.pubKey)

    const privKey2 = new PrivKey().fromBn(new Bn(3))
    const keyPair2 = new KeyPair().fromPrivKey(privKey2)
    const addr2 = new Address().fromPubKey(keyPair2.pubKey)

    // make addresses to send to
    const saddr1 = addr1

    // txOuts that we are spending

    // pubKeyHash out
    const scriptout1 = new Script().fromString(
      'OP_DUP OP_HASH160 20 0x' +
        addr1.hashBuf.toString('hex') +
        ' OP_EQUALVERIFY OP_CHECKSIG'
    )

    // pubKeyHash out
    const scriptout2 = new Script().fromString(
      'OP_DUP OP_HASH160 20 0x' +
        addr2.hashBuf.toString('hex') +
        ' OP_EQUALVERIFY OP_CHECKSIG'
    )

    const txOut1 = TxOut.fromProperties(new Bn(1e8), scriptout1)
    const txOut2 = TxOut.fromProperties(new Bn(1e8), scriptout2)
    // total balance: 2e8

    const txHashBuf = Buffer.alloc(32)
    txHashBuf.fill(0)
    const txOutNum1 = 0
    const txOutNum2 = 1

    txb.setFeePerKbNum(0.0001e8)
    txb.setChangeAddress(changeaddr)
    txb.inputFromPubKeyHash(txHashBuf, txOutNum1, txOut1, keyPair1.pubKey)
    txb.inputFromPubKeyHash(txHashBuf, txOutNum2, txOut2, keyPair2.pubKey)
    txb.outputToAddress(new Bn(1.5e8), saddr1) // pubKeyHash address
    // total sending: 2e8 (plus fee)
    // txb.randomizeInputs()
    // txb.randomizeOutputs()

    return {
      txb,
      keyPair1,
      keyPair2,
      addr1,
      addr2,
      saddr1,
      changeaddr,
      txOut1,
      txOut2
    }
  }

  function prepareAndBuildTxBuilder () {
    const obj = prepareTxBuilder()
    obj.txb.build()
    return obj
  }

  describe('#toJSON', function () {
    it('should convert this txb to JSON', function () {
      const obj = prepareAndBuildTxBuilder()
      const txb = obj.txb
      const json = txb.toJSON()
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

  describe('#fromJSON', function () {
    it('should convert to/from json isomorphically', function () {
      const obj = prepareAndBuildTxBuilder()
      const txb = obj.txb
      const json = txb.toJSON()
      const txb2 = new TxBuilder().fromJSON(json)
      const json2 = txb2.toJSON()
      json2.tx.should.equal(json.tx)
      json2.txIns[0].should.equal(json.txIns[0])
      json2.txOuts[0].should.equal(json.txOuts[0])
      JSON.stringify(json2.uTxOutMap).should.equal(
        JSON.stringify(json.uTxOutMap)
      )
      json2.changeScript.should.equal(json.changeScript)
      json2.feePerKbNum.should.equal(json.feePerKbNum)
    })
  })

  describe('#setDust', function () {
    it('should set the dust', function () {
      const obj = prepareTxBuilder()
      const txb = obj.txb
      txb.setDust(200)
      txb.dust.should.equal(200)
      txb.setDust(400)
      txb.dust.should.equal(400)
    })
  })

  describe('#dustChangeToFees', function () {
    it('should set the dustChangeToFees', function () {
      const obj = prepareTxBuilder()
      const txb = obj.txb
      txb.sendDustChangeToFees(true)
      txb.dustChangeToFees.should.equal(true)
      txb.build()
      txb.sendDustChangeToFees(false)
      txb.dustChangeToFees.should.equal(false)
      txb.build()
    })

    it('should not be able to build a tx if dust is greater than all outputs', function () {
      const obj = prepareTxBuilder()
      const txb = obj.txb
      txb.sendDustChangeToFees(true)
      txb.setDust(4e8)
      ;(function () {
        txb.build()
      }.should.throw(
        'cannot create output lesser than dust'
      ))
    })

    it('should not be able to build a tx if dust is greater than all outputs', function () {
      const obj = prepareTxBuilder()
      const txb = obj.txb
      txb.sendDustChangeToFees(true)
      txb.setDust(4e8 + 1)
      ;(function () {
        txb.build()
        console.log(txb.tx.toJSON())
      }.should.throw(
        'cannot create output lesser than dust'
      ))
    })

    it('should have two outputs if dust is zero', function () {
      const obj = prepareTxBuilder()
      const txb = obj.txb
      txb.sendDustChangeToFees(true)
      txb.setDust(0)
      txb.build()
      txb.tx.txOuts.length.should.equal(2)
    })
  })

  describe('#setFeePerKbNum', function () {
    it('should set the feePerKbNum', function () {
      const obj = prepareTxBuilder()
      const txb = obj.txb
      txb.setFeePerKbNum(1000)
      txb.feePerKbNum.should.equal(1000)
    })
  })

  describe('#setChangeAddress', function () {
    it('should set the change address', function () {
      const obj = prepareTxBuilder()
      const txb = obj.txb
      const privKey = new PrivKey().fromRandom()
      const address = new Address().fromPrivKey(privKey)
      txb.setChangeAddress(address)
      txb.changeScript.toString().should.equal(address.toTxOutScript().toString())
    })
  })

  describe('#setChangeScript', function () {
    it('should set the changeScript', function () {
      const obj = prepareTxBuilder()
      const txb = obj.txb
      const privKey = new PrivKey().fromRandom()
      const address = new Address().fromPrivKey(privKey)
      txb.setChangeScript(address.toTxOutScript())
      txb.changeScript.toString().should.equal(address.toTxOutScript().toString())
    })
  })

  describe('#setNLocktime', function () {
    it('should set the nLockTime', function () {
      const obj = prepareTxBuilder()
      const txb = obj.txb
      txb.setNLocktime(1)
      txb.build()
      txb.tx.nLockTime.should.equal(1)
    })
  })

  describe('#setVersion', function () {
    it('should set the versionBytesNum', function () {
      const obj = prepareTxBuilder()
      const txb = obj.txb
      txb.setVersion(2)
      txb.build()
      txb.tx.versionBytesNum.should.equal(2)
    })
  })

  describe('#importPartiallySignedTx', function () {
    it('should set tx', function () {
      const tx = new Tx()
      const txb = new TxBuilder().importPartiallySignedTx(tx)
      should.exist(txb.tx)
    })

    it('should set tx and uTxOutMap', function () {
      const tx = new Tx()
      const uTxOutMap = new TxOutMap()
      const txb = new TxBuilder().importPartiallySignedTx(tx, uTxOutMap)
      should.exist(txb.tx)
      should.exist(txb.uTxOutMap)
    })
  })

  describe('#outputToAddress', function () {
    it('should add a pubKeyHash address', function () {
      const pubKey = new PubKey().fromPrivKey(new PrivKey().fromRandom())
      const address = new Address().fromPubKey(pubKey)
      const txb = new TxBuilder()
      txb.outputToAddress(new Bn(0), address)
      txb.txOuts.length.should.equal(1)
    })
  })

  describe('#outputToScript', function () {
    it('should add an OP_RETURN output', function () {
      const script = new Script().fromString('OP_RETURN')
      const txb = new TxBuilder()
      txb.outputToScript(new Bn(0), script)
      txb.txOuts.length.should.equal(1)
    })
  })

  describe('#build', function () {
    function prepareTxBuilder (outAmountBn = new Bn(1e8)) {
      const txb = new TxBuilder()

      // make change address
      const privKey = new PrivKey().fromBn(new Bn(1))
      const keyPair = new KeyPair().fromPrivKey(privKey)
      const changeaddr = new Address().fromPubKey(keyPair.pubKey)

      // make addresses to send from
      const privKey1 = new PrivKey().fromBn(new Bn(2))
      const keyPair1 = new KeyPair().fromPrivKey(privKey1)
      const addr1 = new Address().fromPubKey(keyPair1.pubKey)

      const privKey2 = new PrivKey().fromBn(new Bn(3))
      const keyPair2 = new KeyPair().fromPrivKey(privKey2)
      const addr2 = new Address().fromPubKey(keyPair2.pubKey)

      const privKey3 = new PrivKey().fromBn(new Bn(4))
      const keyPair3 = new KeyPair().fromPrivKey(privKey3)
      const addr3 = new Address().fromPubKey(keyPair3.pubKey)

      const txOut1 = TxOut.fromProperties(new Bn(1e8), addr1.toTxOutScript())
      const txOut2 = TxOut.fromProperties(new Bn(1e8), addr2.toTxOutScript())
      const txOut3 = TxOut.fromProperties(new Bn(1e8), addr3.toTxOutScript())
      // total balance: 3e8

      const txHashBuf = Buffer.alloc(32)
      txHashBuf.fill(0)
      const txOutNum1 = 0
      const txOutNum2 = 1
      const txOutNum3 = 2

      txb.setFeePerKbNum(0.0001e8)
      txb.setChangeAddress(changeaddr)
      txb.inputFromPubKeyHash(txHashBuf, txOutNum1, txOut1, keyPair1.pubKey)
      txb.inputFromPubKeyHash(txHashBuf, txOutNum2, txOut2, keyPair2.pubKey)
      txb.inputFromPubKeyHash(txHashBuf, txOutNum3, txOut3, keyPair3.pubKey)
      txb.outputToAddress(outAmountBn, addr1)

      return txb
    }

    it('should build a tx where all inputs are NOT required', function () {
      const txb = prepareTxBuilder()

      txb.build()

      txb.tx.txIns.length.should.equal(2)
    })

    it('should build a tx where all inputs are required', function () {
      const txb = prepareTxBuilder()

      txb.build({ useAllInputs: true })

      txb.tx.txIns.length.should.equal(3)
    })
  })

  describe('#sort', function () {
    it('it should call tx sort', function () {
      const txBuilder = new TxBuilder()
      let called = 0
      txBuilder.tx.sort = () => { called++ }
      txBuilder.sort()
      called.should.equal(1)
    })
  })

  describe('@allSigsPresent', function () {
    it('should know all sigs are or are not present these scripts', function () {
      let script
      script = new Script().fromString(
        'OP_0 71 0x304402204c99f293ca4d84f01e8f319e93978866877c948628cb4d4ff5ccdf42ae8434cc02206516aa37dcd9f50ddb2f7484aeaef3c0fbab77db60eeafd5ad91b0ba54b715e901 72 0x3045022100ff53e3f8ee64eb0f816a85a244d5e3bc20e7ade814e4377be5279a12130c8414022068e00c79272539d03357d4d589bf4c0c7a517023aaa2abe3f341c26ca9077d0801 OP_PUSHDATA1 105 0x522102c6047f9441ed7d6d3045406e95c07cd85c778e4b8cef3ca7abac09b95c709ee52102f9308a019258c31049344f85f89d5229b531c845836f99b08601f113bce036f92102f9308a019258c31049344f85f89d5229b531c845836f99b08601f113bce036f953ae'
      )
      TxBuilder.allSigsPresent(2, script).should.equal(true)
      script = new Script().fromString(
        'OP_0 71 0x304402204c99f293ca4d84f01e8f319e93978866877c948628cb4d4ff5ccdf42ae8434cc02206516aa37dcd9f50ddb2f7484aeaef3c0fbab77db60eeafd5ad91b0ba54b715e901 71 0x304402204c99f293ca4d84f01e8f319e93978866877c948628cb4d4ff5ccdf42ae8434cc02206516aa37dcd9f50ddb2f7484aeaef3c0fbab77db60eeafd5ad91b0ba54b715e901 72 0x3045022100ff53e3f8ee64eb0f816a85a244d5e3bc20e7ade814e4377be5279a12130c8414022068e00c79272539d03357d4d589bf4c0c7a517023aaa2abe3f341c26ca9077d0801 OP_PUSHDATA1 105 0x522102c6047f9441ed7d6d3045406e95c07cd85c778e4b8cef3ca7abac09b95c709ee52102f9308a019258c31049344f85f89d5229b531c845836f99b08601f113bce036f92102f9308a019258c31049344f85f89d5229b531c845836f99b08601f113bce036f953ae'
      )
      TxBuilder.allSigsPresent(3, script).should.equal(true)
      script = new Script().fromString(
        'OP_0 OP_0 71 0x304402204c99f293ca4d84f01e8f319e93978866877c948628cb4d4ff5ccdf42ae8434cc02206516aa37dcd9f50ddb2f7484aeaef3c0fbab77db60eeafd5ad91b0ba54b715e901 72 0x3045022100ff53e3f8ee64eb0f816a85a244d5e3bc20e7ade814e4377be5279a12130c8414022068e00c79272539d03357d4d589bf4c0c7a517023aaa2abe3f341c26ca9077d0801 OP_PUSHDATA1 105 0x522102c6047f9441ed7d6d3045406e95c07cd85c778e4b8cef3ca7abac09b95c709ee52102f9308a019258c31049344f85f89d5229b531c845836f99b08601f113bce036f92102f9308a019258c31049344f85f89d5229b531c845836f99b08601f113bce036f953ae'
      )
      TxBuilder.allSigsPresent(3, script).should.equal(false)
    })
  })

  describe('@removeBlankSigs', function () {
    it('should know all sigs are or are not present these scripts', function () {
      let script
      script = new Script().fromString(
        'OP_0 OP_0 71 0x304402204c99f293ca4d84f01e8f319e93978866877c948628cb4d4ff5ccdf42ae8434cc02206516aa37dcd9f50ddb2f7484aeaef3c0fbab77db60eeafd5ad91b0ba54b715e901 72 0x3045022100ff53e3f8ee64eb0f816a85a244d5e3bc20e7ade814e4377be5279a12130c8414022068e00c79272539d03357d4d589bf4c0c7a517023aaa2abe3f341c26ca9077d0801 OP_PUSHDATA1 105 0x522102c6047f9441ed7d6d3045406e95c07cd85c778e4b8cef3ca7abac09b95c709ee52102f9308a019258c31049344f85f89d5229b531c845836f99b08601f113bce036f92102f9308a019258c31049344f85f89d5229b531c845836f99b08601f113bce036f953ae'
      )
      TxBuilder.allSigsPresent(3, script).should.equal(false)
      script = TxBuilder.removeBlankSigs(script)
      TxBuilder.allSigsPresent(2, script).should.equal(true)
    })
  })

  describe('#inputFromScript', function () {
    it('should add an input from a script', function () {
      const keyPair = new KeyPair().fromRandom()
      const address = new Address().fromPubKey(keyPair.pubKey)
      const txOut = TxOut.fromProperties(
        new Bn(1000),
        new Script().fromPubKeyHash(address.hashBuf)
      )
      const script = new Script().fromString('OP_RETURN')
      const txHashBuf = Buffer.alloc(32)
      txHashBuf.fill(0)
      const txOutNum = 0
      const txbuilder = new TxBuilder().inputFromScript(
        txHashBuf,
        txOutNum,
        txOut,
        script
      )
      txbuilder.txIns.length.should.equal(1)
    })

    it('should add an input from a script and set nSequence', function () {
      const keyPair = new KeyPair().fromRandom()
      const address = new Address().fromPubKey(keyPair.pubKey)
      const txOut = TxOut.fromProperties(
        new Bn(1000),
        new Script().fromPubKeyHash(address.hashBuf)
      )
      const script = new Script().fromString('OP_RETURN')
      const txHashBuf = Buffer.alloc(32)
      txHashBuf.fill(0)
      const txOutNum = 0
      const txbuilder = new TxBuilder().inputFromScript(
        txHashBuf,
        txOutNum,
        txOut,
        script,
        0xf0f0f0f0
      )
      txbuilder.txIns.length.should.equal(1)
      txbuilder.txIns[0].nSequence.should.equal(0xf0f0f0f0)
    })
  })

  describe('#inputFromPubKeyHash', function () {
    it('should add an input from a pubKeyHash output', function () {
      const keyPair = new KeyPair().fromRandom()
      const address = new Address().fromPubKey(keyPair.pubKey)
      const txOut = TxOut.fromProperties(
        new Bn(1000),
        new Script().fromPubKeyHash(address.hashBuf)
      )
      const txHashBuf = Buffer.alloc(32)
      txHashBuf.fill(0)
      const txOutNum = 0
      const txbuilder = new TxBuilder().inputFromPubKeyHash(
        txHashBuf,
        txOutNum,
        txOut,
        keyPair.pubKey
      )
      Buffer.compare(
        txbuilder.txIns[0].script.chunks[1].buf,
        keyPair.pubKey.toBuffer()
      ).should.equal(0)
    })

    it('should add an input from a pubKeyHash output and set nSequence', function () {
      const keyPair = new KeyPair().fromRandom()
      const address = new Address().fromPubKey(keyPair.pubKey)
      const txOut = TxOut.fromProperties(
        new Bn(1000),
        new Script().fromPubKeyHash(address.hashBuf)
      )
      const txHashBuf = Buffer.alloc(32)
      txHashBuf.fill(0)
      const txOutNum = 0
      const txbuilder = new TxBuilder().inputFromPubKeyHash(
        txHashBuf,
        txOutNum,
        txOut,
        keyPair.pubKey,
        0xf0f0f0f0
      )
      Buffer.compare(
        txbuilder.txIns[0].script.chunks[1].buf,
        keyPair.pubKey.toBuffer()
      ).should.equal(0)
      txbuilder.txIns[0].nSequence.should.equal(0xf0f0f0f0)
    })
  })

  describe('#getSig', function () {
    let txb, keyPair1, txOut1

    before(function () {
      const obj = prepareAndBuildTxBuilder()
      txb = obj.txb
      keyPair1 = obj.keyPair1
      txOut1 = obj.txOut1
    })

    it('should sign and verify synchronously', function () {
      const sig = txb.getSig(keyPair1, Sig.SIGHASH_ALL, 0, keyPair1, txOut1)
      ;(sig instanceof Sig).should.equal(true)
    })
  })

  describe('#signTxIn', function () {
    it('should sign and verify no SIGHASH_FORKID synchronously', function () {
      // prepare
      const obj = prepareAndBuildTxBuilder()
      const txb = obj.txb
      const keyPair1 = obj.keyPair1
      const keyPair2 = obj.keyPair2
      const saddr1 = obj.saddr1
      const changeaddr = obj.changeaddr

      // begin signing
      const nHashType = Sig.SIGHASH_ALL
      const flags = Interp.SCRIPT_VERIFY_P2SH
      txb.signTxIn(0, keyPair1, undefined, undefined, nHashType, flags)

      // transaction not fully signed yet, so should be invalid
      TxVerifier.verify(txb.tx, txb.uTxOutMap, flags).should.equal(false)

      txb.signTxIn(1, keyPair2, undefined, undefined, nHashType, flags)

      txb.tx.txOuts[0].script.chunks[2].buf
        .toString('hex')
        .should.equal(saddr1.hashBuf.toString('hex'))
      txb.tx.txOuts[0].valueBn.eq(1.5e8).should.equal(true)
      txb.tx.txOuts[1].valueBn.gt(546).should.equal(true)
      txb.tx.txOuts[1].valueBn.toNumber().should.equal(49996250)
      txb.changeAmountBn.toNumber().should.equal(49996250)
      txb.feeAmountBn.toNumber().should.equal(3750)
      txb.tx.txOuts[1].script.chunks[2].buf
        .toString('hex')
        .should.equal(changeaddr.hashBuf.toString('hex'))

      TxVerifier.verify(txb.tx, txb.uTxOutMap, flags).should.equal(true)
    })

    it('should sign and verify SIGHASH_FORKID synchronously', function () {
      // prepare
      const obj = prepareAndBuildTxBuilder()
      const txb = obj.txb
      const keyPair1 = obj.keyPair1
      const keyPair2 = obj.keyPair2
      const saddr1 = obj.saddr1
      const changeaddr = obj.changeaddr

      // begin signing
      const nHashType = Sig.SIGHASH_ALL | Sig.SIGHASH_FORKID
      const flags =
        Interp.SCRIPT_ENABLE_SIGHASH_FORKID | Interp.SCRIPT_VERIFY_P2SH
      txb.signTxIn(0, keyPair1, undefined, undefined, nHashType, flags)

      // transaction not fully signed yet, so should be invalid
      TxVerifier.verify(txb.tx, txb.uTxOutMap, flags).should.equal(false)

      txb.signTxIn(1, keyPair2, undefined, undefined, nHashType, flags)

      txb.tx.txOuts[0].script.chunks[2].buf
        .toString('hex')
        .should.equal(saddr1.hashBuf.toString('hex'))
      txb.tx.txOuts[0].valueBn.eq(1.5e8).should.equal(true)
      txb.tx.txOuts[1].valueBn.gt(546).should.equal(true)
      txb.tx.txOuts[1].valueBn.toNumber().should.equal(49996250)
      txb.changeAmountBn.toNumber().should.equal(49996250)
      txb.feeAmountBn.toNumber().should.equal(3750)
      txb.tx.txOuts[1].script.chunks[2].buf
        .toString('hex')
        .should.equal(changeaddr.hashBuf.toString('hex'))

      TxVerifier.verify(txb.tx, txb.uTxOutMap, flags).should.equal(true)
    })

    it('should pass in txOut', function () {
      // prepare
      const obj = prepareAndBuildTxBuilder()
      const txb = obj.txb
      const keyPair1 = obj.keyPair1
      const txOut1 = obj.txOut1

      txb.txOutMap = sinon.spy()
      txb.uTxOutMap = {
        get: sinon.spy()
      }
      txb.signTxIn(0, keyPair1, txOut1, undefined, Sig.SIGHASH_ALL, 0)
      txb.uTxOutMap.get.calledOnce.should.equal(false)
    })
  })

  describe('#asyncGetSig', function () {
    let txb, keyPair1, txOut1

    before(function () {
      const obj = prepareAndBuildTxBuilder()
      txb = obj.txb
      keyPair1 = obj.keyPair1
      txOut1 = obj.txOut1
    })

    it('should sign and verify synchronously', async function () {
      const sig = await txb.asyncGetSig(
        keyPair1,
        Sig.SIGHASH_ALL,
        0,
        keyPair1,
        txOut1
      )
      ;(sig instanceof Sig).should.equal(true)
    })
  })

  describe('#asyncSignTxIn', function () {
    it('should sign and verify no SIGHASH_FORKID asynchronously', async function () {
      // prepare
      const obj = prepareAndBuildTxBuilder()
      const txb = obj.txb
      const keyPair1 = obj.keyPair1
      const keyPair2 = obj.keyPair2
      const saddr1 = obj.saddr1
      const changeaddr = obj.changeaddr

      // begin signing
      const nHashType = Sig.SIGHASH_ALL
      const flags = Interp.SCRIPT_VERIFY_P2SH
      await txb.asyncSignTxIn(0, keyPair1, undefined, undefined, nHashType, flags)

      // transaction not fully signed yet, so should be invalid
      TxVerifier.verify(txb.tx, txb.uTxOutMap, flags).should.equal(false)

      await txb.asyncSignTxIn(1, keyPair2, undefined, undefined, nHashType, flags)

      txb.tx.txOuts[0].script.chunks[2].buf
        .toString('hex')
        .should.equal(saddr1.hashBuf.toString('hex'))
      txb.tx.txOuts[0].valueBn.eq(1.5e8).should.equal(true)
      txb.tx.txOuts[1].valueBn.gt(546).should.equal(true)
      txb.tx.txOuts[1].valueBn.toNumber().should.equal(49996250)
      txb.changeAmountBn.toNumber().should.equal(49996250)
      txb.feeAmountBn.toNumber().should.equal(3750)
      txb.tx.txOuts[1].script.chunks[2].buf
        .toString('hex')
        .should.equal(changeaddr.hashBuf.toString('hex'))

      TxVerifier.verify(txb.tx, txb.uTxOutMap, flags).should.equal(true)
    })

    it('should sign and verify SIGHASH_FORKID asynchronously', async function () {
      // prepare
      const obj = prepareAndBuildTxBuilder()
      const txb = obj.txb
      const keyPair1 = obj.keyPair1
      const keyPair2 = obj.keyPair2
      const saddr1 = obj.saddr1
      const changeaddr = obj.changeaddr

      // begin signing
      const nHashType = Sig.SIGHASH_ALL | Sig.SIGHASH_FORKID
      const flags =
        Interp.SCRIPT_ENABLE_SIGHASH_FORKID | Interp.SCRIPT_VERIFY_P2SH
      await txb.asyncSignTxIn(0, keyPair1, undefined, undefined, nHashType, flags)

      // transaction not fully signed yet, so should be invalid
      TxVerifier.verify(txb.tx, txb.uTxOutMap, flags).should.equal(false)

      await txb.asyncSignTxIn(1, keyPair2, undefined, undefined, nHashType, flags)

      txb.tx.txOuts[0].script.chunks[2].buf
        .toString('hex')
        .should.equal(saddr1.hashBuf.toString('hex'))
      txb.tx.txOuts[0].valueBn.eq(1.5e8).should.equal(true)
      txb.tx.txOuts[1].valueBn.gt(546).should.equal(true)
      txb.tx.txOuts[1].valueBn.toNumber().should.equal(49996250)
      txb.changeAmountBn.toNumber().should.equal(49996250)
      txb.feeAmountBn.toNumber().should.equal(3750)
      txb.tx.txOuts[1].script.chunks[2].buf
        .toString('hex')
        .should.equal(changeaddr.hashBuf.toString('hex'))

      TxVerifier.verify(txb.tx, txb.uTxOutMap, flags).should.equal(true)
    })

    it('should pass in txOut', async function () {
      const obj = prepareAndBuildTxBuilder()
      const txb = obj.txb
      const keyPair1 = obj.keyPair1
      const txOut1 = obj.txOut1
      txb.txOutMap = sinon.spy()
      txb.uTxOutMap = {
        get: sinon.spy()
      }
      await txb.asyncSignTxIn(0, keyPair1, txOut1, undefined, Sig.SIGHASH_ALL, 0)
      txb.uTxOutMap.get.calledOnce.should.equal(false)
    })
  })

  describe('#sign', function () {
    it('should sign and verify synchronously', function () {
      // prepare
      const obj = prepareAndBuildTxBuilder()
      const txb = obj.txb
      const keyPair1 = obj.keyPair1
      const keyPair2 = obj.keyPair2
      const saddr1 = obj.saddr1
      const changeaddr = obj.changeaddr

      // begin signing
      const flags = Interp.SCRIPT_ENABLE_SIGHASH_FORKID
      // txb.signTxIn(0, keyPair1, undefined, undefined, nHashType, flags)
      txb.sign([keyPair1])

      txb.sigOperations.map.get('0000000000000000000000000000000000000000000000000000000000000000:0')[0].log.should.equal('successfully inserted signature')
      txb.sigOperations.map.get('0000000000000000000000000000000000000000000000000000000000000000:0')[1].log.should.equal('successfully inserted public key')
      txb.sigOperations.map.get('0000000000000000000000000000000000000000000000000000000000000000:1')[0].log.should.equal('cannot find keyPair for addressStr 1CUNEBjYrCn2y1SdiUMohaKUi4wpP326Lb')
      txb.sigOperations.map.get('0000000000000000000000000000000000000000000000000000000000000000:1')[1].log.should.equal('cannot find keyPair for addressStr 1CUNEBjYrCn2y1SdiUMohaKUi4wpP326Lb')

      // transaction not fully signed yet, so should be invalid
      TxVerifier.verify(txb.tx, txb.uTxOutMap, flags).should.equal(false)

      // this should effectively add
      txb.sign([keyPair2])

      txb.tx.txOuts[0].script.chunks[2].buf
        .toString('hex')
        .should.equal(saddr1.hashBuf.toString('hex'))
      txb.tx.txOuts[0].valueBn.eq(1.5e8).should.equal(true)
      txb.tx.txOuts[1].valueBn.gt(546).should.equal(true)
      txb.tx.txOuts[1].valueBn.toNumber().should.equal(49996250)
      txb.changeAmountBn.toNumber().should.equal(49996250)
      txb.feeAmountBn.toNumber().should.equal(3750)
      txb.tx.txOuts[1].script.chunks[2].buf
        .toString('hex')
        .should.equal(changeaddr.hashBuf.toString('hex'))

      TxVerifier.verify(txb.tx, txb.uTxOutMap, flags).should.equal(true)

      // re-signing just puts the same signatures back into the same place and
      // thus should still be valid
      txb.sign([keyPair1, keyPair2])
      TxVerifier.verify(txb.tx, txb.uTxOutMap, flags).should.equal(true)
    })

    it('should sign and verify synchronously with no public key inserted at input', function () {
      function prepareTxBuilder () {
        const txb = new TxBuilder()

        // make change address
        const privKey = new PrivKey().fromBn(new Bn(1))
        const keyPair = new KeyPair().fromPrivKey(privKey)
        const changeaddr = new Address().fromPubKey(keyPair.pubKey)

        // make addresses to send from
        const privKey1 = new PrivKey().fromBn(new Bn(2))
        const keyPair1 = new KeyPair().fromPrivKey(privKey1)
        const addr1 = new Address().fromPubKey(keyPair1.pubKey)

        const privKey2 = new PrivKey().fromBn(new Bn(3))
        const keyPair2 = new KeyPair().fromPrivKey(privKey2)
        const addr2 = new Address().fromPubKey(keyPair2.pubKey)

        // make addresses to send to
        const saddr1 = addr1

        // txOuts that we are spending

        // pubKeyHash out
        const scriptout1 = new Script().fromString(
          'OP_DUP OP_HASH160 20 0x' +
            addr1.hashBuf.toString('hex') +
            ' OP_EQUALVERIFY OP_CHECKSIG'
        )

        // pubKeyHash out
        const scriptout2 = new Script().fromString(
          'OP_DUP OP_HASH160 20 0x' +
            addr2.hashBuf.toString('hex') +
            ' OP_EQUALVERIFY OP_CHECKSIG'
        )

        const txOut1 = TxOut.fromProperties(new Bn(1e8), scriptout1)
        const txOut2 = TxOut.fromProperties(new Bn(1e8), scriptout2)
        // total balance: 2e8

        const txHashBuf = Buffer.alloc(32)
        txHashBuf.fill(0)
        const txOutNum1 = 0
        const txOutNum2 = 1

        txb.setFeePerKbNum(0.0001e8)
        txb.setChangeAddress(changeaddr)
        txb.inputFromPubKeyHash(txHashBuf, txOutNum1, txOut1)
        txb.inputFromPubKeyHash(txHashBuf, txOutNum2, txOut2)
        txb.outputToAddress(new Bn(1.5e8), saddr1) // pubKeyHash address
        // total sending: 2e8 (plus fee)
        // txb.randomizeInputs()
        // txb.randomizeOutputs()

        return {
          txb,
          keyPair1,
          keyPair2,
          addr1,
          addr2,
          saddr1,
          changeaddr,
          txOut1,
          txOut2
        }
      }

      function prepareAndBuildTxBuilder () {
        const obj = prepareTxBuilder()
        obj.txb.build()
        return obj
      }

      // prepare
      const obj = prepareAndBuildTxBuilder()
      const txb = obj.txb
      const keyPair1 = obj.keyPair1
      const keyPair2 = obj.keyPair2
      const saddr1 = obj.saddr1
      const changeaddr = obj.changeaddr

      // begin signing
      const flags = Interp.SCRIPT_ENABLE_SIGHASH_FORKID
      // txb.signTxIn(0, keyPair1, undefined, undefined, nHashType, flags)
      txb.sign([keyPair1])

      txb.sigOperations.map.get('0000000000000000000000000000000000000000000000000000000000000000:0')[0].log.should.equal('successfully inserted signature')
      txb.sigOperations.map.get('0000000000000000000000000000000000000000000000000000000000000000:0')[1].log.should.equal('successfully inserted public key')
      txb.sigOperations.map.get('0000000000000000000000000000000000000000000000000000000000000000:1')[0].log.should.equal('cannot find keyPair for addressStr 1CUNEBjYrCn2y1SdiUMohaKUi4wpP326Lb')
      txb.sigOperations.map.get('0000000000000000000000000000000000000000000000000000000000000000:1')[1].log.should.equal('cannot find keyPair for addressStr 1CUNEBjYrCn2y1SdiUMohaKUi4wpP326Lb')

      // transaction not fully signed yet, so should be invalid
      TxVerifier.verify(txb.tx, txb.uTxOutMap, flags).should.equal(false)

      // this should effectively add
      txb.sign([keyPair2])

      txb.tx.txOuts[0].script.chunks[2].buf
        .toString('hex')
        .should.equal(saddr1.hashBuf.toString('hex'))
      txb.tx.txOuts[0].valueBn.eq(1.5e8).should.equal(true)
      txb.tx.txOuts[1].valueBn.gt(546).should.equal(true)
      txb.tx.txOuts[1].valueBn.toNumber().should.equal(49996250)
      txb.changeAmountBn.toNumber().should.equal(49996250)
      txb.feeAmountBn.toNumber().should.equal(3750)
      txb.tx.txOuts[1].script.chunks[2].buf
        .toString('hex')
        .should.equal(changeaddr.hashBuf.toString('hex'))

      TxVerifier.verify(txb.tx, txb.uTxOutMap, flags).should.equal(true)

      // re-signing just puts the same signatures back into the same place and
      // thus should still be valid
      txb.sign([keyPair1, keyPair2])
      TxVerifier.verify(txb.tx, txb.uTxOutMap, flags).should.equal(true)
    })

    it('should sign and verify a lot of inputs and outputs', function () {
      // make change address
      const privKey = new PrivKey().fromBn(new Bn(100))
      const keyPair = new KeyPair().fromPrivKey(privKey)
      const changeaddr = new Address().fromPubKey(keyPair.pubKey)

      // make addresses to send from (and to)
      const privKey1 = new PrivKey().fromBn(new Bn(1))
      const keyPair1 = new KeyPair().fromPrivKey(privKey1)
      const addr1 = new Address().fromPubKey(keyPair1.pubKey)

      const privKey2 = new PrivKey().fromBn(new Bn(2))
      const keyPair2 = new KeyPair().fromPrivKey(privKey2)
      const addr2 = new Address().fromPubKey(keyPair2.pubKey)

      const privKey3 = new PrivKey().fromBn(new Bn(3))
      const keyPair3 = new KeyPair().fromPrivKey(privKey3)
      const addr3 = new Address().fromPubKey(keyPair3.pubKey)

      const privKey4 = new PrivKey().fromBn(new Bn(4))
      const keyPair4 = new KeyPair().fromPrivKey(privKey4)
      const addr4 = new Address().fromPubKey(keyPair4.pubKey)

      const privKey5 = new PrivKey().fromBn(new Bn(5))
      const keyPair5 = new KeyPair().fromPrivKey(privKey5)
      const addr5 = new Address().fromPubKey(keyPair5.pubKey)

      const privKey6 = new PrivKey().fromBn(new Bn(6))
      const keyPair6 = new KeyPair().fromPrivKey(privKey6)
      const addr6 = new Address().fromPubKey(keyPair6.pubKey)

      const privKey7 = new PrivKey().fromBn(new Bn(7))
      const keyPair7 = new KeyPair().fromPrivKey(privKey7)
      const addr7 = new Address().fromPubKey(keyPair7.pubKey)

      const privKey8 = new PrivKey().fromBn(new Bn(8))
      const keyPair8 = new KeyPair().fromPrivKey(privKey8)
      const addr8 = new Address().fromPubKey(keyPair8.pubKey)

      const privKey9 = new PrivKey().fromBn(new Bn(9))
      const keyPair9 = new KeyPair().fromPrivKey(privKey9)
      const addr9 = new Address().fromPubKey(keyPair9.pubKey)

      const privKey10 = new PrivKey().fromBn(new Bn(10))
      const keyPair10 = new KeyPair().fromPrivKey(privKey10)
      const addr10 = new Address().fromPubKey(keyPair10.pubKey)

      const privKey11 = new PrivKey().fromBn(new Bn(11))
      const keyPair11 = new KeyPair().fromPrivKey(privKey11)
      const addr11 = new Address().fromPubKey(keyPair11.pubKey)

      // txOuts that we are spending
      const scriptout1 = new Script().fromString('OP_DUP OP_HASH160 20 0x' + addr1.hashBuf.toString('hex') + ' OP_EQUALVERIFY OP_CHECKSIG')
      const scriptout2 = new Script().fromString('OP_DUP OP_HASH160 20 0x' + addr2.hashBuf.toString('hex') + ' OP_EQUALVERIFY OP_CHECKSIG')
      const scriptout3 = new Script().fromString('OP_DUP OP_HASH160 20 0x' + addr3.hashBuf.toString('hex') + ' OP_EQUALVERIFY OP_CHECKSIG')
      const scriptout4 = new Script().fromString('OP_DUP OP_HASH160 20 0x' + addr4.hashBuf.toString('hex') + ' OP_EQUALVERIFY OP_CHECKSIG')
      const scriptout5 = new Script().fromString('OP_DUP OP_HASH160 20 0x' + addr5.hashBuf.toString('hex') + ' OP_EQUALVERIFY OP_CHECKSIG')
      const scriptout6 = new Script().fromString('OP_DUP OP_HASH160 20 0x' + addr6.hashBuf.toString('hex') + ' OP_EQUALVERIFY OP_CHECKSIG')
      const scriptout7 = new Script().fromString('OP_DUP OP_HASH160 20 0x' + addr7.hashBuf.toString('hex') + ' OP_EQUALVERIFY OP_CHECKSIG')
      const scriptout8 = new Script().fromString('OP_DUP OP_HASH160 20 0x' + addr8.hashBuf.toString('hex') + ' OP_EQUALVERIFY OP_CHECKSIG')
      const scriptout9 = new Script().fromString('OP_DUP OP_HASH160 20 0x' + addr9.hashBuf.toString('hex') + ' OP_EQUALVERIFY OP_CHECKSIG')
      const scriptout10 = new Script().fromString('OP_DUP OP_HASH160 20 0x' + addr10.hashBuf.toString('hex') + ' OP_EQUALVERIFY OP_CHECKSIG')
      const scriptout11 = new Script().fromString('OP_DUP OP_HASH160 20 0x' + addr11.hashBuf.toString('hex') + ' OP_EQUALVERIFY OP_CHECKSIG')

      const txOut1 = TxOut.fromProperties(new Bn(1e8), scriptout1)
      const txOut2 = TxOut.fromProperties(new Bn(1e8), scriptout2)
      const txOut3 = TxOut.fromProperties(new Bn(1e8), scriptout3)
      const txOut4 = TxOut.fromProperties(new Bn(1e8), scriptout4)
      const txOut5 = TxOut.fromProperties(new Bn(1e8), scriptout5)
      const txOut6 = TxOut.fromProperties(new Bn(1e8), scriptout6)
      const txOut7 = TxOut.fromProperties(new Bn(1e8), scriptout7)
      const txOut8 = TxOut.fromProperties(new Bn(1e8), scriptout8)
      const txOut9 = TxOut.fromProperties(new Bn(1e8), scriptout9)
      const txOut10 = TxOut.fromProperties(new Bn(1e8), scriptout10)
      const txOut11 = TxOut.fromProperties(new Bn(1e8), scriptout11)
      // total balance: 11e8

      const txHashBuf = Buffer.alloc(32)
      txHashBuf.fill(1)
      const txOutNum1 = 0
      const txOutNum2 = 1
      const txOutNum3 = 2
      const txOutNum4 = 3
      const txOutNum5 = 4
      const txOutNum6 = 5
      const txOutNum7 = 6
      const txOutNum8 = 7
      const txOutNum9 = 8
      const txOutNum10 = 9
      const txOutNum11 = 10

      const txb = new TxBuilder()
      txb.setFeePerKbNum(0.0001e8)
      txb.setChangeAddress(changeaddr)
      txb.inputFromPubKeyHash(txHashBuf, txOutNum1, txOut1)
      txb.inputFromPubKeyHash(txHashBuf, txOutNum2, txOut2)
      txb.inputFromPubKeyHash(txHashBuf, txOutNum3, txOut3)
      txb.inputFromPubKeyHash(txHashBuf, txOutNum4, txOut4)
      txb.inputFromPubKeyHash(txHashBuf, txOutNum5, txOut5)
      txb.inputFromPubKeyHash(txHashBuf, txOutNum6, txOut6)
      txb.inputFromPubKeyHash(txHashBuf, txOutNum7, txOut7)
      txb.inputFromPubKeyHash(txHashBuf, txOutNum8, txOut8)
      txb.inputFromPubKeyHash(txHashBuf, txOutNum9, txOut9)
      txb.inputFromPubKeyHash(txHashBuf, txOutNum10, txOut10)
      txb.inputFromPubKeyHash(txHashBuf, txOutNum11, txOut11)
      txb.outputToAddress(new Bn(0.999e8), addr1)
      txb.outputToAddress(new Bn(0.999e8), addr2)
      txb.outputToAddress(new Bn(0.999e8), addr3)
      txb.outputToAddress(new Bn(0.999e8), addr4)
      txb.outputToAddress(new Bn(0.999e8), addr5)
      txb.outputToAddress(new Bn(0.999e8), addr6)
      txb.outputToAddress(new Bn(0.999e8), addr7)
      txb.outputToAddress(new Bn(0.999e8), addr8)
      txb.outputToAddress(new Bn(0.999e8), addr9)
      txb.outputToAddress(new Bn(0.999e8), addr10)
      txb.outputToAddress(new Bn(0.999e8), addr11)
      // total sending: 10.989e8 (plus fee)

      txb.build()

      // begin signing
      const flags = Interp.SCRIPT_ENABLE_SIGHASH_FORKID

      // partially sign - deliberately resulting in invalid tx
      txb.sign([
        keyPair1,
        keyPair2,
        keyPair3
      ])

      // transaction not fully signed yet, so should be invalid
      TxVerifier.verify(txb.tx, txb.uTxOutMap, flags).should.equal(false)

      // fully sign
      txb.sign([
        keyPair1,
        keyPair2,
        keyPair3,
        keyPair4,
        keyPair5,
        keyPair6,
        keyPair7,
        keyPair8,
        keyPair9,
        keyPair10,
        keyPair11,
      ])

      // txb.changeAmountBn.toNumber().should.equal(49996250)
      // txb.feeAmountBn.toNumber().should.equal(3750)

      TxVerifier.verify(txb.tx, txb.uTxOutMap, flags).should.equal(true)

      // re-signing just puts the same signatures back into the same place and
      // thus should still be valid
      txb.sign([
        keyPair1,
        keyPair2,
        keyPair3,
        keyPair4,
        keyPair5,
        keyPair6,
        keyPair7,
        keyPair8,
        keyPair9,
        keyPair10,
        keyPair11,
      ])
      TxVerifier.verify(txb.tx, txb.uTxOutMap, flags).should.equal(true)
    })
  })
})
