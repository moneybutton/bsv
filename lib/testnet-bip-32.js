const Bip32 = require('./bip-32')
const testnetConstants = require('./constants').Testnet.Bip32
const testnetPrivKey = require('./testnet-priv-key')

class MainnetBip32 extends Bip32 {
  constructor (
    versionBytesNum,
    depth,
    parentFingerPrint,
    childIndex,
    chainCode,
    privKey,
    pubKey
  ) {
    super(
      versionBytesNum,
      depth,
      parentFingerPrint,
      childIndex,
      chainCode,
      privKey,
      pubKey,
      testnetConstants,
      testnetPrivKey
    )
  }
}

module.exports = MainnetBip32
