/* global describe,it */
'use strict'
let Addr = require('../lib/addr')
let MsgAddr = require('../lib/msg-addr')
let asink = require('asink')
let should = require('chai').should()

describe('MsgAddr', function () {
  let addrhex = 'e8030000000000000000000000000000000000000000000000000000208d'

  it('should exist', function () {
    should.exist(MsgAddr)
    should.exist(new MsgAddr())
  })

  describe('#fromAddrs', function () {
    it('should convert from addrs', function () {
      let addr = new Addr().fromHex(addrhex)
      let msgaddr = new MsgAddr().fromAddrs([addr])
      msgaddr.getCmd().should.equal('addr')
      msgaddr.dataBuf.length.should.equal(1 + addrhex.length / 2)
    })
  })

  describe('@fromAddrs', function () {
    it('should convert from addrs', function () {
      let addr = Addr.fromHex(addrhex)
      let msgaddr = MsgAddr.fromAddrs([addr])
      msgaddr.getCmd().should.equal('addr')
      msgaddr.dataBuf.length.should.equal(1 + addrhex.length / 2)
    })
  })

  describe('#asyncFromAddrs', function () {
    it('should convert from addrs', function () {
      return asink(function * () {
        let addr = new Addr().fromHex(addrhex)
        let msgaddr = yield new MsgAddr().asyncFromAddrs([addr])
        msgaddr.getCmd().should.equal('addr')
        msgaddr.dataBuf.length.should.equal(1 + addrhex.length / 2)
      }, this)
    })
  })

  describe('@asyncFromAddrs', function () {
    it('should convert from addrs', function () {
      return asink(function * () {
        let addr = new Addr().fromHex(addrhex)
        let msgaddr = yield MsgAddr.asyncFromAddrs([addr])
        msgaddr.getCmd().should.equal('addr')
        msgaddr.dataBuf.length.should.equal(1 + addrhex.length / 2)
      }, this)
    })
  })

  describe('#toAddrs', function () {
    it('should convert to addrs', function () {
      let addr = new Addr().fromHex(addrhex)
      let msgaddr = new MsgAddr().fromAddrs([addr])
      let addrs2 = msgaddr.toAddrs()
      addrs2.length.should.equal(1)
      ;(addrs2[0] instanceof Addr).should.equal(true)
    })

    it('should convert to multiple addrs', function () {
      let addr = new Addr().fromHex(addrhex)
      let msgaddr = new MsgAddr().fromAddrs([addr, addr, addr])
      let addrs2 = msgaddr.toAddrs()
      addrs2.length.should.equal(3)
      ;(addrs2[0] instanceof Addr).should.equal(true)
    })
  })

  describe('#isValid', function () {
    it('should know this is a valid msg addrs', function () {
      let addr = new Addr().fromHex(addrhex)
      let msgaddr = new MsgAddr().fromAddrs([addr])
      msgaddr.isValid().should.equal(true)
    })
  })
})
