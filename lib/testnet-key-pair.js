const KeyPair = require('./key-pair')
const testnetPrivKey = require('./testnet-priv-key')

class TestnetKeyPair extends KeyPair {
  constructor (privKey, pubKey) {
    super(privKey, pubKey, testnetPrivKey)
  }
}

module.exports = TestnetKeyPair
