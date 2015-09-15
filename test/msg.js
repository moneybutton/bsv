'use strict'
let Constants = require('../lib/constants').Default
let Msg = require('../lib/msg')
let BR = require('../lib/br')
let BW = require('../lib/bw')
let should = require('chai').should()

describe('Msg', function () {
  let msghex = 'f9beb4d976657261636b000000000000000000005df6e0e2'
  let msgbuf = new Buffer(msghex, 'hex')
  let msg = Msg().fromHex(msghex)
  let msgjson = msg.toJSON()
  let msgjsonstr = JSON.stringify(msgjson)

  it('should satisfy this basic API', function () {
    let msg = new Msg()
    should.exist(msg)
    msg = Msg()
    should.exist(msg)
    msg.magicnum.should.equal(Constants.Msg.magicnum)
  })

  describe('#setCmd', function () {
    it('should set the command', function () {
      let msg = Msg()
      msg.setCmd('inv')
      let cmdbuf = new Buffer(12)
      cmdbuf.fill(0)
      cmdbuf.write('inv')
      Buffer.compare(cmdbuf, msg.cmdbuf).should.equal(0)
    })

  })

  describe('#getCmd', function () {
    it('should get the command', function () {
      let msg = Msg()
      msg.setCmd('inv')
      msg.getCmd().should.equal('inv')
    })

    it('should get the command when the command is 12 chars', function () {
      let msg = Msg()
      msg.setCmd('a'.repeat(12))
      msg.getCmd().should.equal('a'.repeat(12))
    })

    it('should get the command when there are extra 0s', function () {
      let msg = Msg()
      msg.setCmd('a')
      msg.cmdbuf.write('a', 2)
      msg.getCmd().should.equal('a\u0000a')
    })

  })

  describe('#setData', function () {
    it('should data to a blank buffer', function () {
      let msg = Msg()
      msg.setCmd('inv')
      msg.setData(new Buffer([]))
      msg.isValid().should.equal(true)
    })

  })

  describe('#fromBuffers', function () {
    it('should parse this known message', function () {
      let msgassembler, msg, next

      // test whole message at once
      msg = Msg()
      msgassembler = msg.fromBuffers()
      next = msgassembler.next(); // one blank .next() is necessary
      next = msgassembler.next(msgbuf)
      next.value.length.should.equal(0)
      next.done.should.equal(true)
      msg.toHex().should.equal(msghex)

      // test message one byte at a time
      msg = Msg()
      msgassembler = msg.fromBuffers()
      msgassembler.next(); // one blank .next() is necessary
      msgassembler.next() // should be able to place in multiple undefined buffers
      msgassembler.next(new Buffer([])) // should be able to place zero buf
      for (let i = 0; i < msgbuf.length; i++) {
        let onebytebuf = msgbuf.slice(i, i + 1)
        next = msgassembler.next(onebytebuf)
      }
      msg.toHex().should.equal(msghex)
      next.done.should.equal(true)
      next.value.length.should.equal(0)

      // test message three bytes at a time
      msg = Msg()
      msgassembler = msg.fromBuffers()
      msgassembler.next(); // one blank .next() is necessary
      for (let i = 0; i < msgbuf.length; i += 3) {
        let three = msgbuf.slice(i, i + 3)
        next = msgassembler.next(three)
      }
      msg.toHex().should.equal(msghex)
      next.done.should.equal(true)
      next.value.length.should.equal(0)
    })

    it('should throw an error for invalid magicnum in strict mode', function () {
      let msg = Msg().fromBuffer(msgbuf)
      msg.magicnum = 0;(function () {
        let msgassembler = Msg().fromBuffers({strict: true})
        msgassembler.next()
        msgassembler.next(msg.toBuffer())
      }).should.throw('invalid magicnum')
    })

    it('should throw an error for message over max size in strict mode', function () {
      let msgbuf2 = new Buffer(msgbuf)
      msgbuf2.writeUInt32BE(Constants.maxsize + 1, 4 + 12);(function () {
        let msgassembler = Msg().fromBuffers({strict: true})
        msgassembler.next()
        msgassembler.next(msgbuf2)
      }).should.throw('message size greater than maxsize')
    })

  })

  describe('#fromBuffer', function () {
    it('should parse this known message', function () {
      let msg = Msg().fromBuffer(msgbuf)
      msg.toHex().should.equal(msghex)
    })

  })

  describe('#toBuffer', function () {
    it('should parse this known message', function () {
      let msg = Msg().fromBuffer(msgbuf)
      msg.toBuffer().toString('hex').should.equal(msghex)
    })

  })

  describe('#fromBR', function () {
    it('should parse this known message', function () {
      let br = BR(msgbuf)
      let msg = Msg().fromBR(br)
      msg.toHex().should.equal(msghex)
    })

  })

  describe('#toBW', function () {
    it('should create this known message', function () {
      let bw = BW()
      Msg().fromHex(msghex).toBW(bw).toBuffer().toString('hex').should.equal(msghex)
      Msg().fromHex(msghex).toBW().toBuffer().toString('hex').should.equal(msghex)
    })

  })

  describe('#fromJSON', function () {
    it('should parse this known json msg', function () {
      Msg().fromJSON(msgjson).toHex().should.equal(msghex)
    })

  })

  describe('#toJSON', function () {
    it('should create this known message', function () {
      JSON.stringify(Msg().fromHex(msghex).toJSON()).should.equal(msgjsonstr)
    })

  })

  describe('#isValid', function () {
    it('should know these messages are valid or invalid', function () {
      Msg().fromHex(msghex).isValid().should.equal(true)
    })

  })

  describe('#fromPing', function () {
    it('should make a ping message', function () {
      let msg = Msg().fromPing()
      msg.getCmd().should.equal('ping')
      msg.databuf.length.should.equal(8)
    })

    it('should make a ping message with a defined buffer', function () {
      let databuf = new Buffer([])
      let msg = Msg().fromPing({checksum: Msg.checksum(databuf), databuf: databuf})
      msg.getCmd().should.equal('ping')
      msg.databuf.length.should.equal(0)
    })

  })

  describe('#fromPong', function () {
    it('should make a pong message', function () {
      let msg = Msg().fromPong()
      msg.getCmd().should.equal('pong')
      msg.databuf.length.should.equal(8)
    })

    it('should make a pong message with a defined buffer', function () {
      let databuf = new Buffer([])
      let msg = Msg().fromPong({checksum: Msg.checksum(databuf), databuf: databuf})
      msg.getCmd().should.equal('pong')
      msg.databuf.length.should.equal(0)
    })

  })

  describe('#fromPongFromPing', function () {
    it('should make a pong message from a ping message', function () {
      let msg = Msg().fromPing()
      msg.getCmd().should.equal('ping')
      msg = Msg().fromPongFromPing(msg)
      msg.getCmd().should.equal('pong')
    })

  })

})
