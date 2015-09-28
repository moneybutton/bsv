/* global describe,it */
'use strict'
let BR = require('../lib/br')
let BW = require('../lib/bw')
let should = require('chai').should()
let BN = require('../lib/bn')

describe('BR', function () {
  it('should make a new BR', function () {
    let br = new BR()
    should.exist(br)
    br = BR()
    should.exist(br)
  })

  it('should create a new bufferreader with a buffer', function () {
    let buf = new Buffer(0)
    let br = new BR(buf)
    should.exist(br)
    Buffer.isBuffer(br.buf).should.equal(true)
  })

  describe('#fromObject', function () {
    it('should set pos', function () {
      should.exist(BR().fromObject({pos: 1}).pos)
    })
  })

  describe('#eof', function () {
    it('should return true for a blank br', function () {
      let br = new BR({buf: new Buffer([])})
      br.eof().should.equal(true)
    })
  })

  describe('#read', function () {
    it('should return the same buffer', function () {
      let buf = new Buffer([0])
      let br = new BR({buf: buf})
      br.read().toString('hex').should.equal(buf.toString('hex'))
    })

    it('should return a buffer of this length', function () {
      let buf = new Buffer(10)
      buf.fill(0)
      let br = new BR(buf)
      let buf2 = br.read(2)
      buf2.length.should.equal(2)
      br.eof().should.equal(false)
      br.pos.should.equal(2)
    })

    it('should be able to read 0 bytes', function () {
      let buf = new Buffer('0101', 'hex')
      BR(buf).read(0).length.should.equal(0)
    })
  })

  describe('#readReverse', function () {
    it('should reverse this [0, 1]', function () {
      let buf = new Buffer([0, 1])
      let br = new BR({buf: buf})
      br.readReverse().toString('hex').should.equal('0100')
    })

    it('should be able to read 0 bytes', function () {
      let buf = new Buffer('0101', 'hex')
      BR(buf).readReverse(0).length.should.equal(0)
    })
  })

  describe('#readUInt8', function () {
    it('should return 1', function () {
      let buf = new Buffer(1)
      buf.writeUInt8(1, 0)
      let br = new BR({buf: buf})
      br.readUInt8().should.equal(1)
    })
  })

  describe('#readInt8', function () {
    it('should return 1', function () {
      let buf = new Buffer(1)
      buf.writeInt8(1, 0)
      let br = new BR({buf: buf})
      br.readInt8().should.equal(1)
      BR(new Buffer('ff', 'hex')).readInt8().should.equal(-1)
    })
  })

  describe('#readUInt16BE', function () {
    it('should return 1', function () {
      let buf = new Buffer(2)
      buf.writeUInt16BE(1, 0)
      let br = new BR({buf: buf})
      br.readUInt16BE().should.equal(1)
    })
  })

  describe('#readInt16BE', function () {
    it('should return 1', function () {
      let buf = new Buffer(2)
      buf.writeInt16BE(1, 0)
      let br = new BR({buf: buf})
      br.readInt16BE().should.equal(1)
      BR(new Buffer('ffff', 'hex')).readInt16BE().should.equal(-1)
    })
  })

  describe('#readUInt16LE', function () {
    it('should return 1', function () {
      let buf = new Buffer(2)
      buf.writeUInt16LE(1, 0)
      let br = new BR({buf: buf})
      br.readUInt16LE().should.equal(1)
    })
  })

  describe('#readInt16LE', function () {
    it('should return 1', function () {
      let buf = new Buffer(2)
      buf.writeInt16LE(1, 0)
      let br = new BR({buf: buf})
      br.readInt16LE().should.equal(1)
      BR(new Buffer('ffff', 'hex')).readInt16LE().should.equal(-1)
    })
  })

  describe('#readUInt32BE', function () {
    it('should return 1', function () {
      let buf = new Buffer(4)
      buf.writeUInt32BE(1, 0)
      let br = new BR({buf: buf})
      br.readUInt32BE().should.equal(1)
    })
  })

  describe('#readInt32BE', function () {
    it('should return 1', function () {
      let buf = new Buffer(4)
      buf.writeInt32BE(1, 0)
      let br = new BR({buf: buf})
      br.readInt32BE().should.equal(1)
      BR(new Buffer('ffffffff', 'hex')).readInt32BE().should.equal(-1)
    })
  })

  describe('#readUInt32LE', function () {
    it('should return 1', function () {
      let buf = new Buffer(4)
      buf.writeUInt32LE(1, 0)
      let br = new BR({buf: buf})
      br.readUInt32LE().should.equal(1)
    })
  })

  describe('#readInt32LE', function () {
    it('should return 1', function () {
      let buf = new Buffer(4)
      buf.writeInt32LE(1, 0)
      let br = new BR({buf: buf})
      br.readInt32LE().should.equal(1)
      BR(new Buffer('ffffffff', 'hex')).readInt32LE().should.equal(-1)
    })
  })

  describe('#readUInt64BEBN', function () {
    it('should return 1', function () {
      let buf = new Buffer(8)
      buf.fill(0)
      buf.writeUInt32BE(1, 4)
      let br = new BR({buf: buf})
      br.readUInt64BEBN().toNumber().should.equal(1)
    })

    it('should return 2^64', function () {
      let buf = new Buffer(8)
      buf.fill(0xff)
      let br = new BR({buf: buf})
      br.readUInt64BEBN().toNumber().should.equal(Math.pow(2, 64))
    })
  })

  describe('#readUInt64LEBN', function () {
    it('should return 1', function () {
      let buf = new Buffer(8)
      buf.fill(0)
      buf.writeUInt32LE(1, 0)
      let br = new BR({buf: buf})
      br.readUInt64LEBN().toNumber().should.equal(1)
    })

    it('should return 2^30', function () {
      let buf = new Buffer(8)
      buf.fill(0)
      buf.writeUInt32LE(Math.pow(2, 30), 0)
      let br = new BR({buf: buf})
      br.readUInt64LEBN().toNumber().should.equal(Math.pow(2, 30))
    })

    it('should return 0', function () {
      let buf = new Buffer(8)
      buf.fill(0)
      let br = new BR({buf: buf})
      br.readUInt64LEBN().toNumber().should.equal(0)
    })

    it('should return 2^64', function () {
      let buf = new Buffer(8)
      buf.fill(0xff)
      let br = new BR({buf: buf})
      br.readUInt64LEBN().toNumber().should.equal(Math.pow(2, 64))
    })
  })

  describe('#readVarintBuf', function () {
    it('should read a 1 byte varint', function () {
      let buf = new Buffer([50])
      let br = new BR({buf: buf})
      br.readVarintBuf().length.should.equal(1)
    })

    it('should read a 3 byte varint', function () {
      let buf = new Buffer([253, 253, 0])
      let br = new BR({buf: buf})
      br.readVarintBuf().length.should.equal(3)
    })

    it('should read a 5 byte varint', function () {
      let buf = new Buffer([254, 0, 0, 0, 0])
      buf.writeUInt32LE(50000, 1)
      let br = new BR({buf: buf})
      br.readVarintBuf().length.should.equal(5)
    })

    it('should read a 9 byte varint', function () {
      let buf = BW().writeVarintBN(BN(Math.pow(2, 54).toString())).toBuffer()
      let br = new BR({buf: buf})
      br.readVarintBuf().length.should.equal(9)
    })
  })

  describe('#readVarintNum', function () {
    it('should read a 1 byte varint', function () {
      let buf = new Buffer([50])
      let br = new BR({buf: buf})
      br.readVarintNum().should.equal(50)
    })

    it('should read a 3 byte varint', function () {
      let buf = new Buffer([253, 253, 0])
      let br = new BR({buf: buf})
      br.readVarintNum().should.equal(253)
    })

    it('should read a 5 byte varint', function () {
      let buf = new Buffer([254, 0, 0, 0, 0])
      buf.writeUInt32LE(50000, 1)
      let br = new BR({buf: buf})
      br.readVarintNum().should.equal(50000)
    })

    it('should throw an error on a 9 byte varint over the javascript uint precision limit', function () {
      let buf = BW().writeVarintBN(BN(Math.pow(2, 54).toString())).toBuffer()
      let br = new BR({buf: buf})
      ;(function () {
        br.readVarintNum()
      }).should.throw('number too large to retain precision - use readVarintBN')
    })

    it('should not throw an error on a 9 byte varint not over the javascript uint precision limit', function () {
      let buf = BW().writeVarintBN(BN(Math.pow(2, 53).toString())).toBuffer()
      let br = new BR({buf: buf})
      ;(function () {
        br.readVarintNum()
      }).should.not.throw('number too large to retain precision - use readVarintBN')
    })
  })

  describe('#readVarintBN', function () {
    it('should read a 1 byte varint', function () {
      let buf = new Buffer([50])
      let br = new BR({buf: buf})
      br.readVarintBN().toNumber().should.equal(50)
    })

    it('should read a 3 byte varint', function () {
      let buf = new Buffer([253, 253, 0])
      let br = new BR({buf: buf})
      br.readVarintBN().toNumber().should.equal(253)
    })

    it('should read a 5 byte varint', function () {
      let buf = new Buffer([254, 0, 0, 0, 0])
      buf.writeUInt32LE(50000, 1)
      let br = new BR({buf: buf})
      br.readVarintBN().toNumber().should.equal(50000)
    })

    it('should read a 9 byte varint', function () {
      let buf = Buffer.concat([new Buffer([255]), new Buffer('ffffffffffffffff', 'hex')])
      let br = new BR({buf: buf})
      br.readVarintBN().toNumber().should.equal(Math.pow(2, 64))
    })
  })
})
