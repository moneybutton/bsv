'use strict'
let Merkle = require('../lib/merkle')
let should = require('chai').should()

describe('Merkle', function () {
  it('should satisfy this basic API', function () {
    let merkle = new Merkle()
    should.exist(merkle)
    merkle = Merkle()
    should.exist(merkle)
  })

  describe('hash', function () {
    it('should hash these buffers', function () {
      let merkle1 = Merkle(undefined, new Buffer(0))
      let merkle2 = Merkle(undefined, new Buffer(0))
      let merkle = Merkle(undefined, undefined, merkle1, merkle2)
      let hashbuf = merkle.hash()
      hashbuf.length.should.equal(32)
      hashbuf.toString('hex').should.equal('352b71f195e85adbaefdcd6d7380d87067865d9a17c44d38982bb8a40bd0b393')
      // and a second time ...
      hashbuf = merkle.hash()
      hashbuf.toString('hex').should.equal('352b71f195e85adbaefdcd6d7380d87067865d9a17c44d38982bb8a40bd0b393')
    })

    it('should hash this buffer', function () {
      let merkle = Merkle(undefined, new Buffer(0))
      let hashbuf = merkle.hash()
      hashbuf.length.should.equal(32)
      hashbuf.toString('hex').should.equal('5df6e0e2761359d30a8275058e299fcc0381534545f55cf43e41983f5d4c9456')
    })
  })
})
