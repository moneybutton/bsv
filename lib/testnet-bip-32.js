import { Bip32 } from './bip-32'
import { Constants } from './constants'
import { TestnetPrivKey } from './testnet-priv-key'

const testnetConstants = Constants.Testnet.Bip32

class TestnetBip32 extends Bip32 {
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
      TestnetPrivKey
    )
  }
}

export { TestnetBip32 }
