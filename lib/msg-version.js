/**
 * MsgVersion
 * ==========
 *
 * Sends version information about what p2p features this node or another
 * accepts. Confusingly, this "version" is not a number, but a data structure
 * used to communicate version information.
 */
'use strict'
let dependencies = {
  Version: require('./version'),
  Msg: require('./msg')
}

let inject = function (deps) {
  let Version = deps.Version
  let Msg = deps.Msg

  class MsgVersion extends Msg {
    initialize () {
      Msg.prototype.initialize.call(this)
      this.setCmd('version')
      return this
    }

    fromVersion (version) {
      this.setData(version.toBuffer())
      return this
    }

    static fromVersion (version) {
      return new this().fromVersion(version)
    }

    asyncFromVersion (version) {
      return this.asyncSetData(version.toBuffer())
    }

    static asyncFromVersion (version) {
      return new this().asyncFromVersion(version)
    }

    toVersion () {
      return new Version().fromBuffer(this.dataBuf)
    }

    isValid () {
      // TODO: More validation
      return this.getCmd() === 'version'
    }
  }

  return MsgVersion
}

inject = require('injecter')(inject, dependencies)
let MsgVersion = inject()
MsgVersion.Mainnet = inject({
  Version: require('./version').Mainnet,
  Msg: require('./msg').Mainnet
})
MsgVersion.Testnet = inject({
  Version: require('./version').Testnet,
  Msg: require('./msg').Testnet
})
module.exports = MsgVersion
