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

  function MerkleNode (hashbuf, merklenode1, merklenode2) {
    if (!(this instanceof MerkleNode)) {
      return new MerkleNode(hashbuf, merklenode1, merklenode2)
    }
    this.fromObject({hashbuf, merklenode1, merklenode2})
  }

  MerkleNode.prototype = Object.create(Struct.prototype)
  MerkleNode.prototype.constructor = MerkleNode

  MerkleNode.prototype.hash = function () {
    if (this.hashbuf) {
      return this.hashbuf
    }
    let hashbuf1, hashbuf2
    if (Buffer.isBuffer(this.merklenode1)) {
      hashbuf1 = Hash.sha256sha256(this.merklenode1)
    } else {
      hashbuf1 = this.merklenode1.hash()
    }
    if (Buffer.isBuffer(this.merklenode2)) {
      hashbuf2 = Hash.sha256sha256(this.merklenode2)
    } else {
      hashbuf2 = this.merklenode2.hash()
    }
    return Hash.sha256sha256(Buffer.concat([hashbuf1, hashbuf2]))
  }

  return MerkleNode
}

inject = require('./injector')(inject, dependencies)
let MerkleNode = inject()
module.exports = MerkleNode
