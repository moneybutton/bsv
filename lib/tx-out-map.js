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

  class TxOutMap extends Struct {
    constructor (map) {
      super()
      this.map = new Map()
      this.fromObject({map})
    }

    toJson () {
      let json = {}
      this.map.forEach((txOut, label) => {
        json[label] = txOut.toHex()
      })
      return json
    }

    fromJson (json) {
      Object.keys(json).forEach((label) => {
        this.map.set(label, TxOut.fromHex(json[label]))
      })
      return this
    }

    add (txHashBuf, txOutNum, txOut) {
      let label = txHashBuf.toString('hex') + ':' + txOutNum
      this.map.set(label, txOut)
      return this
    }

    get (txHashBuf, txOutNum) {
      let label = txHashBuf.toString('hex') + ':' + txOutNum
      return this.map.get(label)
    }

    addTx (tx) {
      let txhashhex = tx.hash().toString('hex')
      tx.txOuts.forEach((txOut, index) => {
        let label = txhashhex + ':' + index
        this.map.set(label, txOut)
      })
      return this
    }
  }

  return TxOutMap
}

inject = require('injecter')(inject, dependencies)
let TxOutMap = inject()
module.exports = TxOutMap
