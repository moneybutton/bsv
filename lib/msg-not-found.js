/**
 * MsgNotFound
 * ===========
 *
 * Sent when requested data is not found. This is identical to MsgInv, except
 * the command is "notfound", and it is used in slightly different cases. As
 * such it simply inherits from MsgInv.
 */
'use strict'
let dependencies = {
  MsgInv: require('./msg-inv')
}

let inject = function (deps) {
  let MsgInv = deps.MsgInv

  class MsgNotFound extends MsgInv {
    initialize () {
      MsgInv.prototype.initialize.call(this)
      this.setCmd('notfound')
      return this
    }

    isValid () {
      return this.getCmd() === 'notfound'
    }
  }

  return MsgNotFound
}

inject = require('injecter')(inject, dependencies)
let MsgNotFound = inject()
MsgNotFound.Mainnet = inject({
  MsgInv: require('./msg-inv').Mainnet
})
MsgNotFound.Testnet = inject({
  MsgInv: require('./msg-inv').Testnet
})
module.exports = MsgNotFound
