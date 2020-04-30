const Bip39 = require('./bip-39')
const enWordlist = require('./bip-39-en-wordlist')

class Bip39En extends Bip39 {
  constructor (mnemonic, seed) {
    super(mnemonic, seed, enWordlist)
  }
}

module.exports = Bip39En
