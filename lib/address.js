/**
 * Bitcoin Address
 * ===============
 *
 * A bitcoin address. Normal use cases:
 * let address = Address().fromPubkey(pubkey);
 * let address = Address().fromRedeemScript(script);
 * let address = Address().fromString(string);
 * let string = address.toString();
 * let script = address.toScript();
 * let isValid = Address.isValid(string);
 *
 * Can also do testnet:
 * let address = Address.Testnet();
 */
"use strict";
let dependencies = {
  Base58Check: require('./base58check'),
  Constants: require('./constants').Default.Address,
  Hash: require('./hash'),
  Opcode: require('./opcode'),
  Pubkey: require('./pubkey'),
  Script: require('./script'),
  Struct: require('./struct')
}

function inject(deps) {

  function Address(version, hashbuf) {
    if (!(this instanceof Address))
      return new Address(version, hashbuf);
    this.fromObject({
      version: version,
      hashbuf: hashbuf
    });
  };

  Address.prototype = Object.create(deps.Struct.prototype);
  Address.prototype.constructor = Address;

  Address.prototype.fromBuffer = function(buf) {
    let Constants = deps.Constants;
    if (buf.length !== 1 + 20)
      throw new Error('address buffers must be exactly 21 bytes');
    if (buf[0] !== Constants.pubkeyhash && buf[0] !== Constants.scripthash)
      throw new Error('invalid version byte');
    this.version = buf[0];
    this.hashbuf = buf.slice(1);
    return this;
  };

  Address.prototype.fromPubkey = function(pubkey) {
    let Hash = deps.Hash;
    let Constants = deps.Constants;
    this.hashbuf = Hash.sha256ripemd160(pubkey.toBuffer());
    this.version = Constants['pubkeyhash'];
    return this;
  };

  Address.prototype.fromRedeemScript = function(script, networkstr) {
    let Hash = deps.Hash;
    let Constants = deps.Constants;
    this.hashbuf = Hash.sha256ripemd160(script.toBuffer());
    networkstr = networkstr || 'mainnet';
    let typestr = 'scripthash';
    this.version = Constants[typestr];
    return this;
  };

  Address.prototype.fromString = function(str) {
    let Base58Check = deps.Base58Check;
    let buf = Base58Check.decode(str);
    return this.fromBuffer(buf);
  }

  Address.isValid = function(addrstr) {
    let address;
    try {
      address = Address().fromString(addrstr);
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

  Address.prototype.type = function() {
    let Constants = deps.Constants;
    if (this.version === Constants['pubkeyhash']) {
      return 'pubkeyhash';
    } else if (this.version === Constants['scripthash']) {
      return 'scripthash';
    } else {
      return 'unknown';
    }
  };

  Address.prototype.toScript = function() {
    let Script = deps.Script;
    let Opcode = deps.Opcode;
    let type = this.type();
    let script;
    if (type === 'pubkeyhash') {
      script = Script();
      script.writeOpcode(Opcode.OP_DUP);
      script.writeOpcode(Opcode.OP_HASH160);
      script.writeBuffer(this.hashbuf);
      script.writeOpcode(Opcode.OP_EQUALVERIFY);
      script.writeOpcode(Opcode.OP_CHECKSIG);
    }
    else if (type === 'scripthash') {
      script = Script();
      script.writeOpcode(Opcode.OP_HASH160);
      script.writeBuffer(this.hashbuf);
      script.writeOpcode(Opcode.OP_EQUAL);
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
    let Base58Check = deps.Base58Check;
    return Base58Check.encode(this.toBuffer());
  };

  Address.prototype.validate = function() {
    let Constants = deps.Constants;
    if (!Buffer.isBuffer(this.hashbuf) || this.hashbuf.length !== 20)
      throw new Error('hashbuf must be a buffer of 20 bytes');
    if (this.version !== Constants['pubkeyhash']
     && this.version !== Constants['scripthash'])
      throw new Error('invalid version');
    return this;
  };

  return Address;
}

let injector = require('./injector');
let Address = injector(inject, dependencies);
Address.Mainnet = injector(inject, dependencies, {
  Constants: require('./constants').Mainnet.Address
});
Address.Testnet = injector(inject, dependencies, {
  Constants: require('./constants').Testnet.Address
});
module.exports = Address;
