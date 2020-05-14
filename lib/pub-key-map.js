/**
 * PubKey Map
 * ==========
 *
 * A map from (transaction hash, output number) to (script chunk index, pubKey).
 * Whening signing a bitcoin transaction, we need to be able to sign an input
 * with the correct key and also we need to know where to put signature when we
 * get it. This mapping allows us to find the key for an associated input (which
 * is identified by tx output hash and number) with which to sign the
 * transaction and then also to know where to insert the signature into the
 * input script. This gets us the public key, and we need a different method to
 * get the private key. That is because we often know the public key to be used
 * but may not have access to the private key until the entire tx is sent to
 * where the private keys are.
 */
'use strict'

let Struct = require('./struct')
let PubKey = require('./pub-key')

class PubKeyMap extends Struct {
  constructor (map = new Map()) {
    super({ map })
  }

  toJSON () {
    let json = {}
    this.map.forEach((obj, label) => {
      json[label] = {
        scriptChunkIndex: obj.scriptChunkIndex,
        pubKey: obj.pubKey.toJSON()
      }
    })
    return json
  }

  fromJSON (json) {
    Object.keys(json).forEach(label => {
      this.map.set(label, {
        scripChunkIndex: json[label].scriptChunkIndex,
        pubKey: PubKey.fromJSON(json[label].pubKey)
      })
    })
    return this
  }

  /**
   * Set a PubKey to in the map.
   *
   * @param {Buffer} txHashBuf The hash of a transsaction. Note that this is
   * *not* the reversed transaction id, but is the raw hash.
   * @param {Number} txOutNum The output number, a.k.a. the "vout".
   * @param {Number} scriptChunkIndex The index of the chunk of the script where
   * we are going to place the signature.
   * @param {PubKey} pubKey The pubKey coresponding to this (txHashBuf,
   * txOutNum, scriptChunkIndex) where we are going to sign and insert the
   * signature.
   */
  set (txHashBuf, txOutNum, scriptChunkIndex, pubKey) {
    let label = txHashBuf.toString('hex') + ':' + txOutNum
    let obj = { scriptChunkIndex, pubKey }
    this.map.set(label, obj)
    return this
  }

  /**
   * Get a PubKey from the map
   *
   * @param {Buffer} txHashBuf The hash of a transction. Note that this is *not*
   * the reversed transaction id, but is the raw hash.
   * @param {Number} txOutNum The output number, a.k.a. the "vout".
   * @param {Number} scriptChunkIndex The index of the chunk of the script where
   * we are going to place the signature.
   * @returns {PubKey}
   */
  get (txHashBuf, txOutNum) {
    let label = txHashBuf.toString('hex') + ':' + txOutNum
    return this.map.get(label)
  }
}

module.exports = PubKeyMap
