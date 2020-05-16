import { Bip32 } from './bip-32'
import { Constants } from './constants'
import { MainnetPrivKey } from './mainnet-priv-key'

const mainnetConstants = Constants.Mainnet.Bip32

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
      MainnetPrivKey
    )
  }
}

export { MainnetBip32 }
