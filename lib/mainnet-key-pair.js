import { KeyPair } from './key-pair'
import { MainnetPrivKey } from './mainnet-priv-key'

class MainnetKeyPair extends KeyPair {
  constructor (privKey, pubKey) {
    super(privKey, pubKey, MainnetPrivKey)
  }
}

export { MainnetKeyPair }
