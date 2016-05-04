/* global describe,it */
'use strict'
let Addr = require('../lib/addr')
let MsgAddr = require('../lib/msg-addr')
let should = require('chai').should()

describe('MsgAddr', function () {
  let addrhex = 'e8030000000000000000000000000000000000000000000000000000208d'

  it('should exist', function () {
    should.exist(MsgAddr)
    should.exist(MsgAddr())
  })

  describe('#fromAddrs', function () {
    it('should convert from addrs', function () {
      let addr = new Addr().fromHex(addrhex)
      let msgaddr = MsgAddr().fromAddrs([addr])
      msgaddr.getCmd().should.equal('addr')
      msgaddr.databuf.length.should.equal(1 + addrhex.length / 2)
    })
  })

  describe('#toAddrs', function () {
    it('should convert to addrs', function () {
      let addr = new Addr().fromHex(addrhex)
      let msgaddr = MsgAddr().fromAddrs([addr])
      let addrs2 = msgaddr.toAddrs()
      addrs2.length.should.equal(1)
      ;(addrs2[0] instanceof Addr).should.equal(true)
    })

    it('should convert to multiple addrs', function () {
      let addr = new Addr().fromHex(addrhex)
      let msgaddr = MsgAddr().fromAddrs([addr, addr, addr])
      let addrs2 = msgaddr.toAddrs()
      addrs2.length.should.equal(3)
      ;(addrs2[0] instanceof Addr).should.equal(true)
    })
  })

  describe('#isValid', function () {
    it('should know this is a valid msg addrs', function () {
      let addr = new Addr().fromHex(addrhex)
      let msgaddr = MsgAddr().fromAddrs([addr])
      msgaddr.isValid().should.equal(true)
    })
  })
})
