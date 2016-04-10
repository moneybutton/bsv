/* global describe,it */
'use strict'
let Tx = require('../lib/tx')
let MsgTx = require('../lib/msgtx')
let asink = require('asink')
let should = require('chai').should()

describe('MsgTx', function () {
  let txhex = '01000000029e8d016a7b0dc49a325922d05da1f916d1e4d4f0cb840c9727f3d22ce8d1363f000000008c493046022100e9318720bee5425378b4763b0427158b1051eec8b08442ce3fbfbf7b30202a44022100d4172239ebd701dae2fbaaccd9f038e7ca166707333427e3fb2a2865b19a7f27014104510c67f46d2cbb29476d1f0b794be4cb549ea59ab9cc1e731969a7bf5be95f7ad5e7f904e5ccf50a9dc1714df00fbeb794aa27aaff33260c1032d931a75c56f2ffffffffa3195e7a1ab665473ff717814f6881485dc8759bebe97e31c301ffe7933a656f020000008b48304502201c282f35f3e02a1f32d2089265ad4b561f07ea3c288169dedcf2f785e6065efa022100e8db18aadacb382eed13ee04708f00ba0a9c40e3b21cf91da8859d0f7d99e0c50141042b409e1ebbb43875be5edde9c452c82c01e3903d38fa4fd89f3887a52cb8aea9dc8aec7e2c9d5b3609c03eb16259a2537135a1bf0f9c5fbbcbdbaf83ba402442ffffffff02206b1000000000001976a91420bb5c3bfaef0231dc05190e7f1c8e22e098991e88acf0ca0100000000001976a9149e3e2d23973a04ec1b02be97c30ab9f2f27c3b2c88ac00000000'

  it('should exist', function () {
    let msgtx = MsgTx()
    should.exist(MsgTx)
    should.exist(msgtx)
  })

  describe('#fromTx', function () {
    it('should convert a tx into a msgtx', function () {
      let tx = Tx().fromHex(txhex)
      let msgtx = MsgTx().fromTx(tx)
      msgtx.isValid().should.equal(true)
    })
  })

  describe('#asyncFromTx', function () {
    it('should convert a tx into a msgtx', function () {
      return asink(function *() {
        let tx = Tx().fromHex(txhex)
        let msgtx = yield MsgTx().asyncFromTx(tx)
        msgtx.isValid().should.equal(true)
      }, this)
    })
  })

  describe('#toTx', function () {
    it('should convert a msgtx into a tx', function () {
      let tx = Tx().fromHex(txhex)
      let msgtx = MsgTx().fromTx(tx)
      let tx2 = msgtx.toTx()
      tx.toHex().should.equal(tx2.toHex())
    })
  })

  describe('#isValid', function () {
    it('should know this msgtx is or is not valid', function () {
      let tx = Tx().fromHex(txhex)
      let msgtx = MsgTx().fromTx(tx)
      msgtx.isValid().should.equal(true)
      msgtx.setCmd('txo')
      msgtx.isValid().should.equal(false)
    })
  })
})
