const PrivKey = require('./priv-key')
const testnetConstants = require('./constants').Testnet.PrivKey

class TestnetPrivKey extends PrivKey {
  constructor (bn, compressed) {
    super(bn, compressed, testnetConstants)
  }
}

module.exports = TestnetPrivKey
