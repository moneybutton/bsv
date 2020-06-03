import { Bip39 } from './bip-39'
import { wordList } from './bip-39-en-wordlist'

class Bip39En extends Bip39 {
  constructor (mnemonic, seed) {
    super(mnemonic, seed, wordList)
  }
}

export { Bip39En }
