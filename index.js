/* global self */
/**
  * YoursBitcoin
  * ============
  *
  * index.js is an example of how to build a bundle with YoursBitcoin. This
  * bundle includes the entire library, which uses the default configuration
  * (which is the same as Mainnet) and can be overridden. It also includes
  * Mainnet and Testnet configuration which are accessible even if you override
  * the defaults. It is not necessary to  use Yours Bitcoin this way, since you
  * probably do not use every component, and therefore do not need to include
  * every component into your project. You can simply directly require the
  * elements of the library you need, and, if your project is browser-based,
  * browserify your project. For instance:
  * let Address = require('yours-bitcoin/lib/address').
  */
'use strict'
require('./config')

let YoursBitcoin = module.exports
global.YoursBitcoin = YoursBitcoin

// In order to use the YoursBitcoin classes inside a web worker, this file is
// used.  However, this file indirectly depends on PeerJS, and PeerJS refers to
// the "window" variable explicitly, which is actually not set in web workers,
// and causes Chrome to throw an error. Rather than window, web workers have
// self.  We simply set window to self so that PeerJS does not throw errors
// which this file is loaded inside a web worker. This will cause problems if
// any code relies on the non-existence of window inside a web worker, but
// there is probably not much code like that that would need to work with
// Yours Bitcoin.
if (!global.window && typeof self !== 'undefined') {
  global.window = self
}

YoursBitcoin.version = require('./package').version

// Main bitcoin library - bitcoin protocols, standards, cryptography, and
// utilities.
YoursBitcoin.Address = require('./lib/address')
YoursBitcoin.Addr = require('./lib/addr')
YoursBitcoin.Bip32 = require('./lib/bip-32')
YoursBitcoin.Bip39 = require('./lib/bip-39')
YoursBitcoin.Bip68 = require('./lib/bip-68')
YoursBitcoin.Bn = require('./lib/bn')
YoursBitcoin.Br = require('./lib/br')
YoursBitcoin.Bsm = require('./lib/bsm')
YoursBitcoin.Bw = require('./lib/bw')
YoursBitcoin.Base58 = require('./lib/base-58')
YoursBitcoin.Base58Check = require('./lib/base-58-check')
YoursBitcoin.Block = require('./lib/block')
YoursBitcoin.BlockHeader = require('./lib/block-header')
YoursBitcoin.Constants = require('./lib/constants')
YoursBitcoin.Ecdsa = require('./lib/ecdsa')
YoursBitcoin.GetBlocks = require('./lib/get-blocks')
YoursBitcoin.Hash = require('./lib/hash')
YoursBitcoin.Interp = require('./lib/interp')
YoursBitcoin.Inv = require('./lib/inv')
YoursBitcoin.Kdf = require('./lib/kdf')
YoursBitcoin.KeyPair = require('./lib/key-pair')
YoursBitcoin.Msg = require('./lib/msg')
YoursBitcoin.MsgAddr = require('./lib/msg-addr')
YoursBitcoin.MsgAlert = require('./lib/msg-alert')
YoursBitcoin.MsgBlock = require('./lib/msg-block')
YoursBitcoin.MsgGetBlocks = require('./lib/msg-get-blocks')
YoursBitcoin.MsgGetData = require('./lib/msg-get-data')
YoursBitcoin.MsgGetHeaders = require('./lib/msg-get-headers')
YoursBitcoin.MsgHeaders = require('./lib/msg-headers')
YoursBitcoin.MsgInv = require('./lib/msg-inv')
YoursBitcoin.MsgMemPool = require('./lib/msg-mem-pool')
YoursBitcoin.MsgNotFound = require('./lib/msg-not-found')
YoursBitcoin.MsgPing = require('./lib/msg-ping')
YoursBitcoin.MsgPong = require('./lib/msg-pong')
YoursBitcoin.MsgReject = require('./lib/msg-reject')
YoursBitcoin.MsgTx = require('./lib/msg-tx')
YoursBitcoin.MsgVerAck = require('./lib/msg-ver-ack')
YoursBitcoin.MsgVersion = require('./lib/msg-version')
YoursBitcoin.OpCode = require('./lib/op-code')
YoursBitcoin.Point = require('./lib/point')
YoursBitcoin.PrivKey = require('./lib/priv-key')
YoursBitcoin.PubKey = require('./lib/pub-key')
YoursBitcoin.Random = require('./lib/random')
YoursBitcoin.Reject = require('./lib/reject')
YoursBitcoin.Script = require('./lib/script')
YoursBitcoin.Sig = require('./lib/sig')
YoursBitcoin.Struct = require('./lib/struct')
YoursBitcoin.Tx = require('./lib/tx')
YoursBitcoin.TxBuilder = require('./lib/tx-builder')
YoursBitcoin.TxIn = require('./lib/tx-in')
YoursBitcoin.TxOut = require('./lib/tx-out')
YoursBitcoin.TxVerifier = require('./lib/tx-verifier')
YoursBitcoin.VarInt = require('./lib/var-int')
YoursBitcoin.Version = require('./lib/version')
YoursBitcoin.Workers = require('./lib/workers')
YoursBitcoin.WorkersCmd = require('./lib/workers-cmd')
YoursBitcoin.WorkersResult = require('./lib/workers-result')
YoursBitcoin.cmp = require('./lib/cmp')

// Encryption tools. Some bitcoin standards use Aes encryption, so that's why
// these are available.
YoursBitcoin.Ach = require('./lib/ach')
YoursBitcoin.Aes = require('./lib/aes')
YoursBitcoin.Aescbc = require('./lib/aescbc')
YoursBitcoin.Cbc = require('./lib/cbc')
YoursBitcoin.Ecies = require('./lib/ecies')

// Dependencies, subject to change.
YoursBitcoin.deps = {}
YoursBitcoin.deps.aes = require('aes')
YoursBitcoin.deps.bnjs = require('bn.js')
YoursBitcoin.deps.bs58 = require('bs58')
YoursBitcoin.deps.Buffer = Buffer
YoursBitcoin.deps.elliptic = require('elliptic')
YoursBitcoin.deps.hashjs = require('hash.js')
YoursBitcoin.deps.injecter = require('injecter')
YoursBitcoin.deps.pbkdf2compat = require('pbkdf2-compat')

// Mainnet classes for your convenience (in case default is not what you want).
let Mainnet = {}
Object.keys(YoursBitcoin).forEach(function (key) {
  Mainnet[key] = YoursBitcoin[key].Mainnet ? YoursBitcoin[key].Mainnet : YoursBitcoin[key]
})

// Testnet classes for your convenience (in case default is not what you want).
let Testnet = {}
Object.keys(YoursBitcoin).forEach(function (key) {
  Testnet[key] = YoursBitcoin[key].Testnet ? YoursBitcoin[key].Testnet : YoursBitcoin[key]
})

YoursBitcoin.Mainnet = Mainnet
YoursBitcoin.Testnet = Testnet
