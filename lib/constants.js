/**
 * Constants
 * =========
 *
 * Constants used to distinguish mainnet from testnet.
 */
'use strict'
let config = require('./config')

let Constants = module.exports

Constants.Mainnet = {
  maxsize: 0x02000000, // MAX_SIZE
  Address: {
    pubKeyHash: 0x00,
    scriptHash: 0x05
  },
  Bip32: {
    pubKey: 0x0488b21e,
    privKey: 0x0488ade4
  },
  Block: {
    maxNBits: 0x1d00ffff,
    magicNum: 0xf9beb4d9
  },
  Msg: {
    magicNum: 0xf9beb4d9,
    versionBytesNum: 70012 // as of Bitcoin Core v0.12.0
  },
  PrivKey: {
    versionByteNum: 0x80
  },
  StealthAddress: {
    versionByteNum: 42
  },
  TxBuilder: {
    dust: 546, // number of satoshis that an output can't be less than
    feePerKbNum: 0.00000500e8
  },
  Workers: {
    // Cannot be 5 seconds. This is actually too low for low end devices. We
    // have found by experimenting with Chrome developer tools that 60 seconds
    // works on low end mobile.
    timeout: 60000
  }
}

Constants.Testnet = Object.assign({}, Constants.Mainnet, {
  Address: {
    pubKeyHash: 0x6f,
    scriptHash: 0xc4
  },
  Bip32: {
    pubKey: 0x043587cf,
    privKey: 0x04358394
  },
  Block: {
    maxNBits: 0x1d00ffff,
    magicNum: 0x0b110907
  },
  Msg: {
    magicNum: 0x0b110907,
    versionBytesNum: 70012 // as of Bitcoin Core v0.12.0
  },
  PrivKey: {
    versionByteNum: 0xef
  },
  StealthAddress: {
    versionByteNum: 43
  }
})

/**
 * Yours Bitcoin can be globally configured to mainnet or testnet. Via the
 * inject pattern, you always have access to the other network at any time.
 * However, it is very convenient to be able to change the default
 * configuration. The default is mainnet, which can be changed to testnet.
 */
if (config.get('NETWORK') === 'testnet') {
  Constants.Default = Object.assign({}, Constants.Testnet)
} else if (config.get('NETWORK') === 'mainnet') {
  Constants.Default = Object.assign({}, Constants.Mainnet)
} else {
  throw new Error(
    'must set network in environment variable - mainnet or testnet?'
  )
}
