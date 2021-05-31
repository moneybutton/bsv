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

    it('allows zero', function () {
      const obj = prepareTxBuilder()
      const txb = obj.txb
      txb.setFeePerKbNum(0)
      should(txb.feePerKbNum).be.eql(0)
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

    it('should buld a tx with zero fees', function () {
      const txb = new TxBuilder()

      const changePrivKey = new PrivKey().fromBn(new Bn(1))
      const changeKeyPair = new KeyPair().fromPrivKey(changePrivKey)
      const changeAddr = new Address().fromPubKey(changeKeyPair.pubKey)

      const inputPrivKey = new PrivKey().fromBn(new Bn(2))
      const inputKeyPair = new KeyPair().fromPrivKey(inputPrivKey)
      const inputAddress = new Address().fromPubKey(inputKeyPair.pubKey)

      const txHashBuf = Buffer.alloc(32).fill(1)
      const txOutNum = 0
      const inputAmount = Bn().fromNumber(1000)
      const inputScript = inputAddress.toTxOutScript()
      const txOut = TxOut.fromProperties(inputAmount, inputScript)

      txb.inputFromPubKeyHash(txHashBuf, txOutNum, txOut, inputKeyPair.pubKey)
      txb.setChangeAddress(changeAddr)
      txb.setFeePerKbNum(0)

      should(() => txb.build()).not.throw()

      const tx = txb.tx
      should(tx.txOuts[0].valueBn.toString()).be.eql(inputAmount.toString())
    })

    it('builds a tx whith unspendable output containing OP_FALSE and output less than dust', () => {
      const txb = new TxBuilder()
      txb.setDust(145)

      // input
      const inputPrivKey = new PrivKey().fromBn(new Bn(2))
      const inputKeyPair = new KeyPair().fromPrivKey(inputPrivKey)
      const inputAddress = new Address().fromPubKey(inputKeyPair.pubKey)
      const txHashBuf = Buffer.alloc(32).fill(1)
      const inputAmount = Bn().fromNumber(1000)
      const inputScript = inputAddress.toTxOutScript()
      const txOut = TxOut.fromProperties(inputAmount, inputScript)
      txb.inputFromPubKeyHash(txHashBuf, 0, txOut, inputKeyPair.pubKey)

      // change
      const changePrivKey = new PrivKey().fromBn(new Bn(1))
      const changeKeyPair = new KeyPair().fromPrivKey(changePrivKey)
      const changeAddr = new Address().fromPubKey(changeKeyPair.pubKey)
      txb.setChangeAddress(changeAddr)

      // build
      txb.outputToScript(new Bn().fromNumber(0), Script.fromAsmString('OP_FALSE OP_RETURN 0'))

      // assertions
      should(() => txb.build()).not.throw()
      const tx = txb.tx
      should(tx.txOuts[0].valueBn).be.eql(new Bn().fromNumber(0))
      should(tx.txOuts[0].script).be.eql(Script.fromAsmString('OP_FALSE OP_RETURN 0'))
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

  describe('#signWithKeyPairs', function () {
    it('should sign and verify synchronously', function () {
      // prepare
      const obj = prepareAndBuildTxBuilder()
      const txb = obj.txb
      const keyPair1 = obj.keyPair1
      const keyPair2 = obj.keyPair2
      const saddr1 = obj.saddr1
      const changeaddr = obj.changeaddr

      // begin signing
      txb.signWithKeyPairs([keyPair1])

      txb.sigOperations.map.get('0000000000000000000000000000000000000000000000000000000000000000:0')[0].log.should.equal('successfully inserted signature')
      txb.sigOperations.map.get('0000000000000000000000000000000000000000000000000000000000000000:0')[1].log.should.equal('successfully inserted public key')
      txb.sigOperations.map.get('0000000000000000000000000000000000000000000000000000000000000000:1')[0].log.should.equal('cannot find keyPair for addressStr 1CUNEBjYrCn2y1SdiUMohaKUi4wpP326Lb')
      txb.sigOperations.map.get('0000000000000000000000000000000000000000000000000000000000000000:1')[1].log.should.equal('cannot find keyPair for addressStr 1CUNEBjYrCn2y1SdiUMohaKUi4wpP326Lb')

      // transaction not fully signed yet, so should be invalid
      TxVerifier.verify(txb.tx, txb.uTxOutMap).should.equal(false)

      // this should effectively add
      txb.signWithKeyPairs([keyPair2])

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

      TxVerifier.verify(txb.tx, txb.uTxOutMap).should.equal(true)

      // re-signing just puts the same signatures back into the same place and
      // thus should still be valid
      txb.signWithKeyPairs([keyPair1, keyPair2])
      TxVerifier.verify(txb.tx, txb.uTxOutMap).should.equal(true)
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
      txb.signWithKeyPairs([keyPair1])

      txb.sigOperations.map.get('0000000000000000000000000000000000000000000000000000000000000000:0')[0].log.should.equal('successfully inserted signature')
      txb.sigOperations.map.get('0000000000000000000000000000000000000000000000000000000000000000:0')[1].log.should.equal('successfully inserted public key')
      txb.sigOperations.map.get('0000000000000000000000000000000000000000000000000000000000000000:1')[0].log.should.equal('cannot find keyPair for addressStr 1CUNEBjYrCn2y1SdiUMohaKUi4wpP326Lb')
      txb.sigOperations.map.get('0000000000000000000000000000000000000000000000000000000000000000:1')[1].log.should.equal('cannot find keyPair for addressStr 1CUNEBjYrCn2y1SdiUMohaKUi4wpP326Lb')

      // transaction not fully signed yet, so should be invalid
      TxVerifier.verify(txb.tx, txb.uTxOutMap).should.equal(false)

      // this should effectively add
      txb.signWithKeyPairs([keyPair2])

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

      TxVerifier.verify(txb.tx, txb.uTxOutMap).should.equal(true)

      // re-signing just puts the same signatures back into the same place and
      // thus should still be valid
      txb.signWithKeyPairs([keyPair1, keyPair2])
      TxVerifier.verify(txb.tx, txb.uTxOutMap).should.equal(true)
    })

    it('should work with custom scripts', () => {
      // make change address
      const privKey = new PrivKey().fromBn(new Bn(100))
      const keyPair = new KeyPair().fromPrivKey(privKey)
      const changeaddr = new Address().fromPubKey(keyPair.pubKey)

      // make addresses to send from (and to)
      const privKey1 = new PrivKey().fromBn(new Bn(1))
      const keyPair1 = new KeyPair().fromPrivKey(privKey1)
      const addr1 = new Address().fromPubKey(keyPair1.pubKey)

      const customScript = new Script().fromString('OP_DUP OP_HASH160 20 0x' + addr1.hashBuf.toString('hex') + ' OP_EQUALVERIFY OP_CHECKSIG')
      
      const txOut1 = TxOut.fromProperties(new Bn(1e8), customScript)
      
      const txHashBuf = Buffer.alloc(32)
      txHashBuf.fill(1)
      

      const txb = new TxBuilder()
      txb.setFeePerKbNum(0.0001e8)
      txb.setChangeAddress(changeaddr)
      txb.inputFromScript(
        txHashBuf, 
        0, 
        txOut1, 
        customScript
      )
      txb.build()
      should(() => txb.signWithKeyPairs([keyPair1])).not.throw()
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

      // partially sign - deliberately resulting in invalid tx
      txb.signWithKeyPairs([
        keyPair1,
        keyPair2,
        keyPair3
      ])

      // transaction not fully signed yet, so should be invalid
      TxVerifier.verify(txb.tx, txb.uTxOutMap).should.equal(false)

      // fully sign
      txb.signWithKeyPairs([
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

      TxVerifier.verify(txb.tx, txb.uTxOutMap).should.equal(true)

      // re-signing just puts the same signatures back into the same place and
      // thus should still be valid
      txb.signWithKeyPairs([
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
      TxVerifier.verify(txb.tx, txb.uTxOutMap).should.equal(true)
    })

    it('should be able to add more inputs to pay the fee', function () {
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

      // txOuts that we are spending
      const scriptout1 = new Script().fromString('OP_DUP OP_HASH160 20 0x' + addr1.hashBuf.toString('hex') + ' OP_EQUALVERIFY OP_CHECKSIG')
      const scriptout2 = new Script().fromString('OP_DUP OP_HASH160 20 0x' + addr2.hashBuf.toString('hex') + ' OP_EQUALVERIFY OP_CHECKSIG')
      const scriptout3 = new Script().fromString('OP_DUP OP_HASH160 20 0x' + addr3.hashBuf.toString('hex') + ' OP_EQUALVERIFY OP_CHECKSIG')
      const scriptout4 = new Script().fromString('OP_DUP OP_HASH160 20 0x' + addr4.hashBuf.toString('hex') + ' OP_EQUALVERIFY OP_CHECKSIG')

      const txOut1 = TxOut.fromProperties(new Bn(1e8), scriptout1)
      const txOut2 = TxOut.fromProperties(new Bn(1e8), scriptout2)
      const txOut3 = TxOut.fromProperties(new Bn(1e8), scriptout3)
      const txOut4 = TxOut.fromProperties(new Bn(1e8), scriptout4)
      // total balance: 4e8

      const txHashBuf = Buffer.alloc(32)
      txHashBuf.fill(1)
      const txOutNum1 = 0
      const txOutNum2 = 1
      const txOutNum3 = 2
      const txOutNum4 = 3

      const txb = new TxBuilder()
      txb.setFeePerKbNum(0.0001e8)
      txb.setChangeAddress(changeaddr)
      txb.inputFromPubKeyHash(txHashBuf, txOutNum1, txOut1)
      txb.inputFromPubKeyHash(txHashBuf, txOutNum2, txOut2)
      txb.inputFromPubKeyHash(txHashBuf, txOutNum3, txOut3)
      // don't add fourth input yet
      // txb.inputFromPubKeyHash(txHashBuf, txOutNum4, txOut4)

      // amount is sum of first three, but requires the fourth input to pay the fees
      txb.outputToAddress(new Bn(3e8), addr1)

      // first try failure
      let errors = 0
      try {
        txb.build()
      } catch (err) {
        errors++
      }
      errors.should.equal(1)

      // add fourth input. this should succeed.
      txb.inputFromPubKeyHash(txHashBuf, txOutNum4, txOut4)
      txb.build()
      // fully sign
      txb.signWithKeyPairs([
        keyPair1,
        keyPair2,
        keyPair3,
        keyPair4
      ])

      TxVerifier.verify(txb.tx, txb.uTxOutMap).should.equal(true)
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
      txb.signWithKeyPairs([keyPair1])

      txb.sigOperations.map.get('0000000000000000000000000000000000000000000000000000000000000000:0')[0].log.should.equal('successfully inserted signature')
      txb.sigOperations.map.get('0000000000000000000000000000000000000000000000000000000000000000:0')[1].log.should.equal('successfully inserted public key')
      txb.sigOperations.map.get('0000000000000000000000000000000000000000000000000000000000000000:1')[0].log.should.equal('cannot find keyPair for addressStr 1CUNEBjYrCn2y1SdiUMohaKUi4wpP326Lb')
      txb.sigOperations.map.get('0000000000000000000000000000000000000000000000000000000000000000:1')[1].log.should.equal('cannot find keyPair for addressStr 1CUNEBjYrCn2y1SdiUMohaKUi4wpP326Lb')

      // transaction not fully signed yet, so should be invalid
      TxVerifier.verify(txb.tx, txb.uTxOutMap).should.equal(false)

      // this should effectively add
      txb.signWithKeyPairs([keyPair2])

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

      TxVerifier.verify(txb.tx, txb.uTxOutMap).should.equal(true)

      // re-signing just puts the same signatures back into the same place and
      // thus should still be valid
      txb.signWithKeyPairs([keyPair1, keyPair2])
      TxVerifier.verify(txb.tx, txb.uTxOutMap).should.equal(true)
    })

    it('should sign and verify a really large number of inputs and outputs', function () {
      this.timeout(10000)
      const nIns = 100
      const nOuts = 100

      // make change address
      const privKey = new PrivKey().fromBn(new Bn(100))
      const keyPair = new KeyPair().fromPrivKey(privKey)
      const changeaddr = new Address().fromPubKey(keyPair.pubKey)

      // make addresses to send from (and to)
      const privKeys = []
      const keyPairs = []
      const addrs = []
      for (let i = 0; i < nIns; i++) {
        privKeys.push(new PrivKey().fromBn(new Bn(i + 1)))
        keyPairs.push(new KeyPair().fromPrivKey(privKeys[i]))
        addrs.push(new Address().fromPubKey(keyPairs[i].pubKey))
      }

      // txOuts that we are spending
      const scriptouts = []
      const txOuts = []
      for (let i = 0; i < nIns; i++) {
        scriptouts.push(new Script().fromString('OP_DUP OP_HASH160 20 0x' + addrs[i].hashBuf.toString('hex') + ' OP_EQUALVERIFY OP_CHECKSIG'))
        txOuts.push(TxOut.fromProperties(new Bn(1e8), scriptouts[i]))
      }
      // total input amount: nIns * 1e8

      const txb = new TxBuilder()
      txb.setFeePerKbNum(0.0001e8)
      txb.setChangeAddress(changeaddr)

      // put inputs into tx
      for (let i = 0; i < nIns; i++) {
        const txHashBuf = Buffer.alloc(32)
        txHashBuf.fill(i + 1)
        txb.inputFromPubKeyHash(txHashBuf, i, txOuts[i])
      }

      // put outputs into tx
      for (let i = 0; i < nOuts; i++) {
        txb.outputToAddress(new Bn(0.999e8), addrs[i])
      }
      // total sending: nOuts * 0.999e8

      txb.build({ useAllInputs: true })

      txb.tx.txIns.length.should.equal(nIns)
      txb.tx.txOuts.length.should.equal(nOuts + 1)

      // partially sign - deliberately resulting in invalid tx
      txb.signWithKeyPairs([
        keyPairs[0],
        keyPairs[1],
        keyPairs[2]
      ])

      // transaction not fully signed yet, so should be invalid
      TxVerifier.verify(txb.tx, txb.uTxOutMap).should.equal(false)

      // fully sign
      txb.signWithKeyPairs(keyPairs)

      TxVerifier.verify(txb.tx, txb.uTxOutMap).should.equal(true)
    })

    it('should sign and verify a large number of inputs and outputs with converting to/from JSON', function () {
      this.timeout(10000)
      const nIns = 50
      const nOuts = 50

      // make change address
      const privKey = new PrivKey().fromBn(new Bn(100))
      const keyPair = new KeyPair().fromPrivKey(privKey)
      const changeaddr = new Address().fromPubKey(keyPair.pubKey)

      // make addresses to send from (and to)
      const privKeys = []
      const keyPairs = []
      const addrs = []
      for (let i = 0; i < nIns; i++) {
        privKeys.push(new PrivKey().fromBn(new Bn(i + 1)))
        keyPairs.push(new KeyPair().fromPrivKey(privKeys[i]))
        addrs.push(new Address().fromPubKey(keyPairs[i].pubKey))
      }

      // txOuts that we are spending
      const scriptouts = []
      const txOuts = []
      for (let i = 0; i < nIns; i++) {
        scriptouts.push(new Script().fromString('OP_DUP OP_HASH160 20 0x' + addrs[i].hashBuf.toString('hex') + ' OP_EQUALVERIFY OP_CHECKSIG'))
        txOuts.push(TxOut.fromProperties(new Bn(1e8), scriptouts[i]))
      }
      // total input amount: nIns * 1e8

      let txb = new TxBuilder()
      txb.setFeePerKbNum(0.0001e8)
      txb.setChangeAddress(changeaddr)

      // put inputs into tx
      for (let i = 0; i < nIns; i++) {
        const txHashBuf = Buffer.alloc(32)
        txHashBuf.fill(i + 1)
        txb.inputFromPubKeyHash(txHashBuf, i, txOuts[i])
      }

      // put outputs into tx
      for (let i = 0; i < nOuts; i++) {
        txb.outputToAddress(new Bn(0.999e8), addrs[i])
      }
      // total sending: nOuts * 0.999e8

      txb.build({ useAllInputs: true })

      txb.tx.txIns.length.should.equal(nIns)
      txb.tx.txOuts.length.should.equal(nOuts + 1)

      // before signing, convert to/from JSON, simulating real-world wallet use-case
      txb = TxBuilder.fromJSON(txb.toJSON())

      // partially sign - deliberately resulting in invalid tx
      txb.signWithKeyPairs([
        keyPairs[0],
        keyPairs[1],
        keyPairs[2]
      ])

      // transaction not fully signed yet, so should be invalid
      TxVerifier.verify(txb.tx, txb.uTxOutMap).should.equal(false)

      // fully sign
      txb.signWithKeyPairs(keyPairs)

      TxVerifier.verify(txb.tx, txb.uTxOutMap).should.equal(true)
    })

    it('should sign and verify a large number of inputs and outputs, with incrementing amounts, with converting to/from JSON', function () {
      this.timeout(10000)
      const nIns = 50
      const nOuts = 30

      // make change address
      const privKey = new PrivKey().fromBn(new Bn(100))
      const keyPair = new KeyPair().fromPrivKey(privKey)
      const changeaddr = new Address().fromPubKey(keyPair.pubKey)

      // make addresses to send from (and to)
      const privKeys = []
      const keyPairs = []
      const addrs = []
      for (let i = 0; i < nIns; i++) {
        privKeys.push(new PrivKey().fromBn(new Bn(i + 1)))
        keyPairs.push(new KeyPair().fromPrivKey(privKeys[i]))
        addrs.push(new Address().fromPubKey(keyPairs[i].pubKey))
      }

      // txOuts that we are spending
      const scriptouts = []
      const txOuts = []
      for (let i = 0; i < nIns; i++) {
        scriptouts.push(new Script().fromString('OP_DUP OP_HASH160 20 0x' + addrs[i].hashBuf.toString('hex') + ' OP_EQUALVERIFY OP_CHECKSIG'))
        txOuts.push(TxOut.fromProperties(new Bn(1e8 * (i + 1)), scriptouts[i]))
      }
      // total input amount: nIns * 1e8

      let txb = new TxBuilder()
      txb.setFeePerKbNum(0.0001e8)
      txb.setChangeAddress(changeaddr)

      // put inputs into tx
      for (let i = 0; i < nIns; i++) {
        const txHashBuf = Buffer.alloc(32)
        txHashBuf.fill(i + 1)
        txb.inputFromPubKeyHash(txHashBuf, i, txOuts[i])
      }

      // put outputs into tx
      for (let i = 0; i < nOuts; i++) {
        txb.outputToAddress(new Bn(0.999e8 * (i + 1)), addrs[i])
      }
      // total sending: nOuts * 0.999e8

      txb.build({ useAllInputs: true })

      txb.tx.txIns.length.should.equal(nIns)
      txb.tx.txOuts.length.should.equal(nOuts + 1)

      // before signing, convert to/from JSON, simulating real-world wallet use-case
      txb = TxBuilder.fromJSON(txb.toJSON())

      // partially sign - deliberately resulting in invalid tx
      txb.signWithKeyPairs([
        keyPairs[0],
        keyPairs[1],
        keyPairs[2]
      ])

      // transaction not fully signed yet, so should be invalid
      TxVerifier.verify(txb.tx, txb.uTxOutMap).should.equal(false)

      // fully sign
      txb.signWithKeyPairs(keyPairs)

      TxVerifier.verify(txb.tx, txb.uTxOutMap).should.equal(true)
    })

    it('should sign and verify a large number of inputs and outputs, with the same key, with converting to/from JSON', function () {
      this.timeout(10000)
      const nIns = 50
      const nOuts = 30

      // make change address
      const privKey = new PrivKey().fromBn(new Bn(100))
      const keyPair = new KeyPair().fromPrivKey(privKey)
      const changeaddr = new Address().fromPubKey(keyPair.pubKey)

      // make addresses to send from (and to)
      const privKeys = []
      const keyPairs = []
      const addrs = []
      for (let i = 0; i < nIns; i++) {
        privKeys.push(new PrivKey().fromBn(new Bn(1)))
        keyPairs.push(new KeyPair().fromPrivKey(privKeys[i]))
        addrs.push(new Address().fromPubKey(keyPairs[i].pubKey))
      }

      // txOuts that we are spending
      const scriptouts = []
      const txOuts = []
      for (let i = 0; i < nIns; i++) {
        scriptouts.push(new Script().fromString('OP_DUP OP_HASH160 20 0x' + addrs[i].hashBuf.toString('hex') + ' OP_EQUALVERIFY OP_CHECKSIG'))
        txOuts.push(TxOut.fromProperties(new Bn(1e8), scriptouts[i]))
      }
      // total input amount: nIns * 1e8

      let txb = new TxBuilder()
      txb.setFeePerKbNum(0.0001e8)
      txb.setChangeAddress(changeaddr)

      // put inputs into tx
      for (let i = 0; i < nIns; i++) {
        const txHashBuf = Buffer.alloc(32)
        txHashBuf.fill(i + 1)
        txb.inputFromPubKeyHash(txHashBuf, i, txOuts[i])
      }

      // put outputs into tx
      for (let i = 0; i < nOuts; i++) {
        txb.outputToAddress(new Bn(0.999e8), addrs[i])
      }
      // total sending: nOuts * 0.999e8

      txb.build({ useAllInputs: true })

      txb.tx.txIns.length.should.equal(nIns)
      txb.tx.txOuts.length.should.equal(nOuts + 1)

      // before signing, convert to/from JSON, simulating real-world wallet use-case
      txb = TxBuilder.fromJSON(txb.toJSON())

      // fully sign
      txb.signWithKeyPairs(keyPairs)

      TxVerifier.verify(txb.tx, txb.uTxOutMap).should.equal(true)
    })

    it('should sign and verify a large number of inputs and outputs, with BIP 69 sorting, with converting to/from JSON', function () {
      this.timeout(10000)
      const nIns = 50
      const nOuts = 30

      // make change address
      const privKey = new PrivKey().fromBn(new Bn(100))
      const keyPair = new KeyPair().fromPrivKey(privKey)
      const changeaddr = new Address().fromPubKey(keyPair.pubKey)

      // make addresses to send from (and to)
      const privKeys = []
      const keyPairs = []
      const addrs = []
      for (let i = 0; i < nIns; i++) {
        privKeys.push(new PrivKey().fromBn(new Bn(1)))
        keyPairs.push(new KeyPair().fromPrivKey(privKeys[i]))
        addrs.push(new Address().fromPubKey(keyPairs[i].pubKey))
      }

      // txOuts that we are spending
      const scriptouts = []
      const txOuts = []
      for (let i = 0; i < nIns; i++) {
        scriptouts.push(new Script().fromString('OP_DUP OP_HASH160 20 0x' + addrs[i].hashBuf.toString('hex') + ' OP_EQUALVERIFY OP_CHECKSIG'))
        txOuts.push(TxOut.fromProperties(new Bn(1e8), scriptouts[i]))
      }
      // total input amount: nIns * 1e8

      let txb = new TxBuilder()
      txb.setFeePerKbNum(0.0001e8)
      txb.setChangeAddress(changeaddr)

      // put inputs into tx
      for (let i = 0; i < nIns; i++) {
        const txHashBuf = Buffer.alloc(32)
        txHashBuf.fill(i + 1)
        txb.inputFromPubKeyHash(txHashBuf, i, txOuts[i])
      }

      // put outputs into tx
      for (let i = 0; i < nOuts; i++) {
        txb.outputToAddress(new Bn(0.999e8), addrs[i])
      }
      // total sending: nOuts * 0.999e8

      txb.build({ useAllInputs: true })
      txb.sort()

      txb.tx.txIns.length.should.equal(nIns)
      txb.tx.txOuts.length.should.equal(nOuts + 1)

      // before signing, convert to/from JSON, simulating real-world wallet use-case
      txb = TxBuilder.fromJSON(txb.toJSON())

      // fully sign
      txb.signWithKeyPairs(keyPairs)

      TxVerifier.verify(txb.tx, txb.uTxOutMap).should.equal(true)
    })

    it('should sign and verify a large number of inputs and outputs, with BIP 69 sorting with incrementing amounts, with converting to/from JSON', function () {
      this.timeout(10000)
      const nIns = 50
      const nOuts = 30

      // make change address
      const privKey = new PrivKey().fromBn(new Bn(100))
      const keyPair = new KeyPair().fromPrivKey(privKey)
      const changeaddr = new Address().fromPubKey(keyPair.pubKey)

      // make addresses to send from (and to)
      const privKeys = []
      const keyPairs = []
      const addrs = []
      for (let i = 0; i < nIns; i++) {
        privKeys.push(new PrivKey().fromBn(new Bn(1)))
        keyPairs.push(new KeyPair().fromPrivKey(privKeys[i]))
        addrs.push(new Address().fromPubKey(keyPairs[i].pubKey))
      }

      // txOuts that we are spending
      const scriptouts = []
      const txOuts = []
      for (let i = 0; i < nIns; i++) {
        scriptouts.push(new Script().fromString('OP_DUP OP_HASH160 20 0x' + addrs[i].hashBuf.toString('hex') + ' OP_EQUALVERIFY OP_CHECKSIG'))
        txOuts.push(TxOut.fromProperties(new Bn(1e8 + i), scriptouts[i]))
      }
      // total input amount: nIns * 1e8...plus a bit due to incrementing amounts

      let txb = new TxBuilder()
      txb.setFeePerKbNum(0.0001e8)
      txb.setChangeAddress(changeaddr)

      // put inputs into tx
      for (let i = 0; i < nIns; i++) {
        const txHashBuf = Buffer.alloc(32)
        txHashBuf.fill(i + 1)
        txb.inputFromPubKeyHash(txHashBuf, i, txOuts[i])
      }

      // put outputs into tx
      for (let i = 0; i < nOuts; i++) {
        txb.outputToAddress(new Bn(0.999e8), addrs[i])
      }
      // total sending: nOuts * 0.999e8

      txb.build({ useAllInputs: true })
      txb.sort()

      txb.tx.txIns.length.should.equal(nIns)
      txb.tx.txOuts.length.should.equal(nOuts + 1)

      // before signing, convert to/from JSON, simulating real-world wallet use-case
      txb = TxBuilder.fromJSON(txb.toJSON())

      // fully sign
      txb.signWithKeyPairs(keyPairs)

      TxVerifier.verify(txb.tx, txb.uTxOutMap).should.equal(true)
    })

    it('should sign and verify a large number of inputs and outputs, with BIP 69 sorting with decrementing amounts, with converting to/from JSON', function () {
      this.timeout(10000)
      const nIns = 50
      const nOuts = 30

      // make change address
      const privKey = new PrivKey().fromBn(new Bn(100))
      const keyPair = new KeyPair().fromPrivKey(privKey)
      const changeaddr = new Address().fromPubKey(keyPair.pubKey)

      // make addresses to send from (and to)
      const privKeys = []
      const keyPairs = []
      const addrs = []
      for (let i = 0; i < nIns; i++) {
        privKeys.push(new PrivKey().fromBn(new Bn(1)))
        keyPairs.push(new KeyPair().fromPrivKey(privKeys[i]))
        addrs.push(new Address().fromPubKey(keyPairs[i].pubKey))
      }

      // txOuts that we are spending
      const scriptouts = []
      const txOuts = []
      for (let i = 0; i < nIns; i++) {
        scriptouts.push(new Script().fromString('OP_DUP OP_HASH160 20 0x' + addrs[i].hashBuf.toString('hex') + ' OP_EQUALVERIFY OP_CHECKSIG'))
        txOuts.push(TxOut.fromProperties(new Bn(1e8 + 10000 - i), scriptouts[i]))
      }
      // total input amount: nIns * 1e8...plus a bit due to incrementing amounts

      let txb = new TxBuilder()
      txb.setFeePerKbNum(0.0001e8)
      txb.setChangeAddress(changeaddr)

      // put inputs into tx
      for (let i = 0; i < nIns; i++) {
        const txHashBuf = Buffer.alloc(32)
        txHashBuf.fill(i + 1)
        txb.inputFromPubKeyHash(txHashBuf, i, txOuts[i])
      }

      // put outputs into tx
      for (let i = 0; i < nOuts; i++) {
        txb.outputToAddress(new Bn(0.999e8), addrs[i])
      }
      // total sending: nOuts * 0.999e8

      txb.build({ useAllInputs: true })
      txb.sort()

      txb.tx.txIns.length.should.equal(nIns)
      txb.tx.txOuts.length.should.equal(nOuts + 1)

      // before signing, convert to/from JSON, simulating real-world wallet use-case
      txb = TxBuilder.fromJSON(txb.toJSON())

      // fully sign
      txb.signWithKeyPairs(keyPairs)

      TxVerifier.verify(txb.tx, txb.uTxOutMap).should.equal(true)
    })

    it('should sign and verify with one output if change is less than dust with dropping change with converting to/from JSON', function () {
      this.timeout(10000)
      const nIns = 3
      const nOuts = 1

      // make change address
      const privKey = new PrivKey().fromBn(new Bn(100))
      const keyPair = new KeyPair().fromPrivKey(privKey)
      const changeaddr = new Address().fromPubKey(keyPair.pubKey)

      // make addresses to send from (and to)
      const privKeys = []
      const keyPairs = []
      const addrs = []
      for (let i = 0; i < nIns; i++) {
        privKeys.push(new PrivKey().fromBn(new Bn(1)))
        keyPairs.push(new KeyPair().fromPrivKey(privKeys[i]))
        addrs.push(new Address().fromPubKey(keyPairs[i].pubKey))
      }

      // txOuts that we are spending
      const scriptouts = []
      const txOuts = []
      for (let i = 0; i < nIns; i++) {
        scriptouts.push(new Script().fromString('OP_DUP OP_HASH160 20 0x' + addrs[i].hashBuf.toString('hex') + ' OP_EQUALVERIFY OP_CHECKSIG'))
        txOuts.push(TxOut.fromProperties(new Bn(200), scriptouts[i]))
      }
      // total input amount: nIns * 1e8 = 600

      let txb = new TxBuilder()
      txb.setFeePerKbNum(1)
      txb.sendDustChangeToFees(true)
      txb.setChangeAddress(changeaddr)

      // put inputs into tx
      for (let i = 0; i < nIns; i++) {
        const txHashBuf = Buffer.alloc(32)
        txHashBuf.fill(i + 1)
        txb.inputFromPubKeyHash(txHashBuf, i, txOuts[i])
      }

      // put outputs into tx
      for (let i = 0; i < nOuts; i++) {
        txb.outputToAddress(new Bn(590), addrs[i])
      }
      // total sending: nOuts * 0.999e8

      txb.build({ useAllInputs: true })

      txb.tx.txIns.length.should.equal(nIns)
      txb.tx.txOuts.length.should.equal(nOuts)

      // before signing, convert to/from JSON, simulating real-world wallet use-case
      txb = TxBuilder.fromJSON(txb.toJSON())

      // fully sign
      txb.signWithKeyPairs(keyPairs)

      TxVerifier.verify(txb.tx, txb.uTxOutMap).should.equal(true)
    })

    it('should sign and verify a large number of inputs and outputs, with very small amounts for inputs (1000 satoshis), with converting to/from JSON', function () {
      this.timeout(10000)
      const nIns = 100
      const nOuts = 1

      // make change address
      const privKey = new PrivKey().fromBn(new Bn(100))
      const keyPair = new KeyPair().fromPrivKey(privKey)
      const changeaddr = new Address().fromPubKey(keyPair.pubKey)

      // make addresses to send from (and to)
      const privKeys = []
      const keyPairs = []
      const addrs = []
      for (let i = 0; i < nIns; i++) {
        privKeys.push(new PrivKey().fromBn(new Bn(i + 1)))
        keyPairs.push(new KeyPair().fromPrivKey(privKeys[i]))
        addrs.push(new Address().fromPubKey(keyPairs[i].pubKey))
      }

      // txOuts that we are spending
      const scriptouts = []
      const txOuts = []
      for (let i = 0; i < nIns; i++) {
        scriptouts.push(new Script().fromString('OP_DUP OP_HASH160 20 0x' + addrs[i].hashBuf.toString('hex') + ' OP_EQUALVERIFY OP_CHECKSIG'))
        txOuts.push(TxOut.fromProperties(new Bn(1000), scriptouts[i]))
      }
      // total input amount: nIns * 1e8

      let txb = new TxBuilder()
      txb.setFeePerKbNum(0.0000500e8)
      txb.setChangeAddress(changeaddr)

      // put inputs into tx
      for (let i = 0; i < nIns; i++) {
        const txHashBuf = Buffer.alloc(32)
        txHashBuf.fill(i + 1)
        txb.inputFromPubKeyHash(txHashBuf, i, txOuts[i])
      }

      // put outputs into tx
      for (let i = 0; i < nOuts; i++) {
        txb.outputToAddress(new Bn(1000), addrs[i])
      }
      // total sending: nOuts * 0.999e8

      txb.build({ useAllInputs: true })

      txb.tx.txIns.length.should.equal(nIns)
      txb.tx.txOuts.length.should.equal(nOuts + 1)

      // before signing, convert to/from JSON, simulating real-world wallet use-case
      txb = TxBuilder.fromJSON(txb.toJSON())

      // fully sign
      txb.signWithKeyPairs(keyPairs)

      TxVerifier.verify(txb.tx, txb.uTxOutMap).should.equal(true)
    })

    it('should sign and verify a large number of inputs and outputs, with very small amounts for inputs (1000 satoshis, 0.01 sat/byte fee), with converting to/from JSON', function () {
      this.timeout(10000)
      const nIns = 100
      const nOuts = 1

      // make change address
      const privKey = new PrivKey().fromBn(new Bn(100))
      const keyPair = new KeyPair().fromPrivKey(privKey)
      const changeaddr = new Address().fromPubKey(keyPair.pubKey)

      // make addresses to send from (and to)
      const privKeys = []
      const keyPairs = []
      const addrs = []
      for (let i = 0; i < nIns; i++) {
        privKeys.push(new PrivKey().fromBn(new Bn(i + 1)))
        keyPairs.push(new KeyPair().fromPrivKey(privKeys[i]))
        addrs.push(new Address().fromPubKey(keyPairs[i].pubKey))
      }

      // txOuts that we are spending
      const scriptouts = []
      const txOuts = []
      for (let i = 0; i < nIns; i++) {
        scriptouts.push(new Script().fromString('OP_DUP OP_HASH160 20 0x' + addrs[i].hashBuf.toString('hex') + ' OP_EQUALVERIFY OP_CHECKSIG'))
        txOuts.push(TxOut.fromProperties(new Bn(1000), scriptouts[i]))
      }
      // total input amount: nIns * 1e8

      let txb = new TxBuilder()
      txb.setFeePerKbNum(0.0000010e8)
      txb.setChangeAddress(changeaddr)

      // put inputs into tx
      for (let i = 0; i < nIns; i++) {
        const txHashBuf = Buffer.alloc(32)
        txHashBuf.fill(i + 1)
        txb.inputFromPubKeyHash(txHashBuf, i, txOuts[i])
      }

      // put outputs into tx
      for (let i = 0; i < nOuts; i++) {
        txb.outputToAddress(new Bn(1000), addrs[i])
      }
      // total sending: nOuts * 0.999e8

      txb.build({ useAllInputs: true })

      txb.tx.txIns.length.should.equal(nIns)
      txb.tx.txOuts.length.should.equal(nOuts + 1)

      // before signing, convert to/from JSON, simulating real-world wallet use-case
      txb = TxBuilder.fromJSON(txb.toJSON())

      // fully sign
      txb.signWithKeyPairs(keyPairs)

      TxVerifier.verify(txb.tx, txb.uTxOutMap).should.equal(true)
    })

    it('should sign and verify a large number of inputs and outputs, with very small amounts for inputs (1499 satoshis, 0.01 sat/byte fee), with converting to/from JSON', function () {
      this.timeout(10000)
      const nIns = 100
      const nOuts = 1

      // make change address
      const privKey = new PrivKey().fromBn(new Bn(100))
      const keyPair = new KeyPair().fromPrivKey(privKey)
      const changeaddr = new Address().fromPubKey(keyPair.pubKey)

      // make addresses to send from (and to)
      const privKeys = []
      const keyPairs = []
      const addrs = []
      for (let i = 0; i < nIns; i++) {
        privKeys.push(new PrivKey().fromBn(new Bn(i + 1)))
        keyPairs.push(new KeyPair().fromPrivKey(privKeys[i]))
        addrs.push(new Address().fromPubKey(keyPairs[i].pubKey))
      }

      // txOuts that we are spending
      const scriptouts = []
      const txOuts = []
      for (let i = 0; i < nIns; i++) {
        scriptouts.push(new Script().fromString('OP_DUP OP_HASH160 20 0x' + addrs[i].hashBuf.toString('hex') + ' OP_EQUALVERIFY OP_CHECKSIG'))
        txOuts.push(TxOut.fromProperties(new Bn(1499), scriptouts[i]))
      }
      // total input amount: nIns * 1e8

      let txb = new TxBuilder()
      txb.setFeePerKbNum(0.0000010e8)
      txb.setChangeAddress(changeaddr)

      // put inputs into tx
      for (let i = 0; i < nIns; i++) {
        const txHashBuf = Buffer.alloc(32)
        txHashBuf.fill(i + 1)
        txb.inputFromPubKeyHash(txHashBuf, i, txOuts[i])
      }

      // put outputs into tx
      for (let i = 0; i < nOuts; i++) {
        txb.outputToAddress(new Bn(1000), addrs[i])
      }
      // total sending: nOuts * 0.999e8

      txb.build({ useAllInputs: true })

      txb.tx.txIns.length.should.equal(nIns)
      txb.tx.txOuts.length.should.equal(nOuts + 1)

      // before signing, convert to/from JSON, simulating real-world wallet use-case
      txb = TxBuilder.fromJSON(txb.toJSON())

      // fully sign
      txb.signWithKeyPairs(keyPairs)

      TxVerifier.verify(txb.tx, txb.uTxOutMap).should.equal(true)
    })

    it('should sign and verify a large number of inputs and outputs, with very small amounts for inputs (1499 satoshis, 0.5 sat/byte fee), with converting to/from JSON', function () {
      this.timeout(10000)
      const nIns = 100
      const nOuts = 1

      // make change address
      const privKey = new PrivKey().fromBn(new Bn(100))
      const keyPair = new KeyPair().fromPrivKey(privKey)
      const changeaddr = new Address().fromPubKey(keyPair.pubKey)

      // make addresses to send from (and to)
      const privKeys = []
      const keyPairs = []
      const addrs = []
      for (let i = 0; i < nIns; i++) {
        privKeys.push(new PrivKey().fromBn(new Bn(i + 1)))
        keyPairs.push(new KeyPair().fromPrivKey(privKeys[i]))
        addrs.push(new Address().fromPubKey(keyPairs[i].pubKey))
      }

      // txOuts that we are spending
      const scriptouts = []
      const txOuts = []
      for (let i = 0; i < nIns; i++) {
        scriptouts.push(new Script().fromString('OP_DUP OP_HASH160 20 0x' + addrs[i].hashBuf.toString('hex') + ' OP_EQUALVERIFY OP_CHECKSIG'))
        txOuts.push(TxOut.fromProperties(new Bn(1499), scriptouts[i]))
      }
      // total input amount: nIns * 1e8

      let txb = new TxBuilder()
      txb.setFeePerKbNum(0.0000500e8)
      txb.setChangeAddress(changeaddr)

      // put inputs into tx
      for (let i = 0; i < nIns; i++) {
        const txHashBuf = Buffer.alloc(32)
        txHashBuf.fill(i + 1)
        txb.inputFromPubKeyHash(txHashBuf, i, txOuts[i])
      }

      // put outputs into tx
      for (let i = 0; i < nOuts; i++) {
        txb.outputToAddress(new Bn(1000), addrs[i])
      }
      // total sending: nOuts * 0.999e8

      txb.build({ useAllInputs: true })

      txb.tx.txIns.length.should.equal(nIns)
      txb.tx.txOuts.length.should.equal(nOuts + 1)

      // before signing, convert to/from JSON, simulating real-world wallet use-case
      txb = TxBuilder.fromJSON(txb.toJSON())

      // fully sign
      txb.signWithKeyPairs(keyPairs)

      TxVerifier.verify(txb.tx, txb.uTxOutMap).should.equal(true)
    })

    it('should not mess up with bip 69 sorting with this known txbuilder object', function () {
      this.timeout(10000)
      const txbJSON = '{"tx":"0100000005b27d77a351245f3ed2c38e40114d432ffecee69d8c64dc06fe427a1ac09f1b40000000006b483045022100f7831904c76f49e23bdd5d2813cd708074ec77d345a0311ee7150fcfcd494cf3022058cbce7ea22b8d759c35d37a375ce0c73b9e1e87d047cb7748ade1fd082370d1412102bf0925d874daedbc1e0abdffa399b2b2042fddbba1cca850cdfdfc3ec9f218ffffffffff98f1664e4ad769225b39033b5a7269afdff54cc676908724d74d4efdebc2ee59000000006b483045022100f2e3195d6c104aacbf04589916d3e529414abbc8379b7d92fa6d32c32c297f05022024775901b5d71cb639297cf9b757d97738b16715023320ef9a51311bb1a97e94412102cd925e193fe4e0848e1f99e0975904a73eea7f779ff0e870115ad16b784803ceffffffff011ac299dce0415097d1fd67287e83cb92fbd2b9b7efe2c91751eb454e05c394000000006a4730440220739794fc726b205a34569c590d32e13459f5127fcf71d2169fc5944a727de8be0220505d2cbedc63514a6147fe756d45f7faf9bd5852df446fa35b62b554fb2d32514121034828cbbf04f9ae5608fdcf47598e191846b4970c1b6eda66519661ca75035a9dffffffffe85c87e34ed16ab8988fc398c16b9738f6032e9a4377b6636e2ec6a0ee752fcb000000006a473044022030e01c5bda4da0d4aadec98c5ece7b3529509b0aef6f437a14417abaf833956002207d8ece580800807132bca535ce06398ac5c68c68acd20566ecd3db0ecd58d7114121033fb03af6776d59cdb6ae78dff502d36b5a51429f243116f827e3d7438343b213ffffffff19cc6850ec0e9b8a01ef6ea0ef9888fbdc0e6794b9a6b7c7c36621d80665a0ec000000006b4830450221009f25a7e50bc857eb75f6dd06b55ec495a3f11c73f1f0151190bbb417f051978b02207169bb7aaa05d58dcc50f091d9b0a584157420cc2e4c3d841cafddf891356a95412103582a67dd32baefe4063e0408809bc740df4233c44dc2e5e3737de5c2249f0863ffffffff028d160000000000001976a914821972770205b3466023acd90790f95aee37914488accc580300000000001976a9145ff56ab8054c9e038254ee92f9ba364f84c2736188ac00000000","txIns":["98f1664e4ad769225b39033b5a7269afdff54cc676908724d74d4efdebc2ee5900000000020000ffffffff","011ac299dce0415097d1fd67287e83cb92fbd2b9b7efe2c91751eb454e05c39400000000020000ffffffff","b27d77a351245f3ed2c38e40114d432ffecee69d8c64dc06fe427a1ac09f1b4000000000020000ffffffff","e85c87e34ed16ab8988fc398c16b9738f6032e9a4377b6636e2ec6a0ee752fcb00000000020000ffffffff","19cc6850ec0e9b8a01ef6ea0ef9888fbdc0e6794b9a6b7c7c36621d80665a0ec00000000020000ffffffff"],"txOuts":["cc580300000000001976a9145ff56ab8054c9e038254ee92f9ba364f84c2736188ac"],"uTxOutMap":{"98f1664e4ad769225b39033b5a7269afdff54cc676908724d74d4efdebc2ee59:0":"f9140000000000001976a9145629fb19a3c46420707f61785c1b63cc69b7da3288ac","011ac299dce0415097d1fd67287e83cb92fbd2b9b7efe2c91751eb454e05c394:0":"1ad70000000000001976a91462698da42f87021fc8cdb4c945d09d93e82480a088ac","b27d77a351245f3ed2c38e40114d432ffecee69d8c64dc06fe427a1ac09f1b40:0":"acd60000000000001976a9144c6daa9f0afa439dc98075c531e1fb614139818e88ac","e85c87e34ed16ab8988fc398c16b9738f6032e9a4377b6636e2ec6a0ee752fcb:0":"1ad70000000000001976a914841067d1f0abdd78ef8feb3aa42b52c0d7ee83a188ac","19cc6850ec0e9b8a01ef6ea0ef9888fbdc0e6794b9a6b7c7c36621d80665a0ec:0":"1ad70000000000001976a914d3647137576bc3561444a2c84018c942796ab5bb88ac"},"sigOperations":{"98f1664e4ad769225b39033b5a7269afdff54cc676908724d74d4efdebc2ee59:0":[{"nScriptChunk":0,"type":"sig","addressStr":"18rbQNxxgYdpMnsvNjvbXJP1TBZ9zQM3WJ","nHashType":65,"log":"successfully inserted signature"},{"nScriptChunk":1,"type":"pubKey","addressStr":"18rbQNxxgYdpMnsvNjvbXJP1TBZ9zQM3WJ","nHashType":65,"log":"successfully inserted public key"}],"011ac299dce0415097d1fd67287e83cb92fbd2b9b7efe2c91751eb454e05c394:0":[{"nScriptChunk":0,"type":"sig","addressStr":"19yMfmgJAEsGHUS4J6ZXqtv3Z4hG3NT4pA","nHashType":65,"log":"successfully inserted signature"},{"nScriptChunk":1,"type":"pubKey","addressStr":"19yMfmgJAEsGHUS4J6ZXqtv3Z4hG3NT4pA","nHashType":65,"log":"successfully inserted public key"}],"b27d77a351245f3ed2c38e40114d432ffecee69d8c64dc06fe427a1ac09f1b40:0":[{"nScriptChunk":0,"type":"sig","addressStr":"17y7jLk1f1oQcV78pRsnv7dUNBLnFUzakZ","nHashType":65,"log":"successfully inserted signature"},{"nScriptChunk":1,"type":"pubKey","addressStr":"17y7jLk1f1oQcV78pRsnv7dUNBLnFUzakZ","nHashType":65,"log":"successfully inserted public key"}],"e85c87e34ed16ab8988fc398c16b9738f6032e9a4377b6636e2ec6a0ee752fcb:0":[{"nScriptChunk":0,"type":"sig","addressStr":"1D3HrCYVc1fybgtY4e8Yhg1k1KF7X9C725","nHashType":65,"log":"successfully inserted signature"},{"nScriptChunk":1,"type":"pubKey","addressStr":"1D3HrCYVc1fybgtY4e8Yhg1k1KF7X9C725","nHashType":65,"log":"successfully inserted public key"}],"19cc6850ec0e9b8a01ef6ea0ef9888fbdc0e6794b9a6b7c7c36621d80665a0ec:0":[{"nScriptChunk":0,"type":"sig","addressStr":"1LGjuKv9eqPUzg2YsMdfzJWckuAwfcnmZo","nHashType":65,"log":"successfully inserted signature"},{"nScriptChunk":1,"type":"pubKey","addressStr":"1LGjuKv9eqPUzg2YsMdfzJWckuAwfcnmZo","nHashType":65,"log":"successfully inserted public key"}]},"changeScript":"76a914821972770205b3466023acd90790f95aee37914488ac","changeAmountBn":5773,"feeAmountBn":410,"feePerKbNum":500,"sigsPerInput":1,"dust":546,"dustChangeToFees":true,"hashCache":{"prevoutsHashBuf":"1d67bdef4b743591ada4922b5af092d7cce85efcf8f630e94afcde068f6fa2d0","sequenceHashBuf":"99399659a6e129b6497faa061be7d8f6558a8594b5dd80474859a12d6ccf0b20","outputsHashBuf":"bcda35b250afaa69c8ffe37021ebece36afbe749c1935f69de3eab93e450fd3d"}}'
      const txb = TxBuilder.fromJSON(JSON.parse(txbJSON))

      const keyPairs = []
      keyPairs.push(KeyPair.fromJSON(JSON.parse('{"privKey":"8032334c28c99a38fce22a6d4224e766d894e727a0a9cccfd2038fe4d4ca23ec9901","pubKey":"0104cd925e193fe4e0848e1f99e0975904a73eea7f779ff0e870115ad16b784803ce70874550b3e86a8d670422d4e138c9f7700e4903f1d1e4af35eac9fba6377ef4"}')))
      keyPairs.push(KeyPair.fromJSON(JSON.parse('{"privKey":"803f50e990b3518c654c022f6bc8ee9464db857aee821133bbe8090c035f81851201","pubKey":"01044828cbbf04f9ae5608fdcf47598e191846b4970c1b6eda66519661ca75035a9dd6228621b4462f6a6791897b6d60b2ec1492509ba871a707b34bf94eade868e5"}')))
      keyPairs.push(KeyPair.fromJSON(JSON.parse('{"privKey":"80f7744e00816dc306b7c452fef77883317efbd59863f7adcac0a0d95b489b196701","pubKey":"0104bf0925d874daedbc1e0abdffa399b2b2042fddbba1cca850cdfdfc3ec9f218ff0bdb932b2ced35cefc0988116b426cbb68f563c401329e77e9eaae29256aad5c"}')))
      keyPairs.push(KeyPair.fromJSON(JSON.parse('{"privKey":"805d3c50621207fc5783c82bf7e7f090161154818467258c49368dfbf95a6cb5a301","pubKey":"01043fb03af6776d59cdb6ae78dff502d36b5a51429f243116f827e3d7438343b213ab07f6bc08e1a0afba025e0cd34395afedce01bf8e9b6b7c6d385eaaee57403d"}')))
      keyPairs.push(KeyPair.fromJSON(JSON.parse('{"privKey":"80aaf1703f957b80a023088c5a04c9fb4d4950705dcd8b7aaf6cd9eea66e807f8801","pubKey":"0104582a67dd32baefe4063e0408809bc740df4233c44dc2e5e3737de5c2249f08630bb6640376b7ed60ed12ec161a458c8bbb3417a7e3474a3e9436cc32d9296627"}')))

      let txVerifier = new TxVerifier(txb.tx, txb.uTxOutMap)

      // txb.uTxOutMap.map.forEach((txOut, label) => {
      //   console.log(label, Address.fromTxOutScript(txOut.script).toString(), txOut.valueBn.toNumber())
      // })

      // txb.tx.txIns.forEach((txIn, nIn) => {
      //   const verified = txVerifier.verifyNIn(nIn, Interp.SCRIPT_ENABLE_SIGHASH_FORKID)
      //   console.log(txIn.txHashBuf.toString('hex'), txIn.txOutNum, Address.fromTxInScript(txIn.script).toString(), verified)
      // })

      txVerifier.verify().should.equal(false) // this was computed with signatures in the wrong place; it should be invalid

      const txb2 = new TxBuilder()
      txb2.sendDustChangeToFees(true)
      txb2.setChangeAddress(Address.fromTxOutScript(txb.changeScript))
      txb2.inputFromPubKeyHash(txb.txIns[0].txHashBuf, txb.txIns[0].txOutNum, txb.uTxOutMap.get(txb.txIns[0].txHashBuf, txb.txIns[0].txOutNum))
      txb2.inputFromPubKeyHash(txb.txIns[1].txHashBuf, txb.txIns[1].txOutNum, txb.uTxOutMap.get(txb.txIns[1].txHashBuf, txb.txIns[1].txOutNum))
      txb2.inputFromPubKeyHash(txb.txIns[2].txHashBuf, txb.txIns[2].txOutNum, txb.uTxOutMap.get(txb.txIns[2].txHashBuf, txb.txIns[2].txOutNum))
      txb2.inputFromPubKeyHash(txb.txIns[3].txHashBuf, txb.txIns[3].txOutNum, txb.uTxOutMap.get(txb.txIns[3].txHashBuf, txb.txIns[3].txOutNum))
      txb2.inputFromPubKeyHash(txb.txIns[4].txHashBuf, txb.txIns[4].txOutNum, txb.uTxOutMap.get(txb.txIns[4].txHashBuf, txb.txIns[4].txOutNum))

      txb2.build({ useAllInputs: true })
      txb2.sort() // NOT sorting should lead to valid tx
      txb2.signWithKeyPairs(keyPairs)

      let txVerifier2 = new TxVerifier(txb2.tx, txb2.uTxOutMap)

      // txb2.uTxOutMap.map.forEach((txOut, label) => {
      //   console.log(label, Address.fromTxOutScript(txOut.script).toString(), txOut.valueBn.toNumber())
      // })

      // txb2.tx.txIns.forEach((txIn, nIn) => {
      //   const verified = txVerifier2.verifyNIn(nIn, Interp.SCRIPT_ENABLE_SIGHASH_FORKID)
      //   console.log(txIn.txHashBuf.toString('hex'), txIn.txOutNum, Address.fromTxInScript(txIn.script).toString(), verified)
      // })

      txVerifier2.verify().should.equal(true)
    })
  })
})
