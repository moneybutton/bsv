/**
 * Keypair
 * =======
 *
 * A keypair is just a collection of a private key and a public key. Note that
 * in this implementation, both private key and public key are optional. If the
 * public key is not present, you can derive it from the private key using
 * privkey2pubkey(). If the private key is not present, there is no way to
 * derive it from the public key.
 */
"use strict";
let Privkey = require('./privkey');
let Pubkey = require('./pubkey');
let BN = require('./bn');
let point = require('./point');
let Struct = require('./struct');

let Keypair = function Keypair(obj) {
  if (!(this instanceof Keypair))
    return new Keypair(obj);
  if (obj)
    this.fromObject(obj);
};

Keypair.prototype = Object.create(Struct.prototype);

Keypair.prototype.fromJSON = function(json) {
  if (json.privkey)
    this.fromObject({privkey: Privkey().fromJSON(json.privkey)});
  if (json.pubkey)
    this.fromObject({pubkey: Pubkey().fromJSON(json.pubkey)});
  return this;
};

Keypair.prototype.toJSON = function() {
  let json = {};
  if (this.privkey)
    json.privkey = this.privkey.toJSON();
  if (this.pubkey)
    json.pubkey = this.pubkey.toJSON();
  return json;
};

Keypair.prototype.fromPrivkey = function(privkey) {
  this.privkey = privkey;
  this.privkey2pubkey();
  return this;
};

Keypair.prototype.fromRandom = function() {
  this.privkey = Privkey().fromRandom();
  this.privkey2pubkey();
  return this;
};

Keypair.prototype.fromString = function(str) {
  let obj = JSON.parse(str);
  if (obj.privkey) {
    this.privkey = Privkey().fromString(obj.privkey);
  }
  if (obj.pubkey) {
    this.pubkey = Pubkey().fromString(obj.pubkey);
  }
  return this;
};

Keypair.prototype.privkey2pubkey = function() {
  this.pubkey = Pubkey().fromPrivkey(this.privkey);
  return this;
};

Keypair.prototype.toString = function() {
  let obj = {};
  if (this.privkey)
    obj.privkey = this.privkey.toString();
  if (this.pubkey)
    obj.pubkey = this.pubkey.toString();
  return JSON.stringify(obj);
};

module.exports = Keypair;
