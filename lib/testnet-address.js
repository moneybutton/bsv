import { Address } from './address'
import { Constants } from './constants'

const testnetConstants = Constants.Testnet.Bip32

class TestnetAddress extends Address {
  constructor (versionByteNum, hashBuf) {
    super(versionByteNum, hashBuf, testnetConstants)
  }
}

export { TestnetAddress }
