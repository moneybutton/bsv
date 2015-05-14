/**
 * BIP32: HD Wallets
 * =================
 *
 * BIP32 is hierarchical deterministic wallets. The standard way to use this is
 * either BIP32().fromRandom(), or BIP32(string), and then use the .derive()
 * function to derive a path. This code was originally copied from here:
 *
 * https://github.com/sarchar/brainwallet.github.com
 *
 * It has faced mostly minor alterations since it was copied.
 */
"use strict";
let Base58Check = require('./base58check');
let Hash = require('./hash');
let Pubkey = require('./pubkey');
let Privkey = require('./privkey');
let Point = require('./point');
let Random = require('./random');
let BN = require('./bn');
let constants = require('./constants');
let BW = require('./bw');

let BIP32 = function BIP32(obj) {
  if (!(this instanceof BIP32))
    return new BIP32(obj);
  if (typeof obj === 'string') {
    let str = obj;
    this.fromString(str);
  } else if (obj ) {
    this.set(obj);
  }
};

BIP32.prototype.set = function(obj) {
  this.version = typeof obj.version !== 'undefined' ? obj.version : this.version;
  this.depth = typeof obj.depth !== 'undefined' ? obj.depth : this.depth;
  this.parentfingerprint = obj.parentfingerprint || this.parentfingerprint;
  this.childindex = typeof obj.childindex !== 'undefined' ? obj.childindex : this.childindex;
  this.chaincode = obj.chaincode || this.chaincode;
  this.privkey = obj.privkey || this.privkey;
  this.pubkey = obj.pubkey || this.pubkey;
  this.pubkeyhash = obj.pubkeyhash || this.pubkeyhash;
  return this;
};

BIP32.prototype.fromRandom = function(networkstr) {
  if (!networkstr)
    networkstr = 'mainnet';
  this.version = constants[networkstr].bip32privkey;
  this.depth = 0x00;
  this.parentfingerprint = new Buffer([0, 0, 0, 0]);
  this.childindex = 0;
  this.chaincode = Random.getRandomBuffer(32);
  this.privkey = Privkey().fromRandom();
  this.pubkey = Pubkey().fromPrivkey(this.privkey);
  this.pubkeyhash = Hash.sha256ripemd160(this.pubkey.toBuffer());
};

BIP32.prototype.fromString = function(str) {
  return this.fromBuffer(Base58Check.decode(str));
};

BIP32.prototype.fromSeed = function(bytes, networkstr) {
  if (!networkstr)
    networkstr = 'mainnet';

  if (!Buffer.isBuffer(bytes))
    throw new Error('bytes must be a buffer');
  if (bytes.length < 128 / 8)
    throw new Error('Need more than 128 bytes of entropy'); 
  if (bytes.length > 512 / 8)
    throw new Error('More than 512 bytes of entropy is nonstandard');
  let hash = Hash.sha512hmac(bytes, new Buffer('Bitcoin seed'));

  this.depth = 0x00;
  this.parentfingerprint = new Buffer([0, 0, 0, 0]);
  this.childindex = 0;
  this.chaincode = hash.slice(32, 64);
  this.version = constants[networkstr].bip32privkey;
  this.privkey = Privkey().fromBN(BN().fromBuffer(hash.slice(0, 32)));
  this.pubkey = Pubkey().fromPrivkey(this.privkey);
  this.pubkeyhash = Hash.sha256ripemd160(this.pubkey.toBuffer());

  return this;
};

BIP32.prototype.fromHex = function(hex) {
  return this.fromBuffer(new Buffer(hex, 'hex'));
};

BIP32.prototype.fromBuffer = function(buf) {
  // Both pub and private extended keys are 78 buf
  if (buf.length != 78)
    throw new Error('not enough data');

  this.version = buf.slice(0, 4).readUInt32BE(0);
  this.depth = buf.slice(4, 5).readUInt8(0);
  this.parentfingerprint = buf.slice(5, 9);
  this.childindex = buf.slice(9, 13).readUInt32BE(0);
  this.chaincode = buf.slice(13, 45);

  let keyBytes = buf.slice(45, 78);

  let isPrivate = this.isPrivate();

  let isPublic = this.isPublic();

  if (isPrivate && keyBytes[0] == 0) {
    this.privkey = Privkey().fromBN(BN().fromBuffer(keyBytes.slice(1, 33)));
    this.pubkey = Pubkey().fromPrivkey(this.privkey);
    this.pubkeyhash = Hash.sha256ripemd160(this.pubkey.toBuffer());
  } else if (isPublic && (keyBytes[0] == 0x02 || keyBytes[0] == 0x03)) {
    this.pubkey = Pubkey().fromDER(keyBytes);
    this.pubkeyhash = Hash.sha256ripemd160(this.pubkey.toBuffer());
  } else {
    throw new Error('Invalid key');
  }

  return this;
}

