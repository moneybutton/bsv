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

  function KeyPair (privKey, pubKey) {
    if (!(this instanceof KeyPair)) {
      return new KeyPair(privKey, pubKey)
    }
    this.fromObject({privKey, pubKey})
  }

  KeyPair.prototype = Object.create(Struct.prototype)
  KeyPair.prototype.constructor = KeyPair

  KeyPair.prototype.fromJson = function (json) {
    this.fromObject({
      privKey: new PrivKey().fromJson(json.privKey),
      pubKey: new PubKey().fromJson(json.pubKey)
    })
    return this
  }

  KeyPair.prototype.toJson = function () {
    let json = {
      privKey: this.privKey.toJson(),
      pubKey: this.pubKey.toJson()
    }
    return json
  }

  KeyPair.prototype.fromBr = function (br) {
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

  KeyPair.prototype.toBw = function (bw) {
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

  KeyPair.prototype.fromString = function (str) {
    return this.fromJson(JSON.parse(str))
  }

  KeyPair.prototype.toString = function () {
    return JSON.stringify(this.toJson())
  }

  KeyPair.prototype.fromPrivKey = function (privKey) {
    this.privKey = privKey
    this.pubKey = new PubKey().fromPrivKey(privKey)
    return this
  }

  KeyPair.prototype.asyncFromPrivKey = function (privKey) {
    return asink(function * () {
      this.privKey = privKey
      this.pubKey = yield new PubKey().asyncFromPrivKey(privKey)
      return this
    }, this)
  }

  KeyPair.prototype.fromRandom = function () {
    this.privKey = new PrivKey().fromRandom()
    this.pubKey = new PubKey().fromPrivKey(this.privKey)
    return this
  }

  KeyPair.prototype.asyncFromRandom = function () {
    return asink(function * () {
      this.privKey = new PrivKey().fromRandom()
      return this.asyncFromPrivKey(this.privKey)
    }, this)
  }

  return KeyPair
}

inject = require('injecter')(inject, dependencies)
let KeyPair = inject()
KeyPair.MainNet = inject({
  PrivKey: require('./priv-key').MainNet
})
KeyPair.TestNet = inject({
  PrivKey: require('./priv-key').TestNet
})
module.exports = KeyPair
