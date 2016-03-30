/* global describe,it */
'use strict'
let Address = require('../lib/address')
let BN = require('../lib/bn')
let Interp = require('../lib/interp')
let Keypair = require('../lib/keypair')
let Privkey = require('../lib/privkey')
let Pubkey = require('../lib/pubkey')
let Script = require('../lib/script')
let Tx = require('../lib/tx')
let Txbuilder = require('../lib/txbuilder')
let Txout = require('../lib/txout')
let Txverifier = require('../lib/txverifier')
let asink = require('asink')
let should = require('chai').should()

describe('Txbuilder', function () {
  let txb

  it('should make a new txbuilder', function () {
    let txb = new Txbuilder()
    ;(txb instanceof Txbuilder).should.equal(true)
    should.exist(txb.tx)
    txb = Txbuilder()
    ;(txb instanceof Txbuilder).should.equal(true)
    should.exist(txb.tx)
    txb = Txbuilder({
      tx: Tx()
    })
    should.exist(txb.tx)
  })

  describe('#sign and #asyncSign', function () {
    let keypair1, keypair2, addr1, addr2, saddr1, saddr2, changeaddr

    before(function () {
      txb = new Txbuilder()

      // make change address
      let privkey = Privkey().fromBN(BN(1))
      let keypair = Keypair().fromPrivkey(privkey)
      changeaddr = Address().fromPubkey(keypair.pubkey)

      // make addresses to send from
      let privkey1 = Privkey().fromBN(BN(2))
      keypair1 = Keypair().fromPrivkey(privkey1)
      addr1 = Address().fromPubkey(keypair1.pubkey)

      let privkey2 = Privkey().fromBN(BN(3))
      keypair2 = Keypair().fromPrivkey(privkey2)
      addr2 = Address().fromPubkey(keypair2.pubkey)

      // make addresses to send to
      saddr1 = addr1
      saddr2 = Address().fromRedeemScript(Script().fromString('OP_RETURN')) // fake, unredeemable p2sh address

      // txouts that we are spending

      // pubkeyhash out
      let scriptout1 = Script().fromString('OP_DUP OP_HASH160 20 0x' + addr1.hashbuf.toString('hex') + ' OP_EQUALVERIFY OP_CHECKSIG')

      // pubkeyhash out
      let scriptout2 = Script().fromString('OP_DUP OP_HASH160 20 0x' + addr2.hashbuf.toString('hex') + ' OP_EQUALVERIFY OP_CHECKSIG')

      // p2sh 2-of-2 multisig out
      let redeemScript3 = Script().fromPubkeys(2, [keypair1.pubkey, keypair2.pubkey])
      let address3 = Address().fromRedeemScript(redeemScript3)
      let scriptout3 = address3.toScript()

      let txout1 = Txout(BN(1e8), scriptout1)
      let txout2 = Txout(BN(1e8), scriptout2)
      let txout3 = Txout(BN(1e8), scriptout3)
      // total balance: 3e8

      let txhashbuf = new Buffer(32)
      txhashbuf.fill(0)
      let txoutnum1 = 0
      let txoutnum2 = 1
      let txoutnum3 = 2

      txb.setFeePerKBNum(0.0001e8)
      txb.setChangeAddress(changeaddr)
      txb.fromPubkeyhash(txhashbuf, txoutnum1, txout1, keypair1.pubkey)
      txb.fromPubkeyhash(txhashbuf, txoutnum2, txout2, keypair2.pubkey)
      txb.fromScripthashMultisig(txhashbuf, txoutnum3, txout3, redeemScript3)
      txb.to(BN(1e8), saddr1) // pubkeyhash address
      txb.to(BN(1e8), saddr2) // p2sh address
      // total sending: 2e8 (plus fee)
      // txb.randomizeInputs()
      // txb.randomizeOutputs()

      txb.build()
    })

    describe('#sign', function () {
      it.only('should sign and verify synchronously', function () {
        txb.sign(0, keypair1)
        txb.sign(1, keypair2)
        txb.sign(2, keypair1) // 2-of-2 needs 2 sigs
        txb.sign(2, keypair2) // 2-of-2 needs 2 sigs

        txb.tx.txouts[0].script.chunks[2].buf.toString('hex').should.equal(saddr1.hashbuf.toString('hex'))
        txb.tx.txouts[0].valuebn.eq(1e8).should.equal(true)
        txb.tx.txouts[1].valuebn.eq(1e8).should.equal(true)
        txb.tx.txouts[2].valuebn.gt(546).should.equal(true)
        txb.tx.txouts[2].valuebn.eq(1e8 - 0.0001e8).should.equal(true)
        txb.tx.txouts[2].script.chunks[2].buf.toString('hex').should.equal(changeaddr.hashbuf.toString('hex'))

        Txverifier.verify(txb.tx, txb.utxoutmap, Interp.SCRIPT_VERIFY_P2SH).should.equal(true)
      })
    })

    describe('#asyncSign', function () {
      it('should sign and verify asynchronously', function () {
        return asink(function *() {
          // or:
          yield txb.asyncSign(0, keypair1)
          yield txb.asyncSign(1, keypair2)

          Txverifier.verify(txb.tx, txb.utxoutmap, Interp.SCRIPT_VERIFY_P2SH).should.equal(true)
        }, this)
      }, this)
    })
  })

  describe('#toJSON', function () {
    it('should convert this txb to JSON', function () {
      let json = txb.toJSON()
      should.exist(json.tx)
      should.exist(json.txins)
      should.exist(json.txins[0])
      should.exist(json.txouts)
      should.exist(json.utxoutmap)
      should.exist(json.txouts[0])
      should.exist(json.changeAddress)
      should.exist(json.feePerKBNum)
    })
  })

  describe('#fromJSON', function () {
    it('should convert to/from json isomorphically', function () {
      let json = txb.toJSON()
      let txb2 = Txbuilder().fromJSON(json)
      let json2 = txb2.toJSON()
      json2.tx.should.equal(json.tx)
      json2.txins[0].should.equal(json.txins[0])
      json2.txouts[0].should.equal(json.txouts[0])
      JSON.stringify(json2.utxoutmap).should.equal(JSON.stringify(json.utxoutmap))
      json2.changeAddress.should.equal(json.changeAddress)
      json2.feePerKBNum.should.equal(json.feePerKBNum)
    })
  })

  describe('#fromPubkeyhash', function () {
    it('should add an input from a pubkeyhash output', function () {
      let keypair = Keypair().fromRandom()
      let address = Address().fromPubkey(keypair.pubkey)
      let txout = Txout(BN(1000), Script().fromPubkeyhash(address.hashbuf))
      let txhashbuf = new Buffer(32)
      txhashbuf.fill(0)
      let txoutnum = 0
      let txbuilder = Txbuilder().fromPubkeyhash(txhashbuf, txoutnum, txout, keypair.pubkey)
      Buffer.compare(txbuilder.txins[0].script.chunks[1].buf, keypair.pubkey.toBuffer()).should.equal(0)
    })
  })

  describe('#fromScripthashMultisig', function () {
    it('should add an input from a scripthash output', function () {
      let keypair1 = Keypair().fromRandom()
      let keypair2 = Keypair().fromRandom()
      let script = Script().fromPubkeys(2, [keypair1.pubkey, keypair2.pubkey])
      let address = Address().fromRedeemScript(script)
      let txout = Txout(BN(1000), Script().fromScripthash(address.hashbuf))
      let txhashbuf = new Buffer(32)
      txhashbuf.fill(0)
      let txoutnum = 0
      // let txin = Txin().fromTxout(txhashbuf, txoutnum, txout, script)
      let txbuilder = Txbuilder().fromScripthashMultisig(txhashbuf, txoutnum, txout, script)
      Buffer.compare(txbuilder.txins[0].script.chunks[3].buf, script.toBuffer()).should.equal(0)
    })
  })

  describe('#to', function () {
    it('should add a scripthash address', function () {
      let hashbuf = new Buffer(20)
      hashbuf.fill(0)
      let address = Address().fromRedeemScript(Script().fromScripthash(hashbuf))
      let txb = Txbuilder()
      txb.to(BN(0), address)
      txb.txouts.length.should.equal(1)
    })

    it('should add a pubkeyhash address', function () {
      let pubkey = Pubkey().fromPrivkey(Privkey().fromRandom())
      let address = Address().fromPubkey(pubkey)
      let txb = Txbuilder()
      txb.to(BN(0), address)
      txb.txouts.length.should.equal(1)
    })
  })
})
