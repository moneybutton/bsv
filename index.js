/**
  * fullnode
  * ========
  *
  * An example of how to build a bundle with fullnode. This bundle includes the
  * entire library. It is not necessary to  use fullnode this way, since you
  * probably do not use every component, and therefore do not need to include
  * every component into your project. You should simply directly require the
  * elements of the library you need, and, if your project is browser-based,
  * browserify your project. For instance, require('fullnode/lib/address').
  */
"use strict";
let fullnode = module.exports;
global.fullnode = fullnode;

fullnode.version = require('./package').version;

// main bitcoin library - bitcoin protocols, standards, cryptography, and
// utilities
fullnode.Address = require('./lib/address');
fullnode.Base58 = require('./lib/base58');
fullnode.Base58Check = require('./lib/base58check');
fullnode.BIP32 = require('./lib/bip32');
fullnode.BIP39 = require('./lib/bip39');
fullnode.Block = require('./lib/block');
fullnode.Blockheader = require('./lib/blockheader');
fullnode.BN = require('./lib/bn');
fullnode.BR = require('./lib/br');
fullnode.BSM = require('./lib/bsm');
fullnode.BW = require('./lib/bw');
fullnode.cmp = require('./lib/cmp');
fullnode.Constants = require('./lib/constants');
fullnode.ECDSA = require('./lib/ecdsa');
fullnode.Hash = require('./lib/hash');
fullnode.Interp = require('./lib/interp');
fullnode.KDF = require('./lib/kdf');
fullnode.Keypair = require('./lib/keypair');
fullnode.Opcode = require('./lib/opcode');
fullnode.Point = require('./lib/point');
fullnode.Privkey = require('./lib/privkey');
fullnode.Pubkey = require('./lib/pubkey');
fullnode.Random = require('./lib/random');
fullnode.Script = require('./lib/script');
fullnode.Sig = require('./lib/sig');
fullnode.Tx = require('./lib/tx');
fullnode.Txin = require('./lib/txin');
fullnode.Txout = require('./lib/txout');
fullnode.Txverifier = require('./lib/txverifier');
fullnode.Varint = require('./lib/varint');

// experimental, nonstandard, or unstable features
fullnode.ACH = require('./lib/ach');
fullnode.AES = require('./lib/aes');
fullnode.AESCBC = require('./lib/aescbc');
fullnode.CBC = require('./lib/cbc');
fullnode.ECIES = require('./lib/ecies');
fullnode.StealthAddress = require('./lib/stealthaddress');
fullnode.StealthKey = require('./lib/stealthkey');
fullnode.StealthMessage = require('./lib/stealthmessage');
fullnode.StealthTx = require('./lib/stealthtx');
fullnode.Txbuilder = require('./lib/txbuilder');

// dependencies, subject to change
fullnode.dep = {};
fullnode.dep.aes = require('aes');
fullnode.dep.bnjs = require('bn.js');
fullnode.dep.bs58 = require('bs58');
fullnode.dep.Buffer = Buffer;
fullnode.dep.elliptic = require('elliptic');
fullnode.dep.hashjs = require('hash.js');
fullnode.dep.pbkdf2compat = require('pbkdf2-compat');
fullnode.dep.unorm = require('unorm');
