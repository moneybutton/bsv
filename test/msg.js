/* global describe,it */
'use strict'
let Br = require('../lib/br')
let Bw = require('../lib/bw')
let Constants = require('../lib/constants').Default
let Hash = require('../lib/hash')
let Msg = require('../lib/msg')
let Random = require('../lib/random')
let asink = require('asink')
let should = require('chai').should()

describe('Msg', function () {
  let msghex = 'f9beb4d976657261636b000000000000000000005df6e0e2'
  let msgbuf = new Buffer(msghex, 'hex')
  let msg = new Msg().fromHex(msghex)
  let msgjson = msg.toJson()
  let msgjsonstr = JSON.stringify(msgjson)

  it('should satisfy this basic API', function () {
    let msg = new Msg()
    should.exist(msg)
    msg = new Msg()
    should.exist(msg)
    msg.magicnum.should.equal(Constants.Msg.magicnum)
  })

  describe('#setCmd', function () {
    it('should set the command', function () {
      let msg = new Msg()
      msg.setCmd('inv')
      let cmdbuf = new Buffer(12)
      cmdbuf.fill(0)
      cmdbuf.write('inv')
      Buffer.compare(cmdbuf, msg.cmdbuf).should.equal(0)
    })
  })

  describe('#getCmd', function () {
    it('should get the command', function () {
      let msg = new Msg()
      msg.setCmd('inv')
      msg.getCmd().should.equal('inv')
    })

    it('should get the command when the command is 12 chars', function () {
      let msg = new Msg()
      msg.setCmd('a'.repeat(12))
      msg.getCmd().should.equal('a'.repeat(12))
    })

    it('should get the command when there are extra 0s', function () {
      let msg = new Msg()
      msg.setCmd('a')
      msg.cmdbuf.write('a', 2)
      msg.getCmd().should.equal('a\u0000a')
    })
  })

  describe('@checksum', function () {
    it('should return known value', function () {
      let buf = new Buffer(0)
      let checksumbuf = Msg.checksum(buf)
      Buffer.compare(checksumbuf, Hash.sha256sha256(buf).slice(0, 4)).should.equal(0)
    })
  })

  describe('@asyncChecksum', function () {
    it('should return known value and compute same as @checksum', function () {
      return asink(function * () {
        let buf = new Buffer(0)
        let checksumbuf = yield Msg.asyncChecksum(buf)
        Buffer.compare(checksumbuf, Hash.sha256sha256(buf).slice(0, 4)).should.equal(0)
        let checksumbuf2 = Msg.checksum(buf)
        Buffer.compare(checksumbuf, checksumbuf2).should.equal(0)
      }, this)
    })
  })

  describe('#setData', function () {
    it('should data to a blank buffer', function () {
      let msg = new Msg()
      msg.setCmd('inv')
      msg.setData(new Buffer([]))
      msg.isValid().should.equal(true)
    })
  })

  describe('#asyncSetData', function () {
    it('should data to a blank buffer', function () {
      return asink(function * () {
        let msg = new Msg()
        msg.setCmd('inv')
        yield msg.asyncSetData(new Buffer([]))
        msg.isValid().should.equal(true)
      }, this)
    })
  })

  describe('#genFromBuffers', function () {
    it('should parse this known message', function () {
      let msgassembler, msg, next

      // test whole message at once
      msg = new Msg()
      msgassembler = msg.genFromBuffers()
      next = msgassembler.next() // one blank .next() is necessary
      next = msgassembler.next(msgbuf)
      next.value.length.should.equal(0)
      next.done.should.equal(true)
      msg.toHex().should.equal(msghex)

      // test message one byte at a time
      msg = new Msg()
      msgassembler = msg.genFromBuffers()
      msgassembler.next() // one blank .next() is necessary
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
      msg = new Msg()
      msgassembler = msg.genFromBuffers()
      msgassembler.next() // one blank .next() is necessary
      for (let i = 0; i < msgbuf.length; i += 3) {
        let three = msgbuf.slice(i, i + 3)
        next = msgassembler.next(three)
      }
      msg.toHex().should.equal(msghex)
      next.done.should.equal(true)
      next.value.length.should.equal(0)
    })

    it('should throw an error for invalid magicnum in strict mode', function () {
      let msg = new Msg().fromBuffer(msgbuf)
      msg.magicnum = 0
      ;(function () {
        let msgassembler = new Msg().genFromBuffers({strict: true})
        msgassembler.next()
        msgassembler.next(msg.toBuffer())
      }).should.throw('invalid magicnum')
    })

    it('should throw an error for message over max size in strict mode', function () {
      let msgbuf2 = new Buffer(msgbuf)
      msgbuf2.writeUInt32BE(Constants.maxsize + 1, 4 + 12)
      ;(function () {
        let msgassembler = new Msg().genFromBuffers({strict: true})
        msgassembler.next()
        msgassembler.next(msgbuf2)
      }).should.throw('message size greater than maxsize')
    })
  })

  describe('#fromBuffer', function () {
    it('should parse this known message', function () {
      let msg = new Msg().fromBuffer(msgbuf)
      msg.toHex().should.equal(msghex)
    })
  })

  describe('#toBuffer', function () {
    it('should parse this known message', function () {
      let msg = new Msg().fromBuffer(msgbuf)
      msg.toBuffer().toString('hex').should.equal(msghex)
    })
  })

  describe('#fromBr', function () {
    it('should parse this known message', function () {
      let br = new Br(msgbuf)
      let msg = new Msg().fromBr(br)
      msg.toHex().should.equal(msghex)
    })
  })

  describe('#toBw', function () {
    it('should create this known message', function () {
      let bw = new Bw()
      new Msg().fromHex(msghex).toBw(bw).toBuffer().toString('hex').should.equal(msghex)
      new Msg().fromHex(msghex).toBw().toBuffer().toString('hex').should.equal(msghex)
    })
  })

  describe('#fromJson', function () {
    it('should parse this known json msg', function () {
      new Msg().fromJson(msgjson).toHex().should.equal(msghex)
    })
  })

  describe('#toJson', function () {
    it('should create this known message', function () {
      JSON.stringify(new Msg().fromHex(msghex).toJson()).should.equal(msgjsonstr)
    })
  })

  describe('#isValid', function () {
    it('should know these messages are valid or invalid', function () {
      new Msg().fromHex(msghex).isValid().should.equal(true)
    })
  })

  describe('#asyncIsValid', function () {
    it('should return same as isValid', function () {
      return asink(function * () {
        let msg = new Msg()
        msg.setCmd('ping')
        msg.setData(Random.getRandomBuffer(8))
        msg.isValid().should.equal(true)
        let res = yield msg.asyncIsValid()
        res.should.equal(msg.isValid())
      }, this)
    })
  })

  describe('#asyncValidate', function () {
    it('should validate this known valid message', function () {
      let msg = new Msg()
      msg.setCmd('ping')
      msg.setData(Random.getRandomBuffer(8))
      msg.validate()
    })
  })

  describe('#asyncValidate', function () {
    it('should validate this known valid message', function () {
      return asink(function * () {
        let msg = new Msg()
        msg.setCmd('ping')
        msg.setData(Random.getRandomBuffer(8))
        yield msg.asyncValidate()
      }, this)
    })

    it('should validate this known valid message', function () {
      return asink(function * () {
        let msg = new Msg()
        msg.setCmd('ping')
        msg.setData(Random.getRandomBuffer(8))
        msg.checksumbuf = new Buffer('00000000', 'hex')
        let errors = 0
        try {
          yield msg.asyncValidate()
        } catch (e) {
          errors++
        }
        errors.should.equal(1)
      }, this)
    })
  })
})
