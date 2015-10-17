/* global describe,it */
'use strict'
let should = require('chai').should()
let Txbuilder = require('../lib/txbuilder')
let Txverifier = require('../lib/txverifier')
let Tx = require('../lib/tx')
let Txout = require('../lib/txout')
let Address = require('../lib/address')
let BN = require('../lib/bn')
let Interp = require('../lib/interp')
let Script = require('../lib/script')
let Pubkey = require('../lib/pubkey')
let Privkey = require('../lib/privkey')
let Keypair = require('../lib/keypair')

describe('Txbuilder', function () {
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

  it('should make a new tx following this API', function () {
    let txb = new Txbuilder()

    // make change address
    let privkey = Privkey().fromBN(BN(1))
    let keypair = Keypair().fromPrivkey(privkey)
    let changeaddr = Address().fromPubkey(keypair.pubkey)

    // make addresses to send from
    let privkey1 = Privkey().fromBN(BN(2))
    let keypair1 = Keypair().fromPrivkey(privkey1)
    let addr1 = Address().fromPubkey(keypair1.pubkey)

    let privkey2 = Privkey().fromBN(BN(3))
    let keypair2 = Keypair().fromPrivkey(privkey2)
    let addr2 = Address().fromPubkey(keypair2.pubkey)

    // make addresses to send to
    let saddr1 = addr1
    let saddr2 = Address().fromRedeemScript(Script().fromString('OP_RETURN')) // fake, unredeemable p2sh address

    // txouts that we are spending
    let scriptout1 = Script().fromString('OP_DUP OP_HASH160 20 0x' + addr1.hashbuf.toString('hex') + ' OP_EQUALVERIFY OP_CHECKSIG')
    let scriptout2 = Script().fromString('OP_DUP OP_HASH160 20 0x' + addr2.hashbuf.toString('hex') + ' OP_EQUALVERIFY OP_CHECKSIG')
    let txout1 = Txout(BN(1e8), scriptout1)
    let txout2 = Txout(BN(1e8 + 0.001e8), scriptout2) // contains extra that we will use for the fee

    let txhashbuf = new Buffer(32)
    txhashbuf.fill(0)
    let txoutnum1 = 0
    let txoutnum2 = 1

    txb.setFeePerKBNum(0.0001e8)
    txb.setChangeAddress(changeaddr)
    txb.from(txhashbuf, txoutnum1, txout1, keypair1.pubkey)
    txb.from(txhashbuf, txoutnum2, txout2, keypair2.pubkey)
    txb.to(BN(1e8), saddr1) // pubkeyhash address
    txb.to(BN(1e8), saddr2) // p2sh address
    // txb.randomizeInputs()
    // txb.randomizeOutputs()

    txb.build()
    txb.sign(0, keypair1)
    txb.sign(1, keypair2)

    txb.tx.txouts[1].valuebn.gt(0).should.equal(true)
    txb.tx.txouts[1].valuebn.gt(546).should.equal(true)

    Txverifier.verify(txb.tx, txb.utxoutmap, Interp.SCRIPT_VERIFY_P2SH).should.equal(true)
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
