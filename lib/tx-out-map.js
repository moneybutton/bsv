/**
 * Transaction Output Map
 * ======================
 *
 * A map from a transaction hash and output number to that particular output.
 * Note that the map is from the transaction *hash*, which is the value that
 * occurs in the blockchain, not the id, which is the reverse of the hash.
 */
'use strict'

let Struct = require('./struct')
let TxOut = require('./tx-out')

class TxOutMap extends Struct {
  constructor (map = new Map()) {
    super({ map })
  }

  toJSON () {
    let json = {}
    this.map.forEach((txOut, label) => {
      json[label] = txOut.toHex()
    })
    return json
  }

  fromJSON (json) {
    Object.keys(json).forEach(label => {
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

module.exports = TxOutMap
