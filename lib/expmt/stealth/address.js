var SKey = require('./key');
var Base58check = require('../../base58check');
var Pubkey = require('../../pubkey');
var KDF = require('../../kdf');
var BW = require('../../bw');
var BR = require('../../br');

var SAddress = function SAddress(addrstr) {
  if (!(this instanceof SAddress))
    return new SAddress(addrstr);
  
  if (typeof addrstr === 'string') {
    this.fromString(addrstr)
  }
  else if (Buffer.isBuffer(addrstr)) {
    var buf = addrstr;
    this.fromBuffer(buf);
  }
  else if (addrstr) {
    var obj = addrstr;
    this.fromObject(obj);
  }
};

SAddress.mainver = 42;
SAddress.testver = 43;

SAddress.prototype.fromObject = function(obj) {
  this.payloadPubkey = obj.payloadPubkey || this.payloadPubkey;
  this.scanPubkey = obj.scanPubkey || this.scanPubkey;
  return this;
};

SAddress.prototype.fromJSON = function(json) {
  this.fromString(json);
  return this;
};

SAddress.prototype.toJSON = function() {
  return this.toString();
};

SAddress.prototype.fromSKey = function(stealthkey) {
  this.fromObject({
    payloadPubkey: stealthkey.payloadKeypair.pubkey,
    scanPubkey: stealthkey.scanKeypair.pubkey
  });
  return this;
};

SAddress.prototype.fromBuffer = function(buf) {
  var parsed = SAddress.parseDWBuffer(buf);
  if ((parsed.version !== SAddress.mainver) && (parsed.version !== SAddress.testver))
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

SAddress.prototype.fromString = function(str) {
  return this.fromBuffer(Base58check(str).toBuffer());
};

SAddress.prototype.getSharedKeypair = function(senderKeypair) {
  var sharedSecretPoint = this.scanPubkey.point.mul(senderKeypair.privkey.bn);
  var sharedSecretPubkey = Pubkey(sharedSecretPoint);
  var buf = sharedSecretPubkey.toDER(true);
  var sharedKeypair = KDF.sha256hmac2keypair(buf);

  return sharedKeypair;
};

SAddress.prototype.getReceivePubkey = function(senderKeypair) {
  var sharedKeypair = this.getSharedKeypair(senderKeypair);
  var pubkey = Pubkey(this.payloadPubkey.point.add(sharedKeypair.pubkey.point));

  return pubkey;
};

SAddress.prototype.toBuffer = function(networkstr) {
  if (networkstr === 'testnet')
    var version = SAddress.testver;
  else
    var version = SAddress.mainver;
  var bw = new BW();
  bw.writeUInt8(version);
  bw.writeUInt8(0); //options
  bw.write(this.scanPubkey.toDER(true));
  bw.writeUInt8(1); //number of payload keys - we only support 1 (not multisig)
  bw.write(this.payloadPubkey.toDER(true));
  bw.writeUInt8(1); //number of signatures - we only support 1 (not multisig)
  bw.writeUInt8(0); //prefix length - we do not support prefix yet
  var buf = bw.concat();
  return buf;
};

SAddress.prototype.toString = function(networkstr) {
  return Base58check(this.toBuffer(networkstr)).toString();
};

SAddress.parseDWBuffer = function(buf) {
  var br = new BR(buf);
  var parsed = {};
  parsed.version = br.readUInt8();
  parsed.options = br.readUInt8();
  parsed.scanPubkey = Pubkey().fromBuffer(br.read(33));
  parsed.nPayloadPubkeys = br.readUInt8();
  parsed.payloadPubkeys = [];
  for (var i = 0; i < parsed.nPayloadPubkeys; i++)
    parsed.payloadPubkeys.push(Pubkey().fromBuffer(br.read(33)));
  parsed.nSigs = br.readUInt8();
  parsed.nPrefix = br.readUInt8();
  parsed.prefix = br.read(parsed.nPrefix / 8);
  return parsed;
};

module.exports = SAddress;
