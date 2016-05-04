/* global describe,it */
'use strict'
let should = require('chai').should()
let Struct = require('../lib/struct')
let sinon = require('sinon')
let Br = require('../lib/br')

describe('Struct', function () {
  it('should make a new struct', function () {
    let struct = new Struct()
    should.exist(struct)
    struct = new Struct()
    should.exist(struct)
  })

  describe('#fromObject', function () {
    it('should set from an object', function () {
      new Struct().fromObject({test: 'test'}).test.should.equal('test')
      Object.keys(new Struct().fromObject({})).length.should.equal(0)
    })
  })

  describe('#fromBr', function () {
    it('should throw an error if arg is not a Br', function () {
      (function () {
        new Struct().fromBr({})
      }).should.throw('br must be a buffer reader')
    })

    it('should throw a not implemented error', function () {
      (function () {
        let br = new Br()
        new Struct().fromBr(br)
      }).should.throw('not implemented')
    })
  })

  describe('#toBw', function () {
    it('should throw a not implemented error', function () {
      (function () {
        new Struct().toBw()
      }).should.throw('not implemented')
    })
  })

  describe('#genFromBuffers', function () {
    it('should throw an error', function () {
      (function () {
        new Struct().genFromBuffers().next()
      }).should.throw('not implemented')
    })
  })

  describe('#fromBuffer', function () {
    it('should throw an error if arg is not a buffer', function () {
      (function () {
        new Struct().fromBuffer({})
      }).should.throw('buf must be a buffer')
    })

    it('should throw a not implemented error', function () {
      (function () {
        var buf = new Buffer([])
        new Struct().fromBuffer(buf)
      }).should.throw('not implemented')
    })
  })

  describe('#fromFastBuffer', function () {
    it('should call fromBuffer', function () {
      let struct = new Struct()
      struct.fromBuffer = sinon.spy()
      struct = Object.create(struct)
      let buf = new Buffer('00', 'hex')
      struct.fromFastBuffer(buf)
      struct.fromBuffer.calledOnce.should.equal(true)
    })

    it('should not call fromBuffer if buf length is zero', function () {
      let struct = new Struct()
      struct.fromBuffer = sinon.spy()
      struct = Object.create(struct)
      let buf = new Buffer('', 'hex')
      struct.fromFastBuffer(buf)
      struct.fromBuffer.calledOnce.should.equal(false)
    })
  })

  describe('#toBuffer', function () {
    it('should throw a not implemented error', function () {
      (function () {
        new Struct().toBuffer()
      }).should.throw('not implemented')
    })
  })

  describe('#toFastBuffer', function () {
    it('should call toBuffer', function () {
      let struct = new Struct()
      struct.toBuffer = sinon.spy()
      struct = Object.create(struct)
      struct.property = 'test'
      Object.keys(struct).length.should.equal(1)
      struct.toFastBuffer()
      struct.toBuffer.calledOnce.should.equal(true)
    })

    it('should return zero-length buffer if object has no keys', function () {
      let struct = new Struct()
      struct.toBuffer = sinon.spy()
      struct = Object.create(struct)
      Object.keys(struct).length.should.equal(0)
      struct.toFastBuffer().length.should.equal(0)
      struct.toBuffer.calledOnce.should.equal(false)
    })
  })

  describe('#fromHex', function () {
    it('should throw an error for invalid hex string', function () {
      (function () {
        new Struct().fromHex('000')
      }).should.throw('invalid hex string')
    })

    it('should throw a not implemented error', function () {
      (function () {
        new Struct().fromHex('00')
      }).should.throw('not implemented')
    })
  })

  describe('#fromFastHex', function () {
    it('should throw an error for invalid hex string', function () {
      (function () {
        new Struct().fromFastHex('000')
      }).should.throw('invalid hex string')
    })

    it('should throw a not implemented error', function () {
      (function () {
        new Struct().fromFastHex('00')
      }).should.throw('not implemented')
    })
  })

  describe('#toHex', function () {
    it('should throw a not implemented error', function () {
      (function () {
        new Struct().toHex()
      }).should.throw('not implemented')
    })
  })

  describe('#toFastHex', function () {
    it('should return an empty string for blank data', function () {
      let hex = new Struct().toFastHex()
      ;(typeof hex === 'string').should.equal(true)
      hex.length.should.equal(0)
    })
  })

  describe('#fromString', function () {
    it('should throw an error for invalid string', function () {
      (function () {
        new Struct().fromString({})
      }).should.throw('str must be a string')
    })

    it('should throw a not implemented error', function () {
      (function () {
        new Struct().fromString('00')
      }).should.throw('not implemented')
    })
  })

  describe('#toString', function () {
    it('should throw a not implemented error', function () {
      (function () {
        new Struct().toString()
      }).should.throw('not implemented')
    })
  })

  describe('#fromJson', function () {
    it('should throw a not implemented error', function () {
      (function () {
        new Struct().fromJson()
      }).should.throw('not implemented')
    })
  })

  describe('#toJson', function () {
    it('should throw a not implemented error', function () {
      (function () {
        new Struct().toJson()
      }).should.throw('not implemented')
    })
  })
})
