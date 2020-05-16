import { Address } from './address'
import { Constants } from './constants'

const mainnetConstants = Constants.Mainnet.Address

class MainnetAddress extends Address {
  constructor (versionByteNum, hashBuf) {
    super(versionByteNum, hashBuf, mainnetConstants)
  }
}

export { MainnetAddress }
