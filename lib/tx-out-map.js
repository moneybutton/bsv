/**
 * Transaction Output Map
 * ======================
 *
 * A map from a transaction hash and output number to that particular output.
 * Note that the map is from the transaction *hash*, which is the value that
 * occurs in the blockchain, not the id, which is the reverse of the hash. The
 * TxOutMap is necessary when signing a transction to get the script and value
 * of that output which is plugged into the sighash algorithm.
 */
'use strict'

import { Struct } from './struct'
import { TxOut } from './tx-out'

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

  set (txHashBuf, txOutNum, txOut) {
    let label = txHashBuf.toString('hex') + ':' + txOutNum
    this.map.set(label, txOut)
    return this
  }

  get (txHashBuf, txOutNum) {
    let label = txHashBuf.toString('hex') + ':' + txOutNum
    return this.map.get(label)
  }

  setTx (tx) {
    let txhashhex = tx.hash().toString('hex')
    tx.txOuts.forEach((txOut, index) => {
      let label = txhashhex + ':' + index
      this.map.set(label, txOut)
    })
    return this
  }
}

export { TxOutMap }
