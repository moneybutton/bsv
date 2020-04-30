const PrivKey = require('./priv-key')
const mainnetConstants = require('./constants').Mainnet.PrivKey

class MainnetPrivKey extends PrivKey {
  constructor (bn, compressed) {
    super(bn, compressed, mainnetConstants)
  }
}

module.exports = MainnetPrivKey
