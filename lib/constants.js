/**
 * Constants
 * =========
 *
 * Constants used to distinguish mainnet from testnet.
 */
"use strict";

let Constants = module.exports;

Constants.Mainnet = {
  Address: {
    pubkeyhash: 0x00,
    scripthash: 0x05,
  },
  Privkey: {
    version: 0x80,
  },
  BIP32: {
    pubkey: 0x0488b21e,
    privkey: 0x0488ade4,
  }
};

Constants.Testnet = {
  Address: {
    pubkeyhash: 0x6f,
    scripthash: 0xc4,
  },
  Privkey: {
    version: 0xef,
  },
  BIP32: {
    pubkey: 0x043587cf,
    privkey: 0x04358394,
  }
};

Constants.Default = {};
for (let key of Object.keys(Constants.Mainnet)) {
  Constants.Default[key] = Constants.Mainnet[key];
}
