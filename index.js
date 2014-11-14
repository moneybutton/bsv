var fullnode = module.exports;

fullnode.version = require('./package').version;

//main bitcoin library - bitcoin protocols and standards
fullnode.Address = require('./lib/address');
fullnode.Base58 = require('./lib/base58');
fullnode.Base58Check = require('./lib/base58check');
fullnode.BIP32 = require('./lib/bip32');
fullnode.BIP39 = require('./lib/bip39');
fullnode.Block = require('./lib/block');
fullnode.Blockheader = require('./lib/blockheader');
fullnode.BN = require('./lib/bn');
fullnode.BufferReader = require('./lib/bufferreader');
fullnode.BufferWriter = require('./lib/bufferwriter');
fullnode.Constants = require('./lib/constants');
fullnode.ECDSA = require('./lib/ecdsa');
fullnode.Hash = require('./lib/hash');
fullnode.KDF = require('./lib/kdf');
fullnode.Keypair = require('./lib/keypair');
fullnode.Message = require('./lib/message');
fullnode.Opcode = require('./lib/opcode');
fullnode.Point = require('./lib/point');
fullnode.Privkey = require('./lib/privkey');
fullnode.Pubkey = require('./lib/pubkey');
fullnode.Random = require('./lib/random');
fullnode.Script = require('./lib/script');
fullnode.Signature = require('./lib/signature');
fullnode.Transaction = require('./lib/transaction');
fullnode.Txin = require('./lib/txin');
fullnode.Txout = require('./lib/txout');
fullnode.Varint = require('./lib/varint');

//experimental, nonstandard, or unstable features
fullnode.expmt = {};
fullnode.expmt.AES = require('./lib/expmt/aes');
fullnode.expmt.AESCBC = require('./lib/expmt/aescbc');
fullnode.expmt.CBC = require('./lib/expmt/cbc');
fullnode.expmt.ECIES = require('./lib/expmt/ecies');

//experimental stealth address support
fullnode.expmt.stealth = {};
fullnode.expmt.stealth.SAddress = require('./lib/expmt/stealth/address');
fullnode.expmt.stealth.SKey = require('./lib/expmt/stealth/key');
fullnode.expmt.stealth.SMessage = require('./lib/expmt/stealth/message');
fullnode.expmt.stealth.STransaction = require('./lib/expmt/stealth/transaction');

//dependencies, subject to change
fullnode.deps = {};
fullnode.deps.aes = require('aes');
fullnode.deps.bnjs = require('bn.js');
fullnode.deps.bs58 = require('bs58');
fullnode.deps.Buffer = Buffer;
fullnode.deps.elliptic = require('elliptic');
fullnode.deps.hashjs = require('hash.js');
fullnode.deps.pbkdf2compat = require('pbkdf2-compat');
