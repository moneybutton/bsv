/**
 * Transaction Output Map
 * ======================
 *
 * A map from a transaction hash and output number to that particular output.
 * Note that the map is from the transaction *hash*, which is the value that
 * occurs in the blockchain, not the id, which is the reverse of the hash.
 */
'use strict'
let dependencies = {
  Struct: require('./struct'),
  TxOut: require('./tx-out')
}

let inject = function (deps) {
  let Struct = deps.Struct
  let TxOut = deps.TxOut

  function TxOutmap (obj) {
    if (!(this instanceof TxOutmap)) {
      return new TxOutmap(obj)
    }
    this.map = new Map()
    if (obj) {
      this.fromObject(obj)
    }
  }

  TxOutmap.prototype = Object.create(Struct.prototype)
  TxOutmap.prototype.constructor = TxOutmap

  TxOutmap.prototype.toJson = function () {
    let json = {}
    this.map.forEach((txout, label) => {
      json[label] = txout.toHex()
    })
    return json
  }

  TxOutmap.prototype.fromJson = function (json) {
    Object.keys(json).forEach((label) => {
      this.map.set(label, TxOut().fromHex(json[label]))
    })
    return this
  }

  TxOutmap.prototype.add = function (txHashBuf, txOutNum, txout) {
    let label = txHashBuf.toString('hex') + ':' + txOutNum
    this.map.set(label, txout)
    return this
  }

  TxOutmap.prototype.get = function (txHashBuf, txOutNum) {
    let label = txHashBuf.toString('hex') + ':' + txOutNum
    return this.map.get(label)
  }

  TxOutmap.prototype.addTx = function (tx) {
    let txhashhex = tx.hash().toString('hex')
    tx.txouts.forEach(function (txout, index) {
      let label = txhashhex + ':' + index
      this.map.set(label, txout)
    }.bind(this))
    return this
  }

  return TxOutmap
}

inject = require('injecter')(inject, dependencies)
let TxOutmap = inject()
module.exports = TxOutmap
