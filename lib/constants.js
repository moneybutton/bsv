/**
 * Constants
 * =========
 *
 * Constants used to distinguish mainnet from testnet.
 */
'use strict'
import { config } from './config'

const Constants = {}

Constants.Mainnet = {
  MaxSize: 0x02000000, // MAX_SIZE
  Port: 8333,
  Address: {
    pubKeyHash: 0x00,
    payToScriptHash: 0x05
  },
  Bip32: {
    pubKey: 0x0488b21e,
    privKey: 0x0488ade4
  },
  Block: {
    maxNBits: 0x1d00ffff,
    magicNum: 0xe3e1f3e8
  },
  Msg: {
    magicNum: 0xe3e1f3e8,
    versionBytesNum: 70015 // as of Bitcoin SV v1.0.5
  },
  PrivKey: {
    versionByteNum: 0x80
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
  Port: 18333,
  Address: {
    pubKeyHash: 0x6f,
    payToScriptHash: 0xc4
  },
  Bip32: {
    pubKey: 0x043587cf,
    privKey: 0x04358394
  },
  Block: {
    maxNBits: 0x1d00ffff,
    magicNum: 0xf4e5f3f4
  },
  Msg: {
    magicNum: 0xf4e5f3f4,
    versionBytesNum: 70015 // as of Bitcoin SV v1.0.5
  },
  PrivKey: {
    versionByteNum: 0xef
  }
})

Constants.Regtest = Object.assign({}, Constants.Mainnet, {
  Port: 18444,
  Address: {
    pubKeyHash: 0x6f,
    payToScriptHash: 0xc4
  },
  Bip32: {
    pubKey: 0x043587cf,
    privKey: 0x04358394
  },
  Block: {
    maxNBits: 0x207fffff,
    magicNum: 0xdab5bffa
  },
  Msg: {
    magicNum: 0xdab5bffa,
    versionBytesNum: 70015 // as of Bitcoin SV v1.0.5
  },
  PrivKey: {
    versionByteNum: 0xef
  }
})

Constants.STN = Object.assign({}, Constants.Mainnet, {
  Port: 9333,
  Address: {
    pubKeyHash: 0x6f,
    payToScriptHash: 0xc4
  },
  Bip32: {
    pubKey: 0x043587cf,
    privKey: 0x04358394
  },
  Block: {
    maxNBits: 0x1d00ffff,
    magicNum: 0xfbcec4f9
  },
  Msg: {
    magicNum: 0xfbcec4f9,
    versionBytesNum: 70015 // as of Bitcoin SV v1.0.5
  },
  PrivKey: {
    versionByteNum: 0xef
  }
})

/**
 * Yours Bitcoin can be globally configured to mainnet or testnet. Via the
 * inject pattern, you always have access to the other network at any time.
 * However, it is very convenient to be able to change the default
 * configuration. The default is mainnet, which can be changed to testnet.
 */
// Constants.Default = Object.assign({}, Constants.Mainnet)
if (config.get('NETWORK') === 'testnet') {
  Constants.Default = Object.assign({}, Constants.Testnet)
} else if (config.get('NETWORK') === 'mainnet') {
  Constants.Default = Object.assign({}, Constants.Mainnet)
} else if (config.get('NETWORK') === 'regtest') {
  Constants.Default = Object.assign({}, Constants.Regtest)
} else if (config.get('NETWORK') === 'stn') {
  Constants.Default = Object.assign({}, Constants.STN)
} else {
  throw new Error(
    `must set network in environment variable - mainnet, testnet, regtest or stn?, received ${config.get('NETWORK')}`
  )
}

const getConstants = (magicNum) => {
  if (Constants.Mainnet.Msg.magicNum === magicNum) {
    return Constants.Mainnet
  } else if (Constants.Testnet.Msg.magicNum === magicNum) {
    return Constants.Testnet
  } else if (Constants.Regtest.Msg.magicNum === magicNum) {
    return Constants.Regtest
  } else if (Constants.STN.Msg.magicNum === magicNum) {
    return Constants.STN
  } else {
    return Constants.Default
  }
}

export { Constants, getConstants }
