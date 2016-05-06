/* global describe,it */
'use strict'
let Reject = require('../lib/reject')
let VarInt = require('../lib/var-int')
let should = require('chai').should()

describe('Reject', function () {
  it('should exist', function () {
    should.exist(Reject)
    should.exist(new Reject())
  })

  describe('#toBuffer', function () {
    it('should convert to a buffer', function () {
      let reject = new Reject().fromObject({
        typeVi: new VarInt().fromNumber(2),
        typeStr: 'tx',
        codeNum: 1,
        reasonVi: new VarInt().fromNumber(2),
        reasonStr: 'hi',
        extraBuf: new Buffer(0)
      })
      Buffer.isBuffer(reject.toBuffer()).should.equal(true)
    })
  })

  describe('#fromBuffer', function () {
    it('should convert from a buffer', function () {
      let reject = new Reject().fromObject({
        typeVi: new VarInt().fromNumber(2),
        typeStr: 'tx',
        codeNum: 1,
        reasonVi: new VarInt().fromNumber(2),
        reasonStr: 'hi',
        extraBuf: new Buffer(0)
      })
      let reject2 = new Reject().fromBuffer(reject.toBuffer())
      reject.typeStr.should.equal(reject2.typeStr)
      reject.codeNum.should.equal(reject2.codeNum)
      reject.reasonStr.should.equal(reject2.reasonStr)
      Buffer.compare(reject.extraBuf, reject2.extraBuf).should.equal(0)
    })
  })
})
