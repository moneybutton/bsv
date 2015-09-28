/**
 * Stealth Message (experimental)
 * ==============================
 */
'use strict'
let dependencies = {
  Address: require('./address'),
  cmp: require('./cmp'),
  ECIES: require('./ecies'),
  Keypair: require('./keypair'),
  Pubkey: require('./pubkey'),
  Struct: require('./struct')
}

let inject = function (deps) {
  let Address = deps.Address
  let cmp = deps.cmp
  let ECIES = deps.ECIES
  let Keypair = deps.Keypair
  let Pubkey = deps.Pubkey
  let Struct = deps.Struct

  let StealthMessage = function StealthMessage (obj) {
    if (!(this instanceof StealthMessage)) {
      return new StealthMessage(obj)
    }
    if (obj) {
      this.fromObject(obj)
    }
  }

  StealthMessage.prototype = Object.create(Struct.prototype)
  StealthMessage.prototype.constructor = StealthMessage

  StealthMessage.encrypt = function (messagebuf, toStealthAddress, fromKeypair, ivbuf) {
    let sm = StealthMessage().fromObject({
      messagebuf: messagebuf,
      toStealthAddress: toStealthAddress,
      fromKeypair: fromKeypair
    })
    sm.encrypt(ivbuf)
    let buf = Buffer.concat([
      sm.receiveAddress.hashbuf,
      sm.fromKeypair.pubkey.toDER(true),
      sm.encbuf
    ])
    return buf
  }

  StealthMessage.decrypt = function (buf, toStealthKey) {
    let sm = StealthMessage().fromObject({
      toStealthKey: toStealthKey,
      receiveAddress: Address().fromObject({hashbuf: buf.slice(0, 20)}),
      fromKeypair: Keypair().fromObject({pubkey: Pubkey().fromDER(buf.slice(20, 20 + 33))}),
      encbuf: buf.slice(20 + 33)
    })
    return sm.decrypt().messagebuf
  }

  StealthMessage.isForMe = function (buf, toStealthKey) {
    let sm = StealthMessage().fromObject({
      toStealthKey: toStealthKey,
      receiveAddress: Address().fromObject({hashbuf: buf.slice(0, 20)}),
      fromKeypair: Keypair().fromObject({pubkey: Pubkey().fromDER(buf.slice(20, 20 + 33))}),
      encbuf: buf.slice(20 + 33)
    })
    return sm.isForMe()
  }

  StealthMessage.prototype.encrypt = function (ivbuf) {
    if (!this.fromKeypair) {
      this.fromKeypair = Keypair().fromRandom()
    }
    let receivePubkey = this.toStealthAddress.getReceivePubkey(this.fromKeypair)
    this.receiveAddress = Address().fromPubkey(receivePubkey)
    this.encbuf = ECIES.encrypt(this.messagebuf, receivePubkey, this.fromKeypair, ivbuf)
    return this
  }

  StealthMessage.prototype.decrypt = function () {
    let receiveKeypair = this.toStealthKey.getReceiveKeypair(this.fromKeypair.pubkey)
    this.messagebuf = ECIES.decrypt(this.encbuf, receiveKeypair.privkey)
    return this
  }

  StealthMessage.prototype.isForMe = function () {
    let receivePubkey = this.toStealthKey.getReceivePubkey(this.fromKeypair.pubkey)
    let receiveAddress = Address().fromPubkey(receivePubkey)
    if (cmp(receiveAddress.hashbuf, this.receiveAddress.hashbuf)) {
      return true
    } else {
      return false
    }
  }

  return StealthMessage
}

inject = require('./injector')(inject, dependencies)
let StealthMessage = inject()
StealthMessage.Mainnet = inject({
  Keypair: require('./keypair').Mainnet
})
StealthMessage.Testnet = inject({
  Keypair: require('./keypair').Testnet
})
module.exports = StealthMessage