BIP32.prototype.derive = function(path) {
  let e = path.split('/');

  if (path === 'm')
    return this;

  let bip32 = this;
  for (let i in e) {
    let c = e[i];

    if (i == 0) {
      if (c !== 'm') throw new Error('invalid path');
      continue;
    }

    if (parseInt(c.replace("'", "")).toString() !== c.replace("'", ""))
      throw new Error('invalid path');

    let usePrivate = (c.length > 1) && (c[c.length - 1] == "'");
    let childindex = parseInt(usePrivate ? c.slice(0, c.length - 1) : c) & 0x7fffffff;

    if (usePrivate)
      childindex += 0x80000000;

    bip32 = bip32.deriveChild(childindex);
  }

  return bip32;
}

BIP32.prototype.deriveChild = function(i) {
  if (typeof i !== 'number')
    throw new Error('i must be a number');

  let ib = [];
  ib.push((i >> 24) & 0xff);
  ib.push((i >> 16) & 0xff);
  ib.push((i >> 8) & 0xff);
  ib.push(i & 0xff);
  ib = new Buffer(ib);

  let usePrivate = (i & 0x80000000) != 0;

  let isPrivate = this.isPrivate();

  if (usePrivate && (!this.privkey || !isPrivate))
    throw new Error('Cannot do private key derivation without private key');

  let ret = null;
  if (this.privkey) {
    let data = null;

    if (usePrivate) {
      data = Buffer.concat([new Buffer([0]), this.privkey.bn.toBuffer({size: 32}), ib]);
    } else {
      data = Buffer.concat([this.pubkey.toBuffer({size: 32}), ib]);
    }

    let hash = Hash.sha512hmac(data, this.chaincode);
    let il = BN().fromBuffer(hash.slice(0, 32), {size: 32});
    let ir = hash.slice(32, 64);

    // ki = IL + kpar (mod n).
    let k = il.add(this.privkey.bn).mod(Point.getN());

    ret = BIP32();
    ret.chaincode = ir;

    ret.privkey = Privkey().fromBN(k);
    ret.pubkey = Pubkey().fromPrivkey(ret.privkey);

  } else {
    let data = Buffer.concat([this.pubkey.toBuffer(), ib]);
    let hash = Hash.sha512hmac(data, this.chaincode);
    let il = BN().fromBuffer(hash.slice(0, 32));
    let ir = hash.slice(32, 64);

    // Ki = (IL + kpar)*G = IL*G + Kpar
    let ilG = Point.getG().mul(il);
    let Kpar = this.pubkey.point;
    let Ki = ilG.add(Kpar);
    let newpub = Pubkey();
    newpub.point = Ki;

    ret = BIP32();
    ret.chaincode = ir;

    ret.pubkey = newpub;
  }

  ret.childindex = i;
  ret.parentfingerprint = this.pubkeyhash.slice(0, 4);
  ret.version = this.version;
  ret.depth = this.depth + 1;

  ret.pubkeyhash = Hash.sha256ripemd160(ret.pubkey.toBuffer());

  return ret;
}

BIP32.prototype.isTestnet = function() {
  return this.version == constants.testnet.bip32privkey || this.version == constants.testnet.bip32pubkey;
};

BIP32.prototype.isMainnet = function() {
  return this.version == constants.mainnet.bip32privkey || this.version == constants.mainnet.bip32pubkey;
};

BIP32.prototype.isPrivate = function() {
  return this.version == constants.testnet.bip32privkey || this.version == constants.mainnet.bip32privkey;
};

BIP32.prototype.isPublic = function() {
  return this.version == constants.testnet.bip32pubkey || this.version == constants.mainnet.bip32pubkey;
};

BIP32.prototype.toPublic = function() {
  if (this.isMainnet())
    this.version = constants.mainnet.bip32pubkey;
  else if (this.isTestnet())
    this.version = constants.testnet.bip32pubkey;
  else
    throw new Error('invalid version type');
  this.privkey = undefined;
  return this;
};

BIP32.prototype.toHex = function() {
  return this.toBuffer().toString('hex');
};

BIP32.prototype.toBuffer = function() {
  if (this.isPrivate()) {
    return BW()
      .writeUInt32BE(this.version)
      .writeUInt8(this.depth)
      .write(this.parentfingerprint)
      .writeUInt32BE(this.childindex)
      .write(this.chaincode)
      .writeUInt8(0)
      .write(this.privkey.bn.toBuffer({size: 32}))
      .concat();
  }
  else if (this.isPublic()) {
    return BW()
      .writeUInt32BE(this.version)
      .writeUInt8(this.depth)
      .write(this.parentfingerprint)
      .writeUInt32BE(this.childindex)
      .write(this.chaincode)
      .write(this.pubkey.toBuffer())
      .concat();
  }
  else {
    throw new Error('invalid version byte');
  }
};

BIP32.prototype.toString = function() {
  return Base58Check.encode(this.toBuffer());
};

module.exports = BIP32;
