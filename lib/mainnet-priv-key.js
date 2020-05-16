import { PrivKey } from './priv-key'
import { Constants } from './constants'

const mainnetConstants = Constants.Mainnet.PrivKey

class MainnetPrivKey extends PrivKey {
  constructor (bn, compressed) {
    super(bn, compressed, mainnetConstants)
  }
}

export { MainnetPrivKey }
