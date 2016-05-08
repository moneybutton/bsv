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
Fullnode.Addr = require('./lib/addr')
Fullnode.Bip32 = require('./lib/bip-32')
Fullnode.Bip39 = require('./lib/bip-39')
Fullnode.Bip68 = require('./lib/bip-68')
Fullnode.Bn = require('./lib/bn')
Fullnode.Br = require('./lib/br')
Fullnode.Bsm = require('./lib/bsm')
Fullnode.Bw = require('./lib/bw')
Fullnode.Base58 = require('./lib/base-58')
Fullnode.Base58Check = require('./lib/base-58-check')
Fullnode.Block = require('./lib/block')
Fullnode.BlockHeader = require('./lib/block-header')
Fullnode.Constants = require('./lib/constants')
Fullnode.Ecdsa = require('./lib/ecdsa')
Fullnode.GetBlocks = require('./lib/get-blocks')
Fullnode.Hash = require('./lib/hash')
Fullnode.Interp = require('./lib/interp')
Fullnode.Inv = require('./lib/inv')
Fullnode.Kdf = require('./lib/kdf')
Fullnode.KeyPair = require('./lib/key-pair')
Fullnode.Msg = require('./lib/msg')
Fullnode.MsgAddr = require('./lib/msg-addr')
Fullnode.MsgAlert = require('./lib/msg-alert')
Fullnode.MsgBlock = require('./lib/msg-block')
Fullnode.MsgGetBlocks = require('./lib/msg-get-blocks')
Fullnode.MsgGetData = require('./lib/msg-get-data')
Fullnode.MsgGetHeaders = require('./lib/msg-get-headers')
Fullnode.MsgHeaders = require('./lib/msg-headers')
Fullnode.MsgInv = require('./lib/msg-inv')
Fullnode.MsgMemPool = require('./lib/msg-mem-pool')
Fullnode.MsgNotFound = require('./lib/msg-not-found')
Fullnode.MsgPing = require('./lib/msg-ping')
Fullnode.MsgPong = require('./lib/msg-pong')
Fullnode.MsgReject = require('./lib/msg-reject')
Fullnode.MsgTx = require('./lib/msg-tx')
Fullnode.MsgVerAck = require('./lib/msg-ver-ack')
Fullnode.OpCode = require('./lib/op-code')
Fullnode.Point = require('./lib/point')
Fullnode.PrivKey = require('./lib/priv-key')
Fullnode.PubKey = require('./lib/pub-key')
Fullnode.Random = require('./lib/random')
Fullnode.Reject = require('./lib/reject')
Fullnode.Script = require('./lib/script')
Fullnode.Sig = require('./lib/sig')
Fullnode.Struct = require('./lib/struct')
Fullnode.Tx = require('./lib/tx')
Fullnode.TxBuilder = require('./lib/tx-builder')
Fullnode.TxIn = require('./lib/tx-in')
Fullnode.TxOut = require('./lib/tx-out')
Fullnode.TxVerifier = require('./lib/tx-verifier')
Fullnode.VarInt = require('./lib/var-int')
Fullnode.Workers = require('./lib/workers')
Fullnode.WorkersCmd = require('./lib/workers-cmd')
Fullnode.WorkersResult = require('./lib/workers-result')
Fullnode.cmp = require('./lib/cmp')

// Encryption tools. Some bitcoin standards use Aes encryption, so that's why
// these are available.
Fullnode.Ach = require('./lib/ach')
Fullnode.Aes = require('./lib/aes')
Fullnode.Aescbc = require('./lib/aescbc')
Fullnode.Cbc = require('./lib/cbc')
Fullnode.Ecies = require('./lib/ecies')

// Dependencies, subject to change.
Fullnode.deps = {}
Fullnode.deps.aes = require('aes')
Fullnode.deps.bnjs = require('bn.js')
Fullnode.deps.bs58 = require('bs58')
Fullnode.deps.Buffer = Buffer
Fullnode.deps.elliptic = require('elliptic')
Fullnode.deps.hashjs = require('hash.js')
Fullnode.deps.injecter = require('injecter')
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
