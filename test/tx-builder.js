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
let TxOutmap = require('../lib/tx-out-map')
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

    // txouts that we are spending

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

    let txout1 = new TxOut(new Bn(1e8), scriptout1)
    let txout2 = new TxOut(new Bn(1e8), scriptout2)
    let txout3 = new TxOut(new Bn(1e8), scriptout3)
    let txout4 = new TxOut(new Bn(1e8), scriptout4)
    // total balance: 4e8

    let txHashBuf = new Buffer(32)
    txHashBuf.fill(0)
    let txOutNum1 = 0
    let txOutNum2 = 1
    let txOutNum3 = 2
    let txOutNum4 = 3

    txb.setFeePerKbNum(0.0001e8)
    txb.setChangeAddress(changeaddr)
    txb.fromPubKeyHash(txHashBuf, txOutNum1, txout1, keyPair1.pubKey)
    txb.fromPubKeyHash(txHashBuf, txOutNum2, txout2, keyPair2.pubKey)
    txb.fromScriptHashMultisig(txHashBuf, txOutNum3, txout3, redeemScript3)
    txb.fromScriptHashMultisig(txHashBuf, txOutNum4, txout4, redeemScript4)
    txb.toAddress(new Bn(2e8), saddr1) // pubKeyHash address
    txb.toAddress(new Bn(1e8), saddr2) // p2sh address
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
      txout1,
      txout2,
      txout3,
      txout4
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
      should.exist(json.txins)
      should.exist(json.txins[0])
      should.exist(json.txouts)
      should.exist(json.utxoutmap)
      should.exist(json.txouts[0])
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
      json2.txins[0].should.equal(json.txins[0])
      json2.txouts[0].should.equal(json.txouts[0])
      JSON.stringify(json2.utxoutmap).should.equal(JSON.stringify(json.utxoutmap))
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
    it('should set the version', function () {
      let obj = prepareTxBuilder()
      let txb = obj.txb
      txb.setVersion(2)
      txb.build()
      txb.tx.version.should.equal(2)
    })
  })

  describe('#importPartiallySignedTx', function () {
    it('should set tx', function () {
      let tx = new Tx()
      let txb = new TxBuilder().importPartiallySignedTx(tx)
      should.exist(txb.tx)
    })

    it('should set tx and utxoutmap', function () {
      let tx = new Tx()
      let utxoutmap = TxOutmap()
      let txb = new TxBuilder().importPartiallySignedTx(tx, utxoutmap)
      should.exist(txb.tx)
      should.exist(txb.utxoutmap)
    })
  })

  describe('#toAddress', function () {
    it('should add a scripthash address', function () {
      let hashBuf = new Buffer(20)
      hashBuf.fill(0)
      let address = new Address().fromRedeemScript(new Script().fromScriptHash(hashBuf))
      let txb = new TxBuilder()
      txb.toAddress(new Bn(0), address)
      txb.txouts.length.should.equal(1)
    })

    it('should add a pubKeyHash address', function () {
      let pubKey = new PubKey().fromPrivKey(new PrivKey().fromRandom())
      let address = new Address().fromPubKey(pubKey)
      let txb = new TxBuilder()
      txb.toAddress(new Bn(0), address)
      txb.txouts.length.should.equal(1)
    })
  })

  describe('#toScript', function () {
    it('should add an OP_RETURN output', function () {
      let script = new Script().fromString('OP_RETURN')
      let txb = new TxBuilder()
      txb.toScript(new Bn(0), script)
      txb.txouts.length.should.equal(1)
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

  describe('#fromScript', function () {
    it('should add an input from a script', function () {
      let keyPair = new KeyPair().fromRandom()
      let address = new Address().fromPubKey(keyPair.pubKey)
      let txout = new TxOut(new Bn(1000), new Script().fromPubKeyHash(address.hashBuf))
      let script = new Script().fromString('OP_RETURN')
      let txHashBuf = new Buffer(32)
      txHashBuf.fill(0)
      let txOutNum = 0
      let txbuilder = new TxBuilder().fromScript(txHashBuf, txOutNum, txout, script)
      txbuilder.txins.length.should.equal(1)
    })

    it('should add an input from a script and set nSequence', function () {
      let keyPair = new KeyPair().fromRandom()
      let address = new Address().fromPubKey(keyPair.pubKey)
      let txout = new TxOut(new Bn(1000), new Script().fromPubKeyHash(address.hashBuf))
      let script = new Script().fromString('OP_RETURN')
      let txHashBuf = new Buffer(32)
      txHashBuf.fill(0)
      let txOutNum = 0
      let txbuilder = new TxBuilder().fromScript(txHashBuf, txOutNum, txout, script, 0xf0f0f0f0)
      txbuilder.txins.length.should.equal(1)
      txbuilder.txins[0].nSequence.should.equal(0xf0f0f0f0)
    })
  })

  describe('#fromPubKeyHash', function () {
    it('should add an input from a pubKeyHash output', function () {
      let keyPair = new KeyPair().fromRandom()
      let address = new Address().fromPubKey(keyPair.pubKey)
      let txout = new TxOut(new Bn(1000), new Script().fromPubKeyHash(address.hashBuf))
      let txHashBuf = new Buffer(32)
      txHashBuf.fill(0)
      let txOutNum = 0
      let txbuilder = new TxBuilder().fromPubKeyHash(txHashBuf, txOutNum, txout, keyPair.pubKey)
      Buffer.compare(txbuilder.txins[0].script.chunks[1].buf, keyPair.pubKey.toBuffer()).should.equal(0)
    })

    it('should add an input from a pubKeyHash output and set nSequence', function () {
      let keyPair = new KeyPair().fromRandom()
      let address = new Address().fromPubKey(keyPair.pubKey)
      let txout = new TxOut(new Bn(1000), new Script().fromPubKeyHash(address.hashBuf))
      let txHashBuf = new Buffer(32)
      txHashBuf.fill(0)
      let txOutNum = 0
      let txbuilder = new TxBuilder().fromPubKeyHash(txHashBuf, txOutNum, txout, keyPair.pubKey, 0xf0f0f0f0)
      Buffer.compare(txbuilder.txins[0].script.chunks[1].buf, keyPair.pubKey.toBuffer()).should.equal(0)
      txbuilder.txins[0].nSequence.should.equal(0xf0f0f0f0)
    })
  })

  describe('#fromScriptHashMultisig', function () {
    it('should add an input from a scripthash output', function () {
      let keyPair1 = new KeyPair().fromRandom()
      let keyPair2 = new KeyPair().fromRandom()
      let script = new Script().fromPubKeys(2, [keyPair1.pubKey, keyPair2.pubKey])
      let address = new Address().fromRedeemScript(script)
      let txout = new TxOut(new Bn(1000), new Script().fromScriptHash(address.hashBuf))
      let txHashBuf = new Buffer(32)
      txHashBuf.fill(0)
      let txOutNum = 0
      // let txin = new TxIn().fromTxOut(txHashBuf, txOutNum, txout, script)
      let txbuilder = new TxBuilder().fromScriptHashMultisig(txHashBuf, txOutNum, txout, script)
      Buffer.compare(txbuilder.txins[0].script.chunks[3].buf, script.toBuffer()).should.equal(0)
    })

    it('should add an input from a scripthash output and set nSequence', function () {
      let keyPair1 = new KeyPair().fromRandom()
      let keyPair2 = new KeyPair().fromRandom()
      let script = new Script().fromPubKeys(2, [keyPair1.pubKey, keyPair2.pubKey])
      let address = new Address().fromRedeemScript(script)
      let txout = new TxOut(new Bn(1000), new Script().fromScriptHash(address.hashBuf))
      let txHashBuf = new Buffer(32)
      txHashBuf.fill(0)
      let txOutNum = 0
      // let txin = new TxIn().fromTxOut(txHashBuf, txOutNum, txout, script)
      let txbuilder = new TxBuilder().fromScriptHashMultisig(txHashBuf, txOutNum, txout, script, 0xf0f0f0f0)
      Buffer.compare(txbuilder.txins[0].script.chunks[3].buf, script.toBuffer()).should.equal(0)
      txbuilder.txins[0].nSequence.should.equal(0xf0f0f0f0)
    })
  })

  describe('#getSig', function () {
    let txb, keyPair1, txout1

    before(function () {
      let obj = prepareAndBuildTxBuilder()
      txb = obj.txb
      keyPair1 = obj.keyPair1
      txout1 = obj.txout1
    })

    it('should sign and verify synchronously', function () {
      let sig = txb.getSig(keyPair1, Sig.SIGHASH_ALL, 0, keyPair1, txout1)
      ;(sig instanceof Sig).should.equal(true)
    })
  })

  describe('#sign', function () {
    let txb, keyPair1, keyPair2, saddr1, changeaddr, txout1

    before(function () {
      let obj = prepareAndBuildTxBuilder()
      txb = obj.txb
      keyPair1 = obj.keyPair1
      keyPair2 = obj.keyPair2
      saddr1 = obj.saddr1
      changeaddr = obj.changeaddr
      txout1 = obj.txout1
    })

    it('should sign and verify synchronously', function () {
      txb.sign(0, keyPair1)
      txb.sign(1, keyPair2)

      // transaction not fully signed yet, so should be invalid
      TxVerifier.verify(txb.tx, txb.utxoutmap, Interp.SCRIPT_VERIFY_P2SH).should.equal(false)

      txb.sign(2, keyPair1) // 2-of-2 needs 2 sigs
      txb.sign(2, keyPair2) // 2-of-2 needs 2 sigs

      txb.sign(3, keyPair1) // 2-of-3 needs 2 sigs
      txb.sign(3, keyPair2) // 2-of-3 needs 2 sigs

      txb.tx.txouts[0].script.chunks[2].buf.toString('hex').should.equal(saddr1.hashBuf.toString('hex'))
      txb.tx.txouts[0].valuebn.eq(2e8).should.equal(true)
      txb.tx.txouts[1].valuebn.eq(1e8).should.equal(true)
      txb.tx.txouts[2].valuebn.gt(546).should.equal(true)
      txb.tx.txouts[2].valuebn.eq(1e8 - 0.0001e8).should.equal(true)
      txb.tx.txouts[2].script.chunks[2].buf.toString('hex').should.equal(changeaddr.hashBuf.toString('hex'))

      TxVerifier.verify(txb.tx, txb.utxoutmap, Interp.SCRIPT_VERIFY_P2SH).should.equal(true)
    })

    it('should pass in txout', function () {
      txb.txoutmap = sinon.spy()
      txb.utxoutmap = {
        get: sinon.spy()
      }
      txb.sign(0, keyPair1, txout1)
      txb.utxoutmap.get.calledOnce.should.equal(false)
    })
  })

  describe('#asyncGetSig', function () {
    let txb, keyPair1, txout1

    before(function () {
      let obj = prepareAndBuildTxBuilder()
      txb = obj.txb
      keyPair1 = obj.keyPair1
      txout1 = obj.txout1
    })

    it('should sign and verify synchronously', function () {
      return asink(function * () {
        let sig = yield txb.asyncGetSig(keyPair1, Sig.SIGHASH_ALL, 0, keyPair1, txout1)
        ;(sig instanceof Sig).should.equal(true)
      }, this)
    })
  })

  describe('#asyncSign', function () {
    let txb, keyPair1, keyPair2, saddr1, changeaddr, txout1

    before(function () {
      let obj = prepareAndBuildTxBuilder()
      txb = obj.txb
      keyPair1 = obj.keyPair1
      keyPair2 = obj.keyPair2
      saddr1 = obj.saddr1
      changeaddr = obj.changeaddr
      txout1 = obj.txout1
    })

    it('should sign and verify asynchronously', function () {
      return asink(function * () {
        // or:
        yield txb.asyncSign(0, keyPair1)
        yield txb.asyncSign(1, keyPair2)

        // transaction not fully signed yet, so should be invalid
        TxVerifier.verify(txb.tx, txb.utxoutmap, Interp.SCRIPT_VERIFY_P2SH).should.equal(false)

        yield txb.asyncSign(2, keyPair1) // 2-of-2 needs 2 sigs
        yield txb.asyncSign(2, keyPair2) // 2-of-2 needs 2 sigs

        yield txb.asyncSign(3, keyPair1) // 2-of-3 needs 2 sigs
        yield txb.asyncSign(3, keyPair2) // 2-of-3 needs 2 sigs

        txb.tx.txouts[0].script.chunks[2].buf.toString('hex').should.equal(saddr1.hashBuf.toString('hex'))
        txb.tx.txouts[0].valuebn.eq(2e8).should.equal(true)
        txb.tx.txouts[1].valuebn.eq(1e8).should.equal(true)
        txb.tx.txouts[2].valuebn.gt(546).should.equal(true)
        txb.tx.txouts[2].valuebn.eq(1e8 - 0.0001e8).should.equal(true)
        txb.tx.txouts[2].script.chunks[2].buf.toString('hex').should.equal(changeaddr.hashBuf.toString('hex'))

        TxVerifier.verify(txb.tx, txb.utxoutmap, Interp.SCRIPT_VERIFY_P2SH).should.equal(true)
      }, this)
    })

    it('should pass in txout', function () {
      return asink(function * () {
        txb.txoutmap = sinon.spy()
        txb.utxoutmap = {
          get: sinon.spy()
        }
        yield txb.asyncSign(0, keyPair1, txout1)
        txb.utxoutmap.get.calledOnce.should.equal(false)
      }, this)
    })
  })
})
