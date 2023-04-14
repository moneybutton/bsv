import { Mnemonic } from '../mnemonic'
import { wordList } from './bip-39-jp-wordlist'

class Bip39Jp extends Mnemonic {
  constructor (mnemonic, seed) {
    super(mnemonic, seed, wordList)
  }
}

export { Bip39Jp }
