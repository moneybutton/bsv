'use strict'
let MerkleNode = require('../lib/merklenode')
let should = require('chai').should()

describe('MerkleNode', function () {
  it('should satisfy this basic API', function () {
    let merklenode = new MerkleNode()
    should.exist(merklenode)
    merklenode = MerkleNode()
    should.exist(merklenode)
  })

  describe('hash', function () {
    it('should hash these buffers', function () {
      let merkleNode = MerkleNode(undefined, new Buffer(0), new Buffer(0))
      let hashbuf = merkleNode.hash()
      hashbuf.length.should.equal(32)
      hashbuf.toString('hex').should.equal('352b71f195e85adbaefdcd6d7380d87067865d9a17c44d38982bb8a40bd0b393')
    })
  })
})
