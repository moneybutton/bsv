/**
 * KeyPair
 * =======
 *
 * A keyPair is a collection of a private key and a public key.
 * let keyPair = new KeyPair().fromRandom()
 * let keyPair = new KeyPair().fromPrivKey(privKey)
 * let privKey = keyPair.privKey
 * let pubKey = keyPair.pubKey
 */
'use strict'

let defaultPrivKey = require('./priv-key')
let PubKey = require('./pub-key')
let Struct = require('./struct')
let Bw = require('./bw')

class KeyPair extends Struct {
  constructor (privKey, pubKey, privKeyDep = defaultPrivKey) {
    super({ privKey, pubKey })
    this.PrivKey = privKeyDep
  }

  fromJSON (json) {
    if (json.privKey) {
      this.privKey = this.PrivKey.fromJSON(json.privKey)
    }
    if (json.pubKey) {
      this.pubKey = PubKey.fromJSON(json.pubKey)
    }
    return this
  }
  /*
    toJSON () {
      let json = {}
      if (this.privKey && this.privKey !== undefined) {
        json.privKey = this.privKey.toJSON()
      }
      if (this.pubKey && this.pubKey !== undefined) {
        json.pubKey = this.pubKey.toJSON()
      }
      return json
    }
*/
  fromBr (br) {
    let buflen1 = br.readUInt8()
    if (buflen1 > 0) {
      this.privKey = new this.PrivKey().fromFastBuffer(br.read(buflen1))
    }
    let buflen2 = br.readUInt8()
    if (buflen2 > 0) {
      this.pubKey = new PubKey().fromFastBuffer(br.read(buflen2))
    }
    return this
  }

  toBw (bw) {
    if (!bw) {
      bw = new Bw()
    }
    if (this.privKey) {
      let privKeybuf = this.privKey.toFastBuffer()
      bw.writeUInt8(privKeybuf.length)
      bw.write(privKeybuf)
    } else {
      bw.writeUInt8(0)
    }
    if (this.pubKey) {
      let pubKeybuf = this.pubKey.toFastBuffer()
      bw.writeUInt8(pubKeybuf.length)
      bw.write(pubKeybuf)
    } else {
      bw.writeUInt8(0)
    }
    return bw
  }

  fromString (str) {
    return this.fromJSON(JSON.parse(str))
  }

  toString () {
    return JSON.stringify(this.toJSON())
  }

  toPublic () {
    let keyPair = new KeyPair().fromObject(this)
    keyPair.privKey = undefined
    return keyPair
  }

  fromPrivKey (privKey) {
    this.privKey = privKey
    this.pubKey = new PubKey().fromPrivKey(privKey)
    return this
  }

  static fromPrivKey (privKey) {
    return new this().fromPrivKey(privKey)
  }

  async asyncFromPrivKey (privKey) {
    this.privKey = privKey
    this.pubKey = await new PubKey().asyncFromPrivKey(privKey)
    return this
  }

  static asyncFromPrivKey (privKey) {
    return new this().asyncFromPrivKey(privKey)
  }

  fromRandom () {
    this.privKey = new this.PrivKey().fromRandom()
    this.pubKey = new PubKey().fromPrivKey(this.privKey)
    return this
  }

  static fromRandom () {
    return new this().fromRandom()
  }

  async asyncFromRandom () {
    this.privKey = new this.PrivKey().fromRandom()
    return this.asyncFromPrivKey(this.privKey)
  }

  static asyncFromRandom () {
    return new this().asyncFromRandom()
  }
}

module.exports = KeyPair

KeyPair.Mainnet = require('./mainnet-key-pair')
KeyPair.Testnet = require('./testnet-key-pair')
