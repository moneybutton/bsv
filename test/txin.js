/* global describe,it */
'use strict'
let should = require('chai').should()
let Script = require('../lib/script')
let Txin = require('../lib/txin')
let Txout = require('../lib/txout')
let Varint = require('../lib/varint')
let BR = require('../lib/br')
let BN = require('../lib/bn')
let Keypair = require('../lib/keypair')
let Address = require('../lib/address')

describe('Txin', function () {
  let txhashbuf = new Buffer(32)
  txhashbuf.fill(0)
  let txoutnum = 0
  let script = Script().fromString('OP_CHECKMULTISIG')
  let scriptvi = Varint(script.toBuffer().length)
  let seqnum = 0
  let txin = Txin().fromObject({
    txhashbuf: txhashbuf,
    txoutnum: txoutnum,
    scriptvi: scriptvi,
    script: script,
    seqnum: seqnum
  })

  it('should make a new txin', function () {
    let txin = new Txin()
    should.exist(txin)
    txin = Txin()
    should.exist(txin)
    let txhashbuf = new Buffer(32)
    txhashbuf.fill(0)
    Txin(txhashbuf, 0).txhashbuf.length.should.equal(32)
    ;(function () {
      let txhashbuf2 = new Buffer(33)
      txhashbuf2.fill(0)
      Txin(txhashbuf2, 0)
    }).should.throw('txhashbuf must be 32 bytes')
  })

  it('should calculate scriptvi correctly when creating a new txin', function () {
    Txin(txin.txhashbuf, txin.txoutnum, txin.script, txin.seqnum).scriptvi.toNumber().should.equal(1)
  })

  describe('#initialize', function () {
    it('should default to 0xffffffff seqnum', function () {
      Txin().seqnum.should.equal(0xffffffff)
    })
  })

  describe('#fromObject', function () {
    it('should set these vars', function () {
      let txin = Txin().fromObject({
        txhashbuf: txhashbuf,
        txoutnum: txoutnum,
        scriptvi: scriptvi,
        script: script,
        seqnum: seqnum
      })
      should.exist(txin.txhashbuf)
      should.exist(txin.txoutnum)
      should.exist(txin.scriptvi)
      should.exist(txin.script)
      should.exist(txin.seqnum)
    })
  })

  describe('#setScript', function () {
    it('should calculate the varint size correctly', function () {
      let txin2 = Txin(txin)
      txin2.setScript(Script().fromString('OP_RETURN OP_RETURN OP_RETURN')).scriptvi.toNumber().should.equal(3)
    })
  })

  describe('#fromJSON', function () {
    it('should set these vars', function () {
      let txin2 = Txin().fromJSON(txin.toJSON())
      should.exist(txin2.txhashbuf)
      should.exist(txin2.txoutnum)
      should.exist(txin2.scriptvi)
      should.exist(txin2.script)
      should.exist(txin2.seqnum)
    })
  })

  describe('#toJSON', function () {
    it('should set these vars', function () {
      let json = txin.toJSON()
      should.exist(json.txhashbuf)
      should.exist(json.txoutnum)
      should.exist(json.scriptvi)
      should.exist(json.script)
      should.exist(json.seqnum)
    })
  })

  describe('#fromHex', function () {
    it('should convert this known buffer', function () {
      let hex = '00000000000000000000000000000000000000000000000000000000000000000000000001ae00000000'
      let txin = Txin().fromHex(hex)
      txin.scriptvi.toNumber().should.equal(1)
      txin.script.toString().should.equal('OP_CHECKMULTISIG')
    })
  })

  describe('#fromBuffer', function () {
    it('should convert this known buffer', function () {
      let hex = '00000000000000000000000000000000000000000000000000000000000000000000000001ae00000000'
      let buf = new Buffer(hex, 'hex')
      let txin = Txin().fromBuffer(buf)
      txin.scriptvi.toNumber().should.equal(1)
      txin.script.toString().should.equal('OP_CHECKMULTISIG')
    })
  })

  describe('#fromBR', function () {
    it('should convert this known buffer', function () {
      let hex = '00000000000000000000000000000000000000000000000000000000000000000000000001ae00000000'
      let buf = new Buffer(hex, 'hex')
      let br = BR(buf)
      let txin = Txin().fromBR(br)
      txin.scriptvi.toNumber().should.equal(1)
      txin.script.toString().should.equal('OP_CHECKMULTISIG')
    })
  })

  describe('#toHex', function () {
    it('should convert this known hex', function () {
      txin.toHex().should.equal('00000000000000000000000000000000000000000000000000000000000000000000000001ae00000000')
    })
  })

  describe('#toBuffer', function () {
    it('should convert this known buffer', function () {
      txin.toBuffer().toString('hex').should.equal('00000000000000000000000000000000000000000000000000000000000000000000000001ae00000000')
    })
  })

  describe('#toBW', function () {
    it('should convert this known buffer', function () {
      txin.toBW().toBuffer().toString('hex').should.equal('00000000000000000000000000000000000000000000000000000000000000000000000001ae00000000')
    })
  })

  describe('#fromTxout', function () {
    it('should convert from pubkeyhash out', function () {
      let keypair = Keypair().fromRandom()
      let address = Address().fromPubkey(keypair.pubkey)
      let txout = Txout(BN(1000), Script().fromPubkeyhash(address.hashbuf))
      let txhashbuf = new Buffer(32)
      txhashbuf.fill(0)
      let txoutnum = 0
      let txin = Txin().fromTxout(txhashbuf, txoutnum, txout, keypair.pubkey)
      should.exist(txin)
    })

    it('should convert from scripthash out', function () {
      let keypair1 = Keypair().fromRandom()
      let keypair2 = Keypair().fromRandom()
      let script = Script().fromPubkeys(2, [keypair1.pubkey, keypair2.pubkey])
      let address = Address().fromRedeemScript(script)
      let txout = Txout(BN(1000), Script().fromScripthash(address.hashbuf))
      let txhashbuf = new Buffer(32)
      txhashbuf.fill(0)
      let txoutnum = 0
      let txin = Txin().fromTxout(txhashbuf, txoutnum, txout, script)
      Buffer.compare(txin.script.chunks[3].buf, script.toBuffer()).should.equal(0)
    })
  })
})
