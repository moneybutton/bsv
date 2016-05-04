/* global describe,it */
'use strict'
let Reject = require('../lib/reject')
let VarInt = require('../lib/var-int')
let should = require('chai').should()

describe('Reject', function () {
  it('should exist', function () {
    should.exist(Reject)
    should.exist(Reject())
  })

  describe('#toBuffer', function () {
    it('should convert to a buffer', function () {
      let reject = Reject().fromObject({
        typevi: VarInt().fromNumber(2),
        typestr: 'tx',
        codenum: 1,
        reasonvi: VarInt().fromNumber(2),
        reasonstr: 'hi',
        extrabuf: new Buffer(0)
      })
      Buffer.isBuffer(reject.toBuffer()).should.equal(true)
    })
  })

  describe('#fromBuffer', function () {
    it('should convert from a buffer', function () {
      let reject = Reject().fromObject({
        typevi: VarInt().fromNumber(2),
        typestr: 'tx',
        codenum: 1,
        reasonvi: VarInt().fromNumber(2),
        reasonstr: 'hi',
        extrabuf: new Buffer(0)
      })
      let reject2 = Reject().fromBuffer(reject.toBuffer())
      reject.typestr.should.equal(reject2.typestr)
      reject.codenum.should.equal(reject2.codenum)
      reject.reasonstr.should.equal(reject2.reasonstr)
      Buffer.compare(reject.extrabuf, reject2.extrabuf).should.equal(0)
    })
  })
})
