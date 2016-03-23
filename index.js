/* global self */
/**
  * Fullnode
  * ========
  *
  * index.js is an example of how to build a bundle with Fullnode. This bundle
  * includes the entire library, which uses the default configuration (which is
  * the same as Mainnet) and can be overridden. It also includes Mainnet and
  * Testnet configuration which are accessible even if you override the
  * defaults. It is not necessary to  use Fullnode this way, since you probably
  * do not use every component, and therefore do not need to include every
  * component into your project. You can simply directly require the elements
  * of the library you need, and, if your project is browser-based, browserify
  * your project. For instance:
  * let Address = require('fullnode/lib/address').
  */
'use strict'
require('./config')

let Fullnode = module.exports
global.Fullnode = Fullnode

// In order to use the Fullnode classes inside a web worker, this file is used.
// However, this file indirectly depends on PeerJS, and PeerJS refers to the
// "window" variable explicitly, which is actually not set in web workers, and
// causes Chrome to throw an error. Rather than window, web workers have self.
// We simply set window to self so that PeerJS does not throw errors which this
// file is loaded inside a web worker. This will cause problems if any code
// relies on the non-existence of window inside a web worker, but there is
// probably not much code like that that would need to work with Fullnode.
if (!global.window && typeof self !== 'undefined') {
  global.window = self
}

Fullnode.version = require('./package').version

// Main bitcoin library - bitcoin protocols, standards, cryptography, and
// utilities.
Fullnode.Address = require('./lib/address')
Fullnode.BIP32 = require('./lib/bip32')
Fullnode.BIP39 = require('./lib/bip39')
Fullnode.BN = require('./lib/bn')
Fullnode.BR = require('./lib/br')
Fullnode.BSM = require('./lib/bsm')
Fullnode.BW = require('./lib/bw')
Fullnode.Base58 = require('./lib/base58')
Fullnode.Base58Check = require('./lib/base58check')
Fullnode.Block = require('./lib/block')
Fullnode.Blockheader = require('./lib/blockheader')
Fullnode.Constants = require('./lib/constants')
Fullnode.ECDSA = require('./lib/ecdsa')
Fullnode.Hash = require('./lib/hash')
Fullnode.Interp = require('./lib/interp')
Fullnode.KDF = require('./lib/kdf')
Fullnode.Keypair = require('./lib/keypair')
Fullnode.Msg = require('./lib/msg')
Fullnode.MsgPing = require('./lib/msgping')
Fullnode.MsgPong = require('./lib/msgpong')
Fullnode.Opcode = require('./lib/opcode')
Fullnode.Point = require('./lib/point')
Fullnode.Privkey = require('./lib/privkey')
Fullnode.Pubkey = require('./lib/pubkey')
Fullnode.Random = require('./lib/random')
Fullnode.Script = require('./lib/script')
Fullnode.Sig = require('./lib/sig')
Fullnode.Struct = require('./lib/struct')
Fullnode.Tx = require('./lib/tx')
Fullnode.Txbuilder = require('./lib/txbuilder')
Fullnode.Txin = require('./lib/txin')
Fullnode.Txout = require('./lib/txout')
Fullnode.Txverifier = require('./lib/txverifier')
Fullnode.Varint = require('./lib/varint')
Fullnode.Workers = require('./lib/workers')
Fullnode.WorkersCmd = require('./lib/workerscmd')
Fullnode.WorkersResult = require('./lib/workersresult')
Fullnode.cmp = require('./lib/cmp')
Fullnode.injector = require('./lib/injector')

// Encryption tools
Fullnode.ACH = require('./lib/ach')
Fullnode.AES = require('./lib/aes')
Fullnode.AESCBC = require('./lib/aescbc')
Fullnode.CBC = require('./lib/cbc')
Fullnode.ECIES = require('./lib/ecies')

// Dependencies, subject to change.
Fullnode.deps = {}
Fullnode.deps.aes = require('aes')
Fullnode.deps.bnjs = require('bn.js')
Fullnode.deps.bs58 = require('bs58')
Fullnode.deps.Buffer = Buffer
Fullnode.deps.elliptic = require('elliptic')
Fullnode.deps.hashjs = require('hash.js')
Fullnode.deps.pbkdf2compat = require('pbkdf2-compat')

// Mainnet classes for your convenience (in case default is not what you want).
let Mainnet = {}
Object.keys(Fullnode).forEach(function (key) {
  Mainnet[key] = Fullnode[key].Mainnet ? Fullnode[key].Mainnet : Fullnode[key]
})

// Testnet classes for your convenience (in case default is not what you want).
let Testnet = {}
Object.keys(Fullnode).forEach(function (key) {
  Testnet[key] = Fullnode[key].Testnet ? Fullnode[key].Testnet : Fullnode[key]
})

Fullnode.Mainnet = Mainnet
Fullnode.Testnet = Testnet
