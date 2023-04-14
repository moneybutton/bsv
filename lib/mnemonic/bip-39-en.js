import { Mnemonic } from '../mnemonic'
import { wordList } from './bip-39-en-wordlist'

class Bip39En extends Mnemonic {
  constructor (mnemonic, seed) {
    super(mnemonic, seed, wordList)
  }
}

export { Bip39En }
