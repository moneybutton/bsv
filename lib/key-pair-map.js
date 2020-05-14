/**
 * KeyPair Map
 * ===========
 *
 * A map from (transaction hash, output number) to (script chunk index,
 * keypair).  * Whening signing a bitcoin transaction, we need to be able to
 * sign an input with the correct key and also we need to know where to put
 * signature when we get it. This mapping allows us to find the key for an
 * associated input (which is identified by tx output hash and number) with
 * which to sign the transaction and then also to know where to insert the
 * signature into the input script.
 */
'use strict'

let Struct = require('./struct')
let KeyPair = require('./key-pair')

class KeyPairMap extends Struct {
  constructor (map = new Map()) {
    super({ map })
  }

  toJSON () {
    let json = {}
    this.map.forEach((obj, label) => {
      json[label] = {
        scriptChunkIndex: obj.scriptChunkIndex,
        keyPair: obj.keyPair.toJSON()
      }
    })
    return json
  }

  fromJSON (json) {
    Object.keys(json).forEach(label => {
      this.map.set(label, {
        scripChunkIndex: json[label].scriptChunkIndex,
        keyPair: KeyPair.fromJSON(json[label].keyPair)
      })
    })
    return this
  }

  /**
   * Set a KeyPair to in the map.
   *
   * @param {Buffer} txHashBuf The hash of a transsaction. Note that this is *not*
   * the reversed transaction id, but is the raw hash.
   * @param {Number} txOutNum The output number, a.k.a. the "vout".
   * @param {Number} scriptChunkIndex The index of the chunk of the script where
   * we are going to place the signature.
   * @param {KeyPair} keyPair The keypair coresponding to this (txHashBuf,
   * txOutNum, scriptChunkIndex) where we are going to sign and insert the
   * signature.
   */
  set (txHashBuf, txOutNum, scriptChunkIndex, keyPair) {
    let label = txHashBuf.toString('hex') + ':' + txOutNum
    let obj = { scriptChunkIndex, keyPair }
    this.map.set(label, obj)
    return this
  }

  /**
   * Get a KeyPair from the map
   *
   * @param {Buffer} txHashBuf The hash of a transction. Note that this is *not*
   * the reversed transaction id, but is the raw hash.
   * @param {Number} txOutNum The output number, a.k.a. the "vout".
   * @param {Number} scriptChunkIndex The index of the chunk of the script where
   * we are going to place the signature.
   * @returns {KeyPair}
   */
  get (txHashBuf, txOutNum) {
    let label = txHashBuf.toString('hex') + ':' + txOutNum
    return this.map.get(label)
  }
}

module.exports = KeyPairMap
