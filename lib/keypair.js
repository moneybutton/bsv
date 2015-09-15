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
  Struct: require('./struct')
}

function inject (deps) {
  let Privkey = deps.Privkey
  let Pubkey = deps.Pubkey
  let Struct = deps.Struct

  function Keypair (privkey, pubkey) {
    if (!(this instanceof Keypair))
      return new Keypair(privkey, pubkey)
    this.fromObject({
      privkey: privkey,
      pubkey: pubkey
    })
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

  Keypair.prototype.fromRandom = function () {
    this.privkey = Privkey().fromRandom()
    this.pubkey = Pubkey().fromPrivkey(this.privkey)
    return this
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
