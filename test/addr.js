/* global describe,it */
'use strict'
let Addr = require('../lib/addr')
let should = require('chai').should()

describe('Addr', function () {
  it('should exist', function () {
    should.exist(Addr)
    should.exist(new Addr())
  })

  describe('#toBuffer', function () {
    it('should convert an addr to a buffer', function () {
      let addr = new Addr().fromObject({
        time: 1000,
        servicesBuf: new Buffer(8).fill(0),
        ipAddrBuf: new Buffer(16).fill(0),
        port: 8333
      })
      addr.toBuffer().length.should.equal(4 + 8 + 16 + 2)
    })
  })

  describe('#toBuffer', function () {
    it('should convert an addr to a buffer', function () {
      let addr = new Addr().fromObject({
        time: 1000,
        servicesBuf: new Buffer(8).fill(0),
        ipAddrBuf: new Buffer(16).fill(0),
        port: 8333
      })
      let addr2 = new Addr().fromBuffer(addr.toBuffer())
      addr2.time.should.equal(addr.time)
      Buffer.compare(addr.servicesBuf, addr2.servicesBuf).should.equal(0)
      Buffer.compare(addr.ipAddrBuf, addr2.ipAddrBuf).should.equal(0)
      addr2.port.should.equal(addr.port)
    })
  })

  describe('@fromBuffer', function () {
    it('should convert from a buffer', function () {
      let addr = Addr.fromObject({
        time: 1000,
        servicesBuf: new Buffer(8).fill(0),
        ipAddrBuf: new Buffer(16).fill(0),
        port: 8333
      })
      let addr2 = Addr.fromBuffer(addr.toBuffer())
      addr2.time.should.equal(addr.time)
      Buffer.compare(addr.servicesBuf, addr2.servicesBuf).should.equal(0)
      Buffer.compare(addr.ipAddrBuf, addr2.ipAddrBuf).should.equal(0)
      addr2.port.should.equal(addr.port)
    })
  })
})
