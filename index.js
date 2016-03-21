/* global self */
/**
  * fullnode
  * ========
  *
  * index.js is an example of how to build a bundle with fullnode. This bundle
  * includes the entire library, which uses the default configuration (which is
  * the same as Mainnet) and can be overridden. It also includes Mainnet and
  * Testnet configuration which are accessible even if you override the
  * defaults. It is not necessary to  use fullnode this way, since you probably
  * do not use every component, and therefore do not need to include every
  * component into your project. You can simply directly require the elements
  * of the library you need, and, if your project is browser-based, browserify
  * your project. For instance:
  * let Address = require('fullnode/lib/address').
  */
'use strict'
require('./config')

let fullnode = module.exports
global.fullnode = fullnode

// In order to use the fullnode classes inside a web worker, this file is used.
// However, this file indirectly depends on PeerJS, and PeerJS refers to the
// "window" variable explicitly, which is actually not set in web workers, and
// causes Chrome to throw an error. Rather than window, web workers have self.
// We simply set window to self so that PeerJS does not throw errors which this
// file is loaded inside a web worker. This will cause problems if any code
// relies on the non-existence of window inside a web worker, but there is
// probably not much code like that that would need to work with fullnode.
if (!global.window && typeof self !== 'undefined') {
  global.window = self
}

fullnode.version = require('./package').version

// Main bitcoin library - bitcoin protocols, standards, cryptography, and
// utilities.
fullnode.Address = require('./lib/address')
fullnode.BIP32 = require('./lib/bip32')
fullnode.BIP39 = require('./lib/bip39')
fullnode.BN = require('./lib/bn')
fullnode.BR = require('./lib/br')
fullnode.BSM = require('./lib/bsm')
fullnode.BW = require('./lib/bw')
fullnode.Base58 = require('./lib/base58')
fullnode.Base58Check = require('./lib/base58check')
fullnode.Block = require('./lib/block')
fullnode.Blockheader = require('./lib/blockheader')
fullnode.Constants = require('./lib/constants')
fullnode.ECDSA = require('./lib/ecdsa')
fullnode.Hash = require('./lib/hash')
fullnode.Interp = require('./lib/interp')
fullnode.KDF = require('./lib/kdf')
fullnode.Keypair = require('./lib/keypair')
fullnode.Msg = require('./lib/msg')
fullnode.MsgPing = require('./lib/msgping')
fullnode.MsgPong = require('./lib/msgpong')
fullnode.Opcode = require('./lib/opcode')
fullnode.Point = require('./lib/point')
fullnode.Privkey = require('./lib/privkey')
fullnode.Pubkey = require('./lib/pubkey')
fullnode.Random = require('./lib/random')
fullnode.Script = require('./lib/script')
fullnode.Sig = require('./lib/sig')
fullnode.Struct = require('./lib/struct')
fullnode.Tx = require('./lib/tx')
fullnode.Txbuilder = require('./lib/txbuilder')
fullnode.Txin = require('./lib/txin')
fullnode.Txout = require('./lib/txout')
fullnode.Txverifier = require('./lib/txverifier')
fullnode.Varint = require('./lib/varint')
fullnode.Workers = require('./lib/workers')
fullnode.WorkersCmd = require('./lib/workerscmd')
fullnode.WorkersResult = require('./lib/workersresult')
fullnode.cmp = require('./lib/cmp')
fullnode.injector = require('./lib/injector')

// Encryption tools
fullnode.ACH = require('./lib/ach')
fullnode.AES = require('./lib/aes')
fullnode.AESCBC = require('./lib/aescbc')
fullnode.CBC = require('./lib/cbc')
fullnode.ECIES = require('./lib/ecies')

// Dependencies, subject to change.
fullnode.deps = {}
fullnode.deps.aes = require('aes')
fullnode.deps.bnjs = require('bn.js')
fullnode.deps.bs58 = require('bs58')
fullnode.deps.Buffer = Buffer
fullnode.deps.elliptic = require('elliptic')
fullnode.deps.hashjs = require('hash.js')
fullnode.deps.pbkdf2compat = require('pbkdf2-compat')

// Mainnet classes for your convenience (in case default is not what you want).
let Mainnet = {}
Object.keys(fullnode).forEach(function (key) {
  Mainnet[key] = fullnode[key].Mainnet ? fullnode[key].Mainnet : fullnode[key]
})

// Testnet classes for your convenience (in case default is not what you want).
let Testnet = {}
Object.keys(fullnode).forEach(function (key) {
  Testnet[key] = fullnode[key].Testnet ? fullnode[key].Testnet : fullnode[key]
})

fullnode.Mainnet = Mainnet
fullnode.Testnet = Testnet
