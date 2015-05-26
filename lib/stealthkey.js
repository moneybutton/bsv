/**
 * Stealth Key (experimental)
 * ==========================
 */
"use strict";
let Keypair = require('./keypair');
let Privkey = require('./privkey');
let Pubkey = require('./pubkey');
let Point = require('./point');
let Hash = require('./hash');
let KDF = require('./kdf');
let cmp = require('./cmp');
let Struct = require('./struct');

let StealthKey = function StealthKey(payloadKeypair, scanKeypair) {
  if (!(this instanceof StealthKey))
    return new StealthKey(payloadKeypair, scanKeypair);

  if (payloadKeypair instanceof Keypair) {
    this.fromObject({
      payloadKeypair: payloadKeypair,
      scanKeypair: scanKeypair
    });
  }
  else if (payloadKeypair) {
    let obj = payloadKeypair;
    this.fromObject(obj);
  }
};

StealthKey.prototype = Object.create(Struct.prototype);
StealthKey.prototype.constructor = StealthKey;

StealthKey.prototype.fromJSON = function(json) {
  this.fromObject({
    payloadKeypair: Keypair().fromJSON(json.payloadKeypair),
    scanKeypair: Keypair().fromJSON(json.scanKeypair)
  });
  return this;
};

StealthKey.prototype.toJSON = function() {
  return {
    payloadKeypair: this.payloadKeypair.toJSON(),
    scanKeypair: this.scanKeypair.toJSON()
  };
};

StealthKey.prototype.fromRandom = function() {
  this.payloadKeypair = Keypair().fromRandom();
  this.scanKeypair = Keypair().fromRandom();

  return this;
};

StealthKey.prototype.getSharedKeypair = function(senderPubkey) {
  let sharedSecretPoint = senderPubkey.point.mul(this.scanKeypair.privkey.bn);
  let sharedSecretPubkey = Pubkey({point: sharedSecretPoint});
  let buf = sharedSecretPubkey.toDER(true);
  let sharedKeypair = KDF.sha256hmac2keypair(buf);

  return sharedKeypair;
};

StealthKey.prototype.getReceivePubkey = function(senderPubkey) {
  let sharedKeypair = this.getSharedKeypair(senderPubkey);
  let pubkey = Pubkey({point: this.payloadKeypair.pubkey.point.add(sharedKeypair.pubkey.point)});

  return pubkey;
};

StealthKey.prototype.getReceiveKeypair = function(senderPubkey) {
  let sharedKeypair = this.getSharedKeypair(senderPubkey);
  let privkey = Privkey().fromBN(this.payloadKeypair.privkey.bn.add(sharedKeypair.privkey.bn).mod(Point.getN()));
  let key = Keypair().fromPrivkey(privkey);

  return key;
};

StealthKey.prototype.isForMe = function(senderPubkey, myPossiblePubkeyhashbuf) {
  let pubkey = this.getReceivePubkey(senderPubkey);
  let pubkeybuf = pubkey.toDER(true);
  let pubkeyhash = Hash.sha256ripemd160(pubkeybuf);

  if (cmp(pubkeyhash, myPossiblePubkeyhashbuf))
    return true;
  else
    return false;
};

module.exports = StealthKey;
