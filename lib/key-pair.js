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
let dependencies = {
  PrivKey: require('./priv-key'),
  PubKey: require('./pub-key'),
  Struct: require('./struct'),
  Bw: require('./bw'),
  asink: require('asink')
}

let inject = function (deps) {
  let PrivKey = deps.PrivKey
  let PubKey = deps.PubKey
  let Struct = deps.Struct
  let Bw = deps.Bw
  let asink = deps.asink

  class KeyPair extends Struct {
    constructor (privKey, pubKey) {
      super({privKey, pubKey})
    }

    fromJson (json) {
      if (json.privKey) {
        this.privKey = PrivKey.fromJson(json.privKey)
      }
      if (json.pubKey) {
        this.pubKey = PubKey.fromJson(json.pubKey)
      }
      return this
    }

    toJson () {
      let json = {}
      if (this.privKey && this.privKey !== undefined) {
        json.privKey = this.privKey.toJson()
      }
      if (this.pubKey && this.pubKey !== undefined) {
        json.pubKey = this.pubKey.toJson()
      }
      return json
    }

    fromBr (br) {
      let buflen1 = br.readUInt8()
      if (buflen1 > 0) {
        this.privKey = new PrivKey().fromFastBuffer(br.read(buflen1))
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
      return this.fromJson(JSON.parse(str))
    }

    toString () {
      return JSON.stringify(this.toJson())
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

    asyncFromPrivKey (privKey) {
      return asink(function * () {
        this.privKey = privKey
        this.pubKey = yield new PubKey().asyncFromPrivKey(privKey)
        return this
      }, this)
    }

    static asyncFromPrivKey (privKey) {
      return new this().asyncFromPrivKey(privKey)
    }

    fromRandom () {
      this.privKey = new PrivKey().fromRandom()
      this.pubKey = new PubKey().fromPrivKey(this.privKey)
      return this
    }

    static fromRandom () {
      return new this().fromRandom()
    }

    asyncFromRandom () {
      return asink(function * () {
        this.privKey = new PrivKey().fromRandom()
        return this.asyncFromPrivKey(this.privKey)
      }, this)
    }

    static asyncFromRandom () {
      return new this().asyncFromRandom()
    }
  }

  return KeyPair
}

inject = require('injecter')(inject, dependencies)
let KeyPair = inject()
KeyPair.Mainnet = inject({
  PrivKey: require('./priv-key').Mainnet
})
KeyPair.Testnet = inject({
  PrivKey: require('./priv-key').Testnet
})
module.exports = KeyPair
