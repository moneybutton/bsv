import { Bip39 } from './bip-39'
import { wordList } from './bip-39-jp-wordlist'

class Bip39Jp extends Bip39 {
  constructor (mnemonic, seed) {
    super(mnemonic, seed, wordList)
  }
}

export { Bip39Jp }
