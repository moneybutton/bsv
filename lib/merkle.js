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

  function Merkle (hashbuf, buf, merklenode1, merklenode2) {
    if (!(this instanceof Merkle)) {
      return new Merkle(hashbuf, buf, merklenode1, merklenode2)
    }
    this.fromObject({hashbuf, buf, merklenode1, merklenode2})
  }

  Merkle.prototype = Object.create(Struct.prototype)
  Merkle.prototype.constructor = Merkle

  Merkle.prototype.hash = function () {
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

  return Merkle
}

inject = require('./injector')(inject, dependencies)
let Merkle = inject()
module.exports = Merkle
