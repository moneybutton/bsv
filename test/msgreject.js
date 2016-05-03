/* global describe,it */
'use strict'
let Reject = require('../lib/reject')
let MsgReject = require('../lib/msgreject')
let Varint = require('../lib/varint')
let asink = require('asink')
let should = require('chai').should()

describe('MsgReject', function () {
  it('should exist', function () {
    should.exist(MsgReject)
    should.exist(MsgReject())
  })

  describe('#fromReject', function () {
    it('should convert from a reject', function () {
      let reject = Reject().fromObject({
        typevi: Varint().fromNumber(2),
        typestr: 'tx',
        codenum: 1,
        reasonvi: Varint().fromNumber(2),
        reasonstr: 'hi',
        extrabuf: new Buffer(0)
      })
      let msgreject = MsgReject().fromReject(reject)
      Buffer.compare(msgreject.databuf, reject.toBuffer()).should.equal(0)
    })
  })

  describe('#asyncFromReject', function () {
    it('should convert from a reject', function () {
      return asink(function * () {
        let reject = Reject().fromObject({
          typevi: Varint().fromNumber(2),
          typestr: 'tx',
          codenum: 1,
          reasonvi: Varint().fromNumber(2),
          reasonstr: 'hi',
          extrabuf: new Buffer(0)
        })
        let msgreject = yield MsgReject().asyncFromReject(reject)
        Buffer.compare(msgreject.databuf, reject.toBuffer()).should.equal(0)
      }, this)
    })
  })

  describe('#toReject', function () {
    it('should convert to a reject', function () {
      return asink(function * () {
        let reject = Reject().fromObject({
          typevi: Varint().fromNumber(2),
          typestr: 'tx',
          codenum: 1,
          reasonvi: Varint().fromNumber(2),
          reasonstr: 'hi',
          extrabuf: new Buffer(0)
        })
        let reject2 = MsgReject().fromReject(reject).toReject()
        Buffer.compare(reject2.toBuffer(), reject.toBuffer()).should.equal(0)
      }, this)
    })
  })

  describe('#isValid', function () {
    it('should know this is a valid msgreject', function () {
      let reject = Reject().fromObject({
        typevi: Varint().fromNumber(2),
        typestr: 'tx',
        codenum: 1,
        reasonvi: Varint().fromNumber(2),
        reasonstr: 'hi',
        extrabuf: new Buffer(0)
      })
      let msgreject = MsgReject().fromReject(reject)
      msgreject.isValid().should.equal(true)
    })
  })
})
