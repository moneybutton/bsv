const KeyPair = require('./key-pair')
const mainnetPrivKey = require('./mainnet-priv-key')

class MainnetKeyPair extends KeyPair {
  constructor (privKey, pubKey) {
    super(privKey, pubKey, mainnetPrivKey)
  }
}

module.exports = MainnetKeyPair
