import { PrivKey } from './priv-key'
import { Constants } from './constants'

const testnetConstants = Constants.Testnet.Bip32

class TestnetPrivKey extends PrivKey {
  constructor (bn, compressed) {
    super(bn, compressed, testnetConstants)
  }
}

export { TestnetPrivKey }
