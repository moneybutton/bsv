'use strict'

var bsv = module.exports

// module information
bsv.version = 'v' + require('./package.json').version
bsv.versionGuard = function (version) {
  if (version !== undefined) {
    var message = `
      More than one instance of bsv found.
      Please make sure to require bsv and check that submodules do
      not also include their own bsv dependency.`
    console.warn(message)
  }
}
bsv.versionGuard(global._bsv)
global._bsv = bsv.version

// crypto
bsv.crypto = {}
bsv.crypto.BN = require('./lib/crypto/bn')
bsv.crypto.ECDSA = require('./lib/crypto/ecdsa')
bsv.crypto.Hash = require('./lib/crypto/hash')
bsv.crypto.Random = require('./lib/crypto/random')
bsv.crypto.Point = require('./lib/crypto/point')
bsv.crypto.Signature = require('./lib/crypto/signature')

// encoding
bsv.encoding = {}
bsv.encoding.Base58 = require('./lib/encoding/base58')
bsv.encoding.Base58Check = require('./lib/encoding/base58check')
bsv.encoding.BufferReader = require('./lib/encoding/bufferreader')
bsv.encoding.BufferWriter = require('./lib/encoding/bufferwriter')
bsv.encoding.Varint = require('./lib/encoding/varint')

// utilities
bsv.util = {}
bsv.util.js = require('./lib/util/js')
bsv.util.preconditions = require('./lib/util/preconditions')

// errors thrown by the library
bsv.errors = require('./lib/errors')

// main bitcoin library
bsv.Address = require('./lib/address')
bsv.Block = require('./lib/block')
bsv.MerkleBlock = require('./lib/block/merkleblock')
bsv.BlockHeader = require('./lib/block/blockheader')
bsv.HDPrivateKey = require('./lib/hdprivatekey.js')
bsv.HDPublicKey = require('./lib/hdpublickey.js')
bsv.Networks = require('./lib/networks')
bsv.Opcode = require('./lib/opcode')
bsv.PrivateKey = require('./lib/privatekey')
bsv.PublicKey = require('./lib/publickey')
bsv.Script = require('./lib/script')
bsv.Transaction = require('./lib/transaction')

// dependencies, subject to change
bsv.deps = {}
bsv.deps.bnjs = require('bn.js')
bsv.deps.bs58 = require('bs58')
bsv.deps.Buffer = Buffer
bsv.deps.elliptic = require('elliptic')
bsv.deps._ = require('./lib/util/_')

// Internal usage, exposed for testing/advanced tweaking
bsv.Transaction.sighash = require('./lib/transaction/sighash')
