const Address = require('./address')
const mainnetConstants = require('./constants').Mainnet.Address

class MainnetAddress extends Address {
  constructor (versionByteNum, hashBuf) {
    super(versionByteNum, hashBuf, mainnetConstants)
  }
}

module.exports = MainnetAddress
