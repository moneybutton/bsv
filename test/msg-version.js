/* global describe,it */
'use strict'
let Bn = require('../lib/bn')
let MsgVersion = require('../lib/msg-version')
let VarInt = require('../lib/var-int')
let Version = require('../lib/version')
let asink = require('asink')
let should = require('chai').should()

describe('Version', function () {
  let version = Version.fromObject({
    versionBytesNum: 0,
    servicesBuf: Buffer.alloc(8),
    timeBn: new Bn(0),
    addrRecvServicesBuf: Buffer.alloc(8),
    addrRecvIpAddrBuf: Buffer.alloc(16),
    addrRecvPort: 0,
    addrTransServicesBuf: Buffer.alloc(8),
    addrTransIpAddrBuf: Buffer.alloc(16),
    addrTransPort: 0,
    nonceBuf: Buffer.alloc(8),
    userAgentVi: VarInt.fromNumber('test'.length),
    userAgentBuf: new Buffer('test'),
    startHeightNum: 100,
    relay: true
  })

  it('should exist', function () {
    should.exist(Version)
    should.exist(new Version())
  })

  describe('#fromVersion', function () {
    it('should convert from a version', function () {
      let msgVersion = new MsgVersion().fromVersion(version)
      ;(msgVersion instanceof MsgVersion).should.equal(true)
    })
  })

  describe('@fromVersion', function () {
    it('should convert from a version', function () {
      let msgVersion = MsgVersion.fromVersion(version)
      ;(msgVersion instanceof MsgVersion).should.equal(true)
    })
  })

  describe('#asyncFromVersion', function () {
    it('should convert from a version', function () {
      return asink(function * () {
        let msgVersion = yield new MsgVersion().asyncFromVersion(version)
        ;(msgVersion instanceof MsgVersion).should.equal(true)
      }, this)
    })
  })

  describe('@asyncFromVersion', function () {
    it('should convert from a version', function () {
      return asink(function * () {
        let msgVersion = yield MsgVersion.asyncFromVersion(version)
        ;(msgVersion instanceof MsgVersion).should.equal(true)
      }, this)
    })
  })

  describe('#toVersion', function () {
    it('should get a version', function () {
      let msgVersion = MsgVersion.fromVersion(version)
      let version2 = msgVersion.toVersion()
      version2.toHex().should.equal(version.toHex())
      ;(version2 instanceof Version).should.equal(true)
    })
  })

  describe('#isValid', function () {
    it('should know this is a valid MsgVersion', function () {
      let msgVersion = MsgVersion.fromVersion(version)
      msgVersion.isValid().should.equal(true)
    })
  })
})
