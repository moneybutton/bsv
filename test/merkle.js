/* global describe,it */
'use strict'
import { Merkle } from '../lib/merkle'
import should from 'should'

describe('Merkle', function () {
  it('should satisfy this basic API', function () {
    const merkle = new Merkle()
    should.exist(merkle)
    should.exist(merkle)
  })

  describe('hash', function () {
    it('should hash these buffers', function () {
      const merkle1 = new Merkle(undefined, Buffer.alloc(0))
      const merkle2 = new Merkle(undefined, Buffer.alloc(0))
      const merkle = new Merkle(undefined, undefined, merkle1, merkle2)
      let hashBuf = merkle.hash()
      hashBuf.length.should.equal(32)
      hashBuf
        .toString('hex')
        .should.equal(
          '352b71f195e85adbaefdcd6d7380d87067865d9a17c44d38982bb8a40bd0b393'
        )
      // and a second time ...
      hashBuf = merkle.hash()
      hashBuf
        .toString('hex')
        .should.equal(
          '352b71f195e85adbaefdcd6d7380d87067865d9a17c44d38982bb8a40bd0b393'
        )
    })

    it('should hash this buffer', function () {
      const merkle = new Merkle(undefined, Buffer.alloc(0))
      const hashBuf = merkle.hash()
      hashBuf.length.should.equal(32)
      hashBuf
        .toString('hex')
        .should.equal(
          '5df6e0e2761359d30a8275058e299fcc0381534545f55cf43e41983f5d4c9456'
        )
    })
  })

  describe('#fromBuffers', function () {
    it('should find this merkle root from three buffers', function () {
      const bufs = [Buffer.alloc(0), Buffer.alloc(0), Buffer.alloc(0)]
      const merkle = new Merkle().fromBuffers(bufs)
      const hashBuf = merkle.hash()
      hashBuf.length.should.equal(32)
      hashBuf
        .toString('hex')
        .should.equal(
          '647fedb4d19e11915076dd60fa72a8e03eb33f6dec87a4f0662b0c1f378a81cb'
        )
      merkle.leavesNum().should.equal(4)
    })

    it('should find this merkle root from four buffers', function () {
      const bufs = [
        Buffer.alloc(0),
        Buffer.alloc(0),
        Buffer.alloc(0),
        Buffer.alloc(0)
      ]
      const merkle = new Merkle().fromBuffers(bufs)
      const hashBuf = merkle.hash()
      hashBuf.length.should.equal(32)
      hashBuf
        .toString('hex')
        .should.equal(
          '647fedb4d19e11915076dd60fa72a8e03eb33f6dec87a4f0662b0c1f378a81cb'
        )
      merkle.leavesNum().should.equal(4)
    })

    it('should find this merkle root from 9 buffers', function () {
      const bufs = []
      for (let i = 0; i < 9; i++) {
        bufs[i] = Buffer.alloc(0)
      }
      const merkle = new Merkle().fromBuffers(bufs)
      const hashBuf = merkle.hash()
      hashBuf.length.should.equal(32)
      hashBuf
        .toString('hex')
        .should.equal(
          '9f187f4339d07e1963d404f31d28e4557cd72a320085d188f26c943fc604281e'
        )
      merkle.leavesNum().should.equal(16)
    })
  })

  describe('@fromBuffers', function () {
    it('should find this merkle root from three buffers', function () {
      const bufs = [Buffer.alloc(0), Buffer.alloc(0), Buffer.alloc(0)]
      const merkle = Merkle.fromBuffers(bufs)
      const hashBuf = merkle.hash()
      hashBuf.length.should.equal(32)
      hashBuf
        .toString('hex')
        .should.equal(
          '647fedb4d19e11915076dd60fa72a8e03eb33f6dec87a4f0662b0c1f378a81cb'
        )
      merkle.leavesNum().should.equal(4)
    })

    it('should find this merkle root from four buffers', function () {
      const bufs = [
        Buffer.alloc(0),
        Buffer.alloc(0),
        Buffer.alloc(0),
        Buffer.alloc(0)
      ]
      const merkle = Merkle.fromBuffers(bufs)
      const hashBuf = merkle.hash()
      hashBuf.length.should.equal(32)
      hashBuf
        .toString('hex')
        .should.equal(
          '647fedb4d19e11915076dd60fa72a8e03eb33f6dec87a4f0662b0c1f378a81cb'
        )
      merkle.leavesNum().should.equal(4)
    })

    it('should find this merkle root from 9 buffers', function () {
      const bufs = []
      for (let i = 0; i < 9; i++) {
        bufs[i] = Buffer.alloc(0)
      }
      const merkle = Merkle.fromBuffers(bufs)
      const hashBuf = merkle.hash()
      hashBuf.length.should.equal(32)
      hashBuf
        .toString('hex')
        .should.equal(
          '9f187f4339d07e1963d404f31d28e4557cd72a320085d188f26c943fc604281e'
        )
      merkle.leavesNum().should.equal(16)
    })
  })

  describe('#fromBufferArrays', function () {
    it('should find this merkle root from two buffers', function () {
      const bufs1 = [Buffer.alloc(0)]
      const bufs2 = [Buffer.alloc(0)]
      const merkle = new Merkle().fromBufferArrays(bufs1, bufs2)
      const hashBuf = merkle.hash()
      hashBuf.length.should.equal(32)
    })

    it('should find this merkle root from four buffers', function () {
      const bufs1 = [Buffer.alloc(0), Buffer.alloc(0)]
      const bufs2 = [Buffer.alloc(0), Buffer.alloc(0)]
      const merkle = new Merkle().fromBufferArrays(bufs1, bufs2)
      const hashBuf = merkle.hash()
      hashBuf.length.should.equal(32)
    })
  })

  describe('@fromBufferArrays', function () {
    it('should find this merkle root from two buffers', function () {
      const bufs1 = [Buffer.alloc(0)]
      const bufs2 = [Buffer.alloc(0)]
      const merkle = Merkle.fromBufferArrays(bufs1, bufs2)
      const hashBuf = merkle.hash()
      hashBuf.length.should.equal(32)
    })

    it('should find this merkle root from four buffers', function () {
      const bufs1 = [Buffer.alloc(0), Buffer.alloc(0)]
      const bufs2 = [Buffer.alloc(0), Buffer.alloc(0)]
      const merkle = Merkle.fromBufferArrays(bufs1, bufs2)
      const hashBuf = merkle.hash()
      hashBuf.length.should.equal(32)
    })
  })
})
