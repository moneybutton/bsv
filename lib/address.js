/**
 * Bitcoin Address
 * ===============
 *
 * A bitcoin address. The primary way to use this class is either
 * Address().fromPubkey(pubkey) or Address.fromString(string).
 */
"use strict";
let Base58check = require('./base58check');
let constants = require('./constants');
let Hash = require('./hash');
let Pubkey = require('./pubkey');
let Script = require('./script');
let Struct = require('./struct');

function Address(buf) {
  if (!(this instanceof Address))
    return new Address(buf);
  if (Buffer.isBuffer(buf)) {
    this.fromBuffer(buf);
  } else if (typeof buf === 'string') {
    let str = buf;
    this.fromString(str);
  } else if (buf) {
    let obj = buf;
    this.fromObject(obj);
  }
};

Address.prototype = Object.create(Struct.prototype);
Address.prototype.constructor = Address;

Address.prototype.fromBuffer = function(buf) {
  if (buf.length !== 1 + 20)
    throw new Error('Address buffers must be exactly 21 bytes');
  this.version = buf[0];
  this.hashbuf = buf.slice(1);
  return this;
};

Address.prototype.fromHashbuf = function(hashbuf, networkstr, typestr) {
  if (hashbuf.length !== 20)
    throw new Error('hashbuf must be exactly 20 bytes');
  this.hashbuf = hashbuf;
  if (networkstr) {
    if (!typestr)
      typestr = 'pubkeyhash';
    this.version = constants[networkstr][typestr];
  } else {
    this.version = 0;
  }
  return this;
};

Address.prototype.fromPubkey = function(pubkey, networkstr) {
  this.hashbuf = Hash.sha256ripemd160(pubkey.toBuffer());
  networkstr = networkstr || 'mainnet';
  let typestr = 'pubkeyhash';
  this.version = constants[networkstr][typestr];
  return this;
};

Address.prototype.fromRedeemScript = function(script, networkstr) {
  this.hashbuf = Hash.sha256ripemd160(script.toBuffer());
  networkstr = networkstr || 'mainnet';
  let typestr = 'scripthash';
  this.version = constants[networkstr][typestr];
  return this;
};

Address.prototype.fromString = function(str) {
  let buf = Base58check.decode(str);
  return this.fromBuffer(buf);
}

Address.isValid = function(addrstr) {
  let address;
  try {
    address = new Address().fromString(addrstr);
  } catch (e) {
    return false;
  }
  return address.isValid();
};

Address.prototype.isValid = function() {
  try {
    this.validate();
    return true;
  } catch (e) {
    return false;
  }
};

Address.prototype.network = function() {
  if (this.version === constants['mainnet']['pubkeyhash']) {
    return 'mainnet';
  } else if (this.version === constants['mainnet']['scripthash']) {
    return 'mainnet';
  } else if (this.version === constants['testnet']['pubkeyhash']) {
    return 'testnet';
  } else if (this.version === constants['testnet']['scripthash']) {
    return 'testnet';
  } else {
    return 'unknown';
  }
};

Address.prototype.type = function() {
  if (this.version === constants['mainnet']['pubkeyhash']) {
    return 'pubkeyhash';
  } else if (this.version === constants['mainnet']['scripthash']) {
    return 'scripthash';
  } else if (this.version === constants['testnet']['pubkeyhash']) {
    return 'pubkeyhash';
  } else if (this.version === constants['testnet']['scripthash']) {
    return 'scripthash';
  } else {
    return 'unknown';
  }
};

Address.prototype.toScript = function() {
  let type = this.type();
  let script;
  if (type === 'pubkeyhash') {
    script = Script();
    script.writeOp('OP_DUP');
    script.writeOp('OP_HASH160');
    script.writeBuffer(this.hashbuf);
    script.writeOp('OP_EQUALVERIFY');
    script.writeOp('OP_CHECKSIG');
  }
  else if (type === 'scripthash') {
    script = Script();
    script.writeOp('OP_HASH160');
    script.writeBuffer(this.hashbuf);
    script.writeOp('OP_EQUAL');
  } else {
    throw new Error('script must be either pubkeyhash or scripthash');
  }
  return script;
};

Address.prototype.toBuffer = function() {
  let versionbuf = new Buffer([this.version]);
  let buf = Buffer.concat([versionbuf, this.hashbuf]);
  return buf;
};

Address.prototype.toString = function() {
  return Base58check.encode(this.toBuffer());
};

Address.prototype.validate = function() {
  if (!Buffer.isBuffer(this.hashbuf) || this.hashbuf.length !== 20)
    throw new Error('hash must be a buffer of 20 bytes');
  if (this.version !== constants['mainnet']['pubkeyhash']
   && this.version !== constants['mainnet']['scripthash']
   && this.version !== constants['testnet']['pubkeyhash']
   && this.version !== constants['testnet']['scripthash'])
    throw new Error('invalid version');
  return this;
};

module.exports = Address;
