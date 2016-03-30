/**
 * Keypair
 * =======
 *
 * A keypair is a collection of a private key and a public key.
 * let keypair = Keypair().fromRandom()
 * let keypair = Keypair().fromPrivkey(privkey)
 * let privkey = keypair.privkey
 * let pubkey = keypair.pubkey
 */
'use strict'
let dependencies = {
  Privkey: require('./privkey'),
  Pubkey: require('./pubkey'),
  Struct: require('./struct'),
  BW: require('./bw'),
  asink: require('asink')
}

let inject = function (deps) {
  let Privkey = deps.Privkey
  let Pubkey = deps.Pubkey
  let Struct = deps.Struct
  let BW = deps.BW
  let asink = deps.asink

  function Keypair (privkey, pubkey) {
    if (!(this instanceof Keypair)) {
      return new Keypair(privkey, pubkey)
    }
    this.fromObject({privkey, pubkey})
  }

  Keypair.prototype = Object.create(Struct.prototype)
  Keypair.prototype.constructor = Keypair

  Keypair.prototype.fromJSON = function (json) {
    this.fromObject({
      privkey: Privkey().fromJSON(json.privkey),
      pubkey: Pubkey().fromJSON(json.pubkey)
    })
    return this
  }

  Keypair.prototype.toJSON = function () {
    let json = {
      privkey: this.privkey.toJSON(),
      pubkey: this.pubkey.toJSON()
    }
    return json
  }

  Keypair.prototype.fromBR = function (br) {
    let buflen1 = br.readUInt8()
    if (buflen1 > 0) {
      this.privkey = Privkey().fromFastBuffer(br.read(buflen1))
    }
    let buflen2 = br.readUInt8()
    if (buflen2 > 0) {
      this.pubkey = Pubkey().fromFastBuffer(br.read(buflen2))
    }
    return this
  }

  Keypair.prototype.toBW = function (bw) {
    if (!bw) {
      bw = BW()
    }
    if (this.privkey) {
      let privkeybuf = this.privkey.toFastBuffer()
      bw.writeUInt8(privkeybuf.length)
      bw.write(privkeybuf)
    } else {
      bw.writeUInt8(0)
    }
    if (this.pubkey) {
      let pubkeybuf = this.pubkey.toFastBuffer()
      bw.writeUInt8(pubkeybuf.length)
      bw.write(pubkeybuf)
    } else {
      bw.writeUInt8(0)
    }
    return bw
  }

  Keypair.prototype.fromString = function (str) {
    return this.fromJSON(JSON.parse(str))
  }

  Keypair.prototype.toString = function () {
    return JSON.stringify(this.toJSON())
  }

  Keypair.prototype.fromPrivkey = function (privkey) {
    this.privkey = privkey
    this.pubkey = Pubkey().fromPrivkey(privkey)
    return this
  }

  Keypair.prototype.asyncFromPrivkey = function (privkey) {
    return asink(function *() {
      this.privkey = privkey
      this.pubkey = yield Pubkey().asyncFromPrivkey(privkey)
      return this
    }, this)
  }

  Keypair.prototype.fromRandom = function () {
    this.privkey = Privkey().fromRandom()
    this.pubkey = Pubkey().fromPrivkey(this.privkey)
    return this
  }

  Keypair.prototype.asyncFromRandom = function () {
    return asink(function *() {
      this.privkey = Privkey().fromRandom()
      return this.asyncFromPrivkey(this.privkey)
    }, this)
  }

  return Keypair
}

inject = require('./injector')(inject, dependencies)
let Keypair = inject()
Keypair.Mainnet = inject({
  Privkey: require('./privkey').Mainnet
})
Keypair.Testnet = inject({
  Privkey: require('./privkey').Testnet
})
module.exports = Keypair
