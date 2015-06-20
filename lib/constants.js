/**
 * Constants
 * =========
 *
 * Constants used to distinguish mainnet from testnet.
 */
"use strict";

let extend = require('./extend');
let Constants = module.exports;

Constants.Mainnet = {
  maxsize: 0x02000000, //MAX_SIZE
  Address: {
    pubkeyhash: 0x00,
    scripthash: 0x05,
  },
  BIP32: {
    pubkey: 0x0488b21e,
    privkey: 0x0488ade4,
  },
  Block: {
    maxnbits: 0x1d00ffff,
    magicnum: 0xf9beb4d9
  },
  Msg: {
    magicnum: 0xf9beb4d9
  },
  Privkey: {
    version: 0x80,
  },
  StealthAddress: {
    version: 42
  }
};

Constants.Testnet = extend({}, Constants.Mainnet, {
  Address: {
    pubkeyhash: 0x6f,
    scripthash: 0xc4,
  },
  BIP32: {
    pubkey: 0x043587cf,
    privkey: 0x04358394,
  },
  Block: {
    maxnbits: 0x1d00ffff,
    magicnum: 0x0b110907
  },
  Msg: {
    magicnum: 0x0b110907
  },
  Privkey: {
    version: 0xef,
  },
  StealthAddress: {
    version: 43
  }
});

Constants.Default = extend({}, Constants.Mainnet);
