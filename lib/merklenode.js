/**
 * Merkle Node
 * ===========
 *
 * A node in a Merkle tree. A node can be hashed, and either links to two other
 * nodes, or to two buffers.
 */
'use strict'

let dependencies = {
  Hash: require('./hash'),
  Struct: require('./struct')
}

let inject = function (deps) {
  let Hash = deps.Hash
  let Struct = deps.Struct

  function MerkleNode (hashbuf, buf, merklenode1, merklenode2) {
    if (!(this instanceof MerkleNode)) {
      return new MerkleNode(hashbuf, buf, merklenode1, merklenode2)
    }
    this.fromObject({hashbuf, buf, merklenode1, merklenode2})
  }

  MerkleNode.prototype = Object.create(Struct.prototype)
  MerkleNode.prototype.constructor = MerkleNode

  MerkleNode.prototype.hash = function () {
    if (this.hashbuf) {
      return this.hashbuf
    }
    if (this.buf) {
      return Hash.sha256sha256(this.buf)
    }
    let hashbuf1 = this.merklenode1.hash()
    let hashbuf2 = this.merklenode2.hash()
    this.buf = Buffer.concat([hashbuf1, hashbuf2])
    return Hash.sha256sha256(this.buf)
  }

  return MerkleNode
}

inject = require('./injector')(inject, dependencies)
let MerkleNode = inject()
module.exports = MerkleNode
