import { KeyPair } from './key-pair'
import { TestnetPrivKey } from './testnet-priv-key'

class TestnetKeyPair extends KeyPair {
  constructor (privKey, pubKey) {
    super(privKey, pubKey, TestnetPrivKey)
  }
}

export { TestnetKeyPair }
