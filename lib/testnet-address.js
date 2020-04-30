const Address = require('./address')
const testnetConstants = require('./constants').Testnet.Address

class TestnetAddress extends Address {
  constructor (versionByteNum, hashBuf) {
    super(versionByteNum, hashBuf, testnetConstants)
  }
}

module.exports = TestnetAddress
