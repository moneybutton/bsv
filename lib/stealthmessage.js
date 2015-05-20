/**
 * Stealth Message (experimental)
 * ==============================
 */
"use strict";
let StealthKey = require('./stealthkey');
let StealthAddress = require('./stealthaddress');
let ECIES = require('./ecies');
let Keypair = require('./keypair');
let Address = require('./address');
let Pubkey = require('./pubkey');
let cmp = require('./cmp');
let Struct = require('./struct');

let StealthMessage = function StealthMessage(obj) {
  if (!(this instanceof StealthMessage))
    return new StealthMessage(obj);
  if (obj)
    this.fromObject(obj);
};

StealthMessage.prototype = Object.create(Struct.prototype);

StealthMessage.encrypt = function(messagebuf, toStealthAddress, fromKeypair, ivbuf) {
  let sm = StealthMessage().fromObject({
    messagebuf: messagebuf,
    toStealthAddress: toStealthAddress,
    fromKeypair: fromKeypair
  });
  sm.encrypt(ivbuf);
  let buf = Buffer.concat([
    sm.receiveAddress.hashbuf,
    sm.fromKeypair.pubkey.toDER(true),
    sm.encbuf
  ]);
  return buf;
};

StealthMessage.decrypt = function(buf, toStealthKey) {
  let sm = StealthMessage().fromObject({
    toStealthKey: toStealthKey,
    receiveAddress: Address().fromObject({hashbuf: buf.slice(0, 20)}),
    fromKeypair: Keypair().fromObject({pubkey: Pubkey().fromDER(buf.slice(20, 20 + 33))}),
    encbuf: buf.slice(20 + 33)
  });
  return sm.decrypt().messagebuf;
};

StealthMessage.isForMe = function(buf, toStealthKey) {
  let sm = StealthMessage().fromObject({
    toStealthKey: toStealthKey,
    receiveAddress: Address().fromObject({hashbuf: buf.slice(0, 20)}),
    fromKeypair: Keypair().fromObject({pubkey: Pubkey().fromDER(buf.slice(20, 20 + 33))}),
    encbuf: buf.slice(20 + 33)
  });
  return sm.isForMe();
};

StealthMessage.prototype.encrypt = function(ivbuf) {
  if (!this.fromKeypair)
    this.fromKeypair = Keypair().fromRandom();
  let receivePubkey = this.toStealthAddress.getReceivePubkey(this.fromKeypair);
  this.receiveAddress = Address().fromPubkey(receivePubkey);
  this.encbuf = ECIES.encrypt(this.messagebuf, receivePubkey, this.fromKeypair, ivbuf);
  return this;
};

StealthMessage.prototype.decrypt = function() {
  let receiveKeypair = this.toStealthKey.getReceiveKeypair(this.fromKeypair.pubkey);
  this.messagebuf = ECIES.decrypt(this.encbuf, receiveKeypair.privkey);
  return this;
};

StealthMessage.prototype.isForMe = function() {
  let receivePubkey = this.toStealthKey.getReceivePubkey(this.fromKeypair.pubkey);
  let receiveAddress = Address().fromPubkey(receivePubkey);
  if (cmp.eq(receiveAddress.hashbuf, this.receiveAddress.hashbuf))
    return true;
  else
    return false;
};

module.exports = StealthMessage;
