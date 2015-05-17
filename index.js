/**
  * An example of how to build a bundle with fullnode. This bundle includes the
  * entire library. It is not typically recommended that you use fullnode this
  * way, since you probably do not use every component, and therefore do not
  * need to include every component into your project. You should simply
  * directly require the elements of the library you need, and browserify your
  * project. For instance, require('fullnode/lib/address').
  */
let fullnode = module.exports;
global.fullnode = fullnode;

fullnode.version = require('./package').version;

//main bitcoin library - bitcoin protocols and standards
fullnode.Address = require('./lib/address');
fullnode.AES = require('./lib/aes');
fullnode.AESCBC = require('./lib/aescbc');
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
fullnode.CBC = require('./lib/cbc');
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
fullnode.Varint = require('./lib/varint');

//experimental, nonstandard, or unstable features
fullnode.expmt = {};
fullnode.expmt.ECIES = require('./lib/expmt/ecies');

//experimental stealth address support
fullnode.expmt.stealth = {};
fullnode.expmt.stealth.SAddress = require('./lib/expmt/stealth/address');
fullnode.expmt.stealth.SKey = require('./lib/expmt/stealth/key');
fullnode.expmt.stealth.SMessage = require('./lib/expmt/stealth/message');
fullnode.expmt.stealth.STx = require('./lib/expmt/stealth/tx');

//dependencies, subject to change
fullnode.deps = {};
fullnode.deps.aes = require('aes');
fullnode.deps.bnjs = require('bn.js');
fullnode.deps.bs58 = require('bs58');
fullnode.deps.Buffer = Buffer;
fullnode.deps.elliptic = require('elliptic');
fullnode.deps.hashjs = require('hash.js');
fullnode.deps.pbkdf2compat = require('pbkdf2-compat');
