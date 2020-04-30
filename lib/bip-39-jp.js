const Bip39 = require('./bip-39')
const jpWordlist = require('./bip-39-jp-wordlist')

class Bip39Jp extends Bip39 {
  constructor (mnemonic, seed) {
    super(mnemonic, seed, jpWordlist)
  }
}

module.exports = Bip39Jp
