/**
 * Constants
 * =========
 *
 * Constants used to distinguish mainnet from testnet.
 */
'use strict'

let Constants = module.exports

Constants.MainNet = {
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
    versionNum: 70012 // as of Bitcoin Core v0.12.0
  },
  PrivKey: {
    version: 0x80
  },
  StealthAddress: {
    version: 42
  },
  TxBuilder: {
    feePerKbNum: 0.0001e8,
    dustNum: 546
  }
}

Constants.TestNet = Object.assign({}, Constants.MainNet, {
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
    versionNum: 70012 // as of Bitcoin Core v0.12.0
  },
  Network: {
    maxconnections: 20,
    minconnections: 8,
    port: 8333,
    rendezvous: {
      host: 'localhost',
      port: 3000,
      path: '/'
    }
  },
  PrivKey: {
    version: 0xef
  },
  StealthAddress: {
    version: 43
  }
})

Constants.Regtest = Object.assign({}, Constants.MainNet, {
  Network: {
    maxconnections: 20,
    minconnections: 8,
    port: 18444,
    rendezvous: {
      host: 'localhost',
      port: 3000,
      path: '/'
    }
  }
})

/**
 * Fullnode can be globally configured to mainnet, testnet, or regtest. Via the
 * inject pattern, you always have access to the other networks at any time.
 * However, it is very convenient to be able to change the default
 * configuration. The default is mainnet, which can be changed to testnet or
 * regtest.
 */
if (process.env.FULLNODE_NETWORK === 'testnet') {
  Constants.Default = Object.assign({}, Constants.TestNet)
} else if (process.env.FULLNODE_NETWORK === 'regtest') {
  Constants.Default = Object.assign({}, Constants.Regtest)
} else {
  process.env.FULLNODE_NETWORK = 'mainnet'
  Constants.Default = Object.assign({}, Constants.MainNet)
}
