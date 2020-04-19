/**
 * bsv
 * ===
 *
 * index.js is an example of how to build a bundle with bsv. This
 * bundle includes the entire library, which uses the default configuration
 * (which is the same as Mainnet) and can be overridden. It also includes
 * Mainnet and Testnet configuration which are accessible even if you override
 * the defaults. It is not necessary to  use Yours Bitcoin this way, since you
 * probably do not use every component, and therefore do not need to include
 * every component into your project. You can simply directly require the
 * elements of the library you need, and, if your project is browser-based,
 * browserify your project. For instance:
 * let Address = require('bsv/lib/address').
 */
'use strict'
require('babel-polyfill')
const path = require('path')

if (!process.browser) {
  require('dotenv-extended').load({
    path: path.resolve('.env'),
    defaults: path.resolve('.env.defaults'),
    schema: path.resolve('.env.schema')
  })
}

let bsv = module.exports

bsv.version = require('./version').version

// Main bitcoin library - bitcoin protocols, standards, cryptography, and
// utilities.
bsv.Address = require('./lib/address')
bsv.Bip32 = require('./lib/bip-32')
bsv.Bip39 = require('./lib/bip-39')
bsv.Bip68 = require('./lib/bip-68')
bsv.Bn = require('./lib/bn')
bsv.Br = require('./lib/br')
bsv.Bsm = require('./lib/bsm')
bsv.Bw = require('./lib/bw')
bsv.Base58 = require('./lib/base-58')
bsv.Base58Check = require('./lib/base-58-check')
bsv.Block = require('./lib/block')
bsv.BlockHeader = require('./lib/block-header')
bsv.Constants = require('./lib/constants')
bsv.Ecdsa = require('./lib/ecdsa')
bsv.Hash = require('./lib/hash')
bsv.Interp = require('./lib/interp')
bsv.Kdf = require('./lib/kdf')
bsv.KeyPair = require('./lib/key-pair')
bsv.OpCode = require('./lib/op-code')
bsv.Point = require('./lib/point')
bsv.PrivKey = require('./lib/priv-key')
bsv.PubKey = require('./lib/pub-key')
bsv.Random = require('./lib/random')
bsv.Script = require('./lib/script')
bsv.Sig = require('./lib/sig')
bsv.Struct = require('./lib/struct')
bsv.Tx = require('./lib/tx')
bsv.TxBuilder = require('./lib/tx-builder')
bsv.TxIn = require('./lib/tx-in')
bsv.TxOut = require('./lib/tx-out')
bsv.TxOutMap = require('./lib/tx-out-map')
bsv.TxVerifier = require('./lib/tx-verifier')
bsv.VarInt = require('./lib/var-int')
bsv.Workers = require('./lib/workers')
bsv.WorkersResult = require('./lib/workers-result')
bsv.cmp = require('./lib/cmp')

// Encryption tools. Some bitcoin standards use Aes encryption, so that's why
// these are available.
bsv.Ach = require('./lib/ach')
bsv.Aes = require('./lib/aes')
bsv.Aescbc = require('./lib/aescbc')
bsv.Cbc = require('./lib/cbc')
bsv.Ecies = require('./lib/ecies')

// Dependencies, subject to change.
bsv.deps = {}
bsv.deps.aes = require('aes')
bsv.deps.bnjs = require('bn.js')
bsv.deps.bs58 = require('bs58')
bsv.deps.Buffer = Buffer
bsv.deps.elliptic = require('elliptic')
bsv.deps.hashjs = require('hash.js')
bsv.deps.injecter = require('./lib/injecter')
bsv.deps.pbkdf2compat = require('pbkdf2-compat')

// Mainnet classes for your convenience (in case default is not what you want).
let Mainnet = {}
Object.keys(bsv).forEach(function (key) {
  Mainnet[key] = bsv[key].Mainnet
    ? bsv[key].Mainnet
    : bsv[key]
})

// Testnet classes for your convenience (in case default is not what you want).
let Testnet = {}
Object.keys(bsv).forEach(function (key) {
  Testnet[key] = bsv[key].Testnet
    ? bsv[key].Testnet
    : bsv[key]
})

// Litecoin classes for your convenience (in case default is not what you want).
let Litecoin = {}
Object.keys(bsv).forEach(function (key) {
  Litecoin[key] = bsv[key].Litecoin
    ? bsv[key].Litecoin
    : bsv[key]
})

// LitecoinTestnet classes for your convenience (in case default is not what you want).
let LitecoinTestnet = {}
Object.keys(bsv).forEach(function (key) {
  LitecoinTestnet[key] = bsv[key].LitecoinTestnet
    ? bsv[key].LitecoinTestnet
    : bsv[key]
})

bsv.Mainnet = Mainnet
bsv.Testnet = Testnet
bsv.Litecoin = Litecoin
bsv.LitecoinTestnet = LitecoinTestnet

bsv.browser = process.browser
bsv.env = process.env
