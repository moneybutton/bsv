const Bip32 = require('./bip-32')
const mainnetConstants = require('./constants').Mainnet.Bip32
const mainnetPrivKey = require('./mainnet-priv-key')

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
      mainnetConstants,
      mainnetPrivKey
    )
  }
}

module.exports = MainnetBip32
