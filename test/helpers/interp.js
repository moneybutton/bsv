'use strict'
let Interp = require('../../lib/interp')
let Script = require('../../lib/script')
let Tx = require('../../lib/tx')
let Bn = require('../../lib/bn')

module.exports.testInterpPartial = function testInterpPartial (it, scriptValid, scriptInvalid, mod = 0) {
  let c

  c = 0
  scriptValid.forEach(function (vector, i) {
    if (vector.length === 1) {
      return
    }
    c++
    if ((c + mod) % 4) {
      return
    }
    it('should verify scriptValid vector ' + c, function () {
      let scriptSig = new Script().fromBitcoindString(vector[0])
      let scriptPubKey = new Script().fromBitcoindString(vector[1])
      let flags = Interp.getFlags(vector[2])

      let hashBuf = new Buffer(32)
      hashBuf.fill(0)
      let credtx = new Tx()
      credtx.addTxIn(hashBuf, 0xffffffff, new Script().writeString('OP_0 OP_0'), 0xffffffff)
      credtx.addTxOut(new Bn(0), scriptPubKey)

      let idbuf = credtx.hash()
      let spendtx = new Tx()
      spendtx.addTxIn(idbuf, 0, scriptSig, 0xffffffff)
      spendtx.addTxOut(new Bn(0), new Script())

      let interp = new Interp()
      let verified = interp.verify(scriptSig, scriptPubKey, spendtx, 0, flags)
      verified.should.equal(true)
    })
  })

  c = 0
  scriptInvalid.forEach(function (vector, i) {
    if (vector.length === 1) {
      return
    }
    c++
    if ((c + mod) % 4) {
      return
    }
    it('should unverify scriptInvalid vector ' + c, function () {
      let scriptSig = new Script().fromBitcoindString(vector[0])
      let scriptPubKey = new Script().fromBitcoindString(vector[1])
      let flags = Interp.getFlags(vector[2])

      let hashBuf = new Buffer(32)
      hashBuf.fill(0)
      let credtx = new Tx()
      credtx.addTxIn(hashBuf, 0xffffffff, new Script().writeString('OP_0 OP_0'), 0xffffffff)
      credtx.addTxOut(new Bn(0), scriptPubKey)

      let idbuf = credtx.hash()
      let spendtx = new Tx()
      spendtx.addTxIn(idbuf, 0, scriptSig, 0xffffffff)
      spendtx.addTxOut(new Bn(0), new Script())

      let interp = new Interp()
      let verified = interp.verify(scriptSig, scriptPubKey, spendtx, 0, flags)
      verified.should.equal(false)
    })
  })
}
