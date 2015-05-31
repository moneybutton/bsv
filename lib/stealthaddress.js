/**
 * Stealth Address (experimental)
 * ==============================
 */
"use strict";
let dependencies = {
  Base58Check: require('./base58check'),
  BR: require('./br'),
  BW: require('./bw'),
  Constants: require('./constants').Default.StealthAddress,
  KDF: require('./kdf'),
  Pubkey: require('./pubkey'),
  StealthKey: require('./stealthkey'),
  Struct: require('./struct')
};

function inject(deps) {
  let Base58Check = deps.Base58Check;
  let BR = deps.BR;
  let BW = deps.BW;
  let Constants = deps.Constants;
  let KDF = deps.KDF;
  let Pubkey = deps.Pubkey;
  let StealthKey = deps.StealthKey;
  let Struct = deps.Struct;

  function StealthAddress(addrstr) {
    if (!(this instanceof StealthAddress))
      return new StealthAddress(addrstr);
    
    if (typeof addrstr === 'string') {
      this.fromString(addrstr)
    }
    else if (Buffer.isBuffer(addrstr)) {
      let buf = addrstr;
      this.fromBuffer(buf);
    }
    else if (addrstr) {
      let obj = addrstr;
      this.fromObject(obj);
    }
  };

  StealthAddress.prototype = Object.create(Struct.prototype);
  StealthAddress.prototype.constructor = StealthAddress;

  StealthAddress.prototype.fromJSON = function(json) {
    this.fromString(json);
    return this;
  };

  StealthAddress.prototype.toJSON = function() {
    return this.toString();
  };

  StealthAddress.prototype.fromStealthKey = function(stealthkey) {
    this.fromObject({
      payloadPubkey: stealthkey.payloadKeypair.pubkey,
      scanPubkey: stealthkey.scanKeypair.pubkey
    });
    return this;
  };

  StealthAddress.prototype.fromBuffer = function(buf) {
    let parsed = StealthAddress.parseDWBuffer(buf);
    if ((parsed.version !== Constants.version))
      throw new Error('Invalid version');
    if (parsed.options !== 0)
      throw new Error('Invalid options');
    if (!parsed.scanPubkey)
      throw new Error('Invalid scanPubkey');
    if (parsed.payloadPubkeys.length !== 1)
      throw new Error('Must have exactly one payloadPubkey');
    if (parsed.nSigs !== 1)
      throw new Error('Must require exactly one signature');
    if (parsed.prefix.toString() !== "")
      throw new Error('Only blank prefixes supported');
    this.scanPubkey = parsed.scanPubkey;
    this.payloadPubkey = parsed.payloadPubkeys[0];
    return this;
  };

  StealthAddress.prototype.fromString = function(str) {
    return this.fromBuffer(Base58Check().fromString(str).toBuffer());
  };

  StealthAddress.prototype.getSharedKeypair = function(senderKeypair) {
    let sharedSecretPoint = this.scanPubkey.point.mul(senderKeypair.privkey.bn);
    let sharedSecretPubkey = Pubkey(sharedSecretPoint);
    let buf = sharedSecretPubkey.toDER(true);
    let sharedKeypair = KDF.sha256hmac2keypair(buf);

    return sharedKeypair;
  };

  StealthAddress.prototype.getReceivePubkey = function(senderKeypair) {
    let sharedKeypair = this.getSharedKeypair(senderKeypair);
    let pubkey = Pubkey(this.payloadPubkey.point.add(sharedKeypair.pubkey.point));

    return pubkey;
  };

  StealthAddress.prototype.toBuffer = function(networkstr) {
    let version = Constants.version;
    let bw = new BW();
    bw.writeUInt8(version);
    bw.writeUInt8(0); //options
    bw.write(this.scanPubkey.toDER(true));
    bw.writeUInt8(1); //number of payload keys - we only support 1 (not multisig)
    bw.write(this.payloadPubkey.toDER(true));
    bw.writeUInt8(1); //number of signatures - we only support 1 (not multisig)
    bw.writeUInt8(0); //prefix length - we do not support prefix yet
    let buf = bw.toBuffer();
    return buf;
  };

  StealthAddress.prototype.toString = function(networkstr) {
    return Base58Check(this.toBuffer(networkstr)).toString();
  };

  StealthAddress.parseDWBuffer = function(buf) {
    let br = new BR(buf);
    let parsed = {};
    parsed.version = br.readUInt8();
    parsed.options = br.readUInt8();
    parsed.scanPubkey = Pubkey().fromBuffer(br.read(33));
    parsed.nPayloadPubkeys = br.readUInt8();
    parsed.payloadPubkeys = [];
    for (let i = 0; i < parsed.nPayloadPubkeys; i++)
      parsed.payloadPubkeys.push(Pubkey().fromBuffer(br.read(33)));
    parsed.nSigs = br.readUInt8();
    parsed.nPrefix = br.readUInt8();
    parsed.prefix = br.read(parsed.nPrefix / 8);
    return parsed;
  };

  return StealthAddress;
}

inject = require('./injector')(inject, dependencies);
let StealthAddress = inject();
StealthAddress.Mainnet = inject({
  Constants: require('./constants').Mainnet.StealthAddress,
  KDF: require('./kdf').Mainnet,
  StealthKey: require('./stealthkey').Mainnet
});
StealthAddress.Testnet = inject({
  Constants: require('./constants').Testnet.StealthAddress,
  KDF: require('./kdf').Testnet,
  StealthKey: require('./stealthkey').Testnet
});
module.exports = StealthAddress;
