/* global describe,it */
'use strict'
import should from 'should'
import { Struct } from '../lib/struct'
import sinon from 'sinon'
import { Br } from '../lib/br'

describe('Struct', function () {
  it('should make a new struct', function () {
    let struct = new Struct()
    should.exist(struct)
    struct = new Struct()
    should.exist(struct)
  })

  describe('#fromObject', function () {
    it('should set from an object', function () {
      new Struct().fromObject({ test: 'test' }).test.should.equal('test')
      Object.keys(new Struct().fromObject({})).length.should.equal(0)
    })
  })

  describe('@fromObject', function () {
    it('should set from an object', function () {
      Struct.fromObject({ test: 'test' }).test.should.equal('test')
      Object.keys(Struct.fromObject({})).length.should.equal(0)
    })
  })

  describe('#fromBr', function () {
    it('should throw an error if arg is not a Br', function () {
      ;(function () {
        new Struct().fromBr({})
      }.should.throw('br must be a buffer reader'))
    })

    it('should throw a not implemented error', function () {
      ;(function () {
        const br = new Br()
        new Struct().fromBr(br)
      }.should.throw('not implemented'))
    })
  })

  describe('@fromBr', function () {
    it('should throw an error if arg is not a Br', function () {
      ;(function () {
        Struct.fromBr({})
      }.should.throw('br must be a buffer reader'))
    })

    it('should throw a not implemented error', function () {
      ;(function () {
        const br = new Br()
        Struct.fromBr(br)
      }.should.throw('not implemented'))
    })
  })

  describe('#asyncFromBr', function () {
    it('should throw an error if arg is not a Br', function () {
      ;(function () {
        new Struct().asyncFromBr({})
      }.should.throw('br must be a buffer reader'))
    })

    it('should throw a not implemented error', function () {
      ;(function () {
        const br = new Br()
        new Struct().asyncFromBr(br)
      }.should.throw('not implemented'))
    })
  })

  describe('@asyncFromBr', function () {
    it('should throw an error if arg is not a Br', function () {
      ;(function () {
        Struct.asyncFromBr({})
      }.should.throw('br must be a buffer reader'))
    })

    it('should throw a not implemented error', function () {
      ;(function () {
        const br = new Br()
        Struct.asyncFromBr(br)
      }.should.throw('not implemented'))
    })
  })

  describe('#toBw', function () {
    it('should throw a not implemented error', function () {
      ;(function () {
        new Struct().toBw()
      }.should.throw('not implemented'))
    })
  })

  describe('#asyncToBw', function () {
    it('should throw a not implemented error', function () {
      ;(function () {
        new Struct().asyncToBw()
      }.should.throw('not implemented'))
    })
  })

  describe('#genFromBuffers', function () {
    it('should throw an error', function () {
      ;(function () {
        new Struct().genFromBuffers().next()
      }.should.throw('not implemented'))
    })
  })

  describe('#fromBuffer', function () {
    it('should throw an error if arg is not a buffer', function () {
      ;(function () {
        new Struct().fromBuffer({})
      }.should.throw('buf must be a buffer'))
    })

    it('should throw a not implemented error', function () {
      ;(function () {
        var buf = Buffer.from([])
        new Struct().fromBuffer(buf)
      }.should.throw('not implemented'))
    })
  })

  describe('@fromBuffer', function () {
    it('should throw an error if arg is not a buffer', function () {
      ;(function () {
        Struct.fromBuffer({})
      }.should.throw('buf must be a buffer'))
    })

    it('should throw a not implemented error', function () {
      ;(function () {
        var buf = Buffer.from([])
        Struct.fromBuffer(buf)
      }.should.throw('not implemented'))
    })
  })

  describe('#asyncFromBuffer', function () {
    it('should throw an error if arg is not a buffer', function () {
      ;(function () {
        new Struct().asyncFromBuffer({})
      }.should.throw('buf must be a buffer'))
    })

    it('should throw a not implemented error', function () {
      ;(function () {
        var buf = Buffer.from([])
        new Struct().asyncFromBuffer(buf)
      }.should.throw('not implemented'))
    })
  })

  describe('@asyncFromBuffer', function () {
    it('should throw an error if arg is not a buffer', function () {
      ;(function () {
        Struct.asyncFromBuffer({})
      }.should.throw('buf must be a buffer'))
    })

    it('should throw a not implemented error', function () {
      ;(function () {
        var buf = Buffer.from([])
        Struct.asyncFromBuffer(buf)
      }.should.throw('not implemented'))
    })
  })

  describe('#fromFastBuffer', function () {
    it('should call fromBuffer', function () {
      let struct = new Struct()
      struct.fromBuffer = sinon.spy()
      struct = Object.create(struct)
      const buf = Buffer.from('00', 'hex')
      struct.fromFastBuffer(buf)
      struct.fromBuffer.calledOnce.should.equal(true)
    })

    it('should not call fromBuffer if buf length is zero', function () {
      let struct = new Struct()
      struct.fromBuffer = sinon.spy()
      struct = Object.create(struct)
      const buf = Buffer.from('', 'hex')
      struct.fromFastBuffer(buf)
      struct.fromBuffer.calledOnce.should.equal(false)
    })
  })

  describe('@fromFastBuffer', function () {
    it('should call fromBuffer', function () {
      class StructMock extends Struct { }
      StructMock.prototype.fromBuffer = sinon.spy()
      const buf = Buffer.from('00', 'hex')
      StructMock.fromFastBuffer(buf)
      StructMock.prototype.fromBuffer.calledOnce.should.equal(true)
    })

    it('should not call fromBuffer if buf length is zero', function () {
      class StructMock extends Struct { }
      StructMock.prototype.fromBuffer = sinon.spy()
      const buf = Buffer.from('', 'hex')
      StructMock.fromFastBuffer(buf)
      StructMock.prototype.fromBuffer.calledOnce.should.equal(false)
    })
  })

  describe('#toBuffer', function () {
    it('should throw a not implemented error', function () {
      ;(function () {
        new Struct().toBuffer()
      }.should.throw('not implemented'))
    })
  })

  describe('#asyncToBuffer', function () {
    it('should throw a not implemented error', function () {
      ;(function () {
        new Struct().asyncToBuffer()
      }.should.throw('not implemented'))
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
      ;(function () {
        new Struct().fromHex('x00')
      }.should.throw('invalid hex string'))
    })

    it('should throw a not implemented error', function () {
      ;(function () {
        new Struct().fromHex('00')
      }.should.throw('not implemented'))
    })
  })

  describe('@fromHex', function () {
    it('should throw an error for invalid hex string', function () {
      ;(function () {
        Struct.fromHex('x00')
      }.should.throw('invalid hex string'))
    })

    it('should throw a not implemented error', function () {
      ;(function () {
        Struct.fromHex('00')
      }.should.throw('not implemented'))
    })
  })

  describe('#fromFastHex', function () {
    it('should throw an error for invalid hex string', function () {
      ;(function () {
        new Struct().fromFastHex('x00')
      }.should.throw('invalid hex string'))
    })

    it('should throw a not implemented error', function () {
      ;(function () {
        new Struct().fromFastHex('00')
      }.should.throw('not implemented'))
    })
  })

  describe('@fromFastHex', function () {
    it('should throw an error for invalid hex string', function () {
      ;(function () {
        Struct.fromFastHex('x00')
      }.should.throw('invalid hex string'))
    })

    it('should throw a not implemented error', function () {
      ;(function () {
        Struct.fromFastHex('00')
      }.should.throw('not implemented'))
    })
  })

  describe('#toHex', function () {
    it('should throw a not implemented error', function () {
      ;(function () {
        new Struct().toHex()
      }.should.throw('not implemented'))
    })
  })

  describe('#asyncToHex', function () {
    it('should throw a not implemented error', function () {
      ;(function () {
        new Struct().asyncToHex()
      }.should.throw('not implemented'))
    })
  })

  describe('#toFastHex', function () {
    it('should return an empty string for blank data', function () {
      const hex = new Struct().toFastHex()
      ;(typeof hex === 'string').should.equal(true)
      hex.length.should.equal(0)
    })
  })

  describe('#fromString', function () {
    it('should throw an error for invalid string', function () {
      ;(function () {
        new Struct().fromString({})
      }.should.throw('str must be a string'))
    })

    it('should throw a not implemented error', function () {
      ;(function () {
        new Struct().fromString('00')
      }.should.throw('not implemented'))
    })
  })

  describe('@fromString', function () {
    it('should throw an error for invalid string', function () {
      ;(function () {
        Struct.fromString({})
      }.should.throw('str must be a string'))
    })

    it('should throw a not implemented error', function () {
      ;(function () {
        Struct.fromString('00')
      }.should.throw('not implemented'))
    })
  })

  describe('#asyncFromString', function () {
    it('should throw an error for invalid string', function () {
      ;(function () {
        new Struct().asyncFromString({})
      }.should.throw('str must be a string'))
    })

    it('should throw a not implemented error', function () {
      ;(function () {
        new Struct().asyncFromString('00')
      }.should.throw('not implemented'))
    })
  })

  describe('@asyncFromString', function () {
    it('should throw an error for invalid string', function () {
      ;(function () {
        Struct.asyncFromString({})
      }.should.throw('str must be a string'))
    })

    it('should throw a not implemented error', function () {
      ;(function () {
        Struct.asyncFromString('00')
      }.should.throw('not implemented'))
    })
  })

  describe('#toString', function () {
    it('should throw a not implemented error', function () {
      ;(function () {
        new Struct().toString()
      }.should.throw('not implemented'))
    })
  })

  describe('#asyncToString', function () {
    it('should throw a not implemented error', function () {
      ;(function () {
        new Struct().asyncToString()
      }.should.throw('not implemented'))
    })
  })

  describe('#fromJSON', function () {
    it('should throw a not implemented error', function () {
      ;(function () {
        new Struct().fromJSON()
      }.should.throw('not implemented'))
    })
  })

  describe('@fromJSON', function () {
    it('should throw a not implemented error', function () {
      ;(function () {
        Struct.fromJSON()
      }.should.throw('not implemented'))
    })
  })

  describe('#asyncFromJSON', function () {
    it('should throw a not implemented error', function () {
      ;(function () {
        new Struct().asyncFromJSON()
      }.should.throw('not implemented'))
    })
  })

  describe('@asyncFromJSON', function () {
    it('should throw a not implemented error', function () {
      ;(function () {
        Struct.asyncFromJSON()
      }.should.throw('not implemented'))
    })
  })

  describe('#toJSON', function () {
    it('should convert an object into a json string', function () {
      const obj = new Struct()
      obj.arr = [1, 2, 3, 4]
      obj.anotherObj = new Struct()

      const json = obj.toJSON()

      should.exist(json.arr)
      should.exist(json.anotherObj)
    })
  })

  describe('#asyncToJSON', function () {
    it('should throw a not implemented error', function () {
      ;(function () {
        new Struct().asyncToJSON()
      }.should.throw('not implemented'))
    })
  })

  describe('#clone', function () {
    it('should call cloneByJSON', function () {
      const struct = new Struct()
      struct.cloneByJSON = sinon.spy()
      struct.clone()
      struct.cloneByJSON.calledOnce.should.equal(true)
    })
  })

  describe('#cloneByBuffer', function () {
    it('should call toBuffer', function () {
      class Struct2 extends Struct {
        toBuffer () {
          return {}
        }

        fromBuffer (obj) {
          return this
        }
      }
      const struct = new Struct2()
      struct.toBuffer = sinon.spy()
      struct.cloneByBuffer()
      struct.toBuffer.calledOnce.should.equal(true)
    })
  })

  describe('#cloneByFastBuffer', function () {
    it('should call toFastBuffer', function () {
      class Struct2 extends Struct {
        toFastBuffer () {
          return {}
        }

        fromFastBuffer (obj) {
          return this
        }
      }
      const struct = new Struct2()
      struct.toFastBuffer = sinon.spy()
      struct.cloneByFastBuffer()
      struct.toFastBuffer.calledOnce.should.equal(true)
    })
  })

  describe('#cloneByHex', function () {
    it('should call toHex', function () {
      class Struct2 extends Struct {
        toHex () {
          return {}
        }

        fromHex (obj) {
          return this
        }
      }
      const struct = new Struct2()
      struct.toHex = sinon.spy()
      struct.cloneByHex()
      struct.toHex.calledOnce.should.equal(true)
    })
  })

  describe('#cloneByString', function () {
    it('should call toString', function () {
      class Struct2 extends Struct {
        toString () {
          return {}
        }

        fromString (obj) {
          return this
        }
      }
      const struct = new Struct2()
      struct.toString = sinon.spy()
      struct.cloneByString()
      struct.toString.calledOnce.should.equal(true)
    })
  })

  describe('#cloneByJSON', function () {
    it('should call toJSON', function () {
      class Struct2 extends Struct {
        toJSON () {
          return {}
        }

        fromJSON (obj) {
          return this
        }
      }
      const struct = new Struct2()
      struct.toJSON = sinon.spy()
      struct.cloneByJSON()
      struct.toJSON.calledOnce.should.equal(true)
    })
  })
})
