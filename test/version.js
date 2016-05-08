/* global describe,it */
'use strict'
let Version = require('../lib/version')
let Bn = require('../lib/bn')
let should = require('chai').should()
let VarInt = require('../lib/var-int')

describe('Version', function () {
  it('should exist', function () {
    should.exist(Version)
    should.exist(new Version())
  })

  describe('#toBuffer', function () {
    it('should convert to buffer', function () {
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
      Buffer.isBuffer(version.toBuffer()).should.equal(true)
    })
  })

  describe('#fromBuffer', function () {
    it('should convert from buffer', function () {
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
      version = new Version().fromBuffer(version.toBuffer())
      ;(version instanceof Version).should.equal(true)
    })
  })

  describe('@fromBuffer', function () {
    it('should convert from buffer', function () {
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
      version = Version.fromBuffer(version.toBuffer())
      ;(version instanceof Version).should.equal(true)
    })
  })
})
