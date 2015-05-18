var SKey = require('./key');
var SAddress = require('./address');
var ECIES = require('../ecies');
var Keypair = require('../../keypair');
var Address = require('../../address');
var Pubkey = require('../../pubkey');
var cmp = require('../../cmp');

var SMessage = function SMessage(obj) {
  if (!(this instanceof SMessage))
    return new SMessage(obj);
  if (obj)
    this.fromObject(obj);
};

SMessage.prototype.fromObject = function(obj) {
  this.messagebuf = obj.messagebuf || this.messagebuf;
  this.encbuf = obj.encbuf || this.encbuf;
  this.toSAddress = obj.toSAddress || this.toSAddress;
  this.toSKey = obj.toSKey || this.toSKey;
  this.fromKeypair = obj.fromKeypair || this.fromKeypair;
  this.receiveAddress = obj.receiveAddress || this.receiveAddress;
  return this;
};

SMessage.encrypt = function(messagebuf, toSAddress, fromKeypair, ivbuf) {
  var sm = SMessage().fromObject({
    messagebuf: messagebuf,
    toSAddress: toSAddress,
    fromKeypair: fromKeypair
  });
  sm.encrypt(ivbuf);
  var buf = Buffer.concat([
    sm.receiveAddress.hashbuf,
    sm.fromKeypair.pubkey.toDER(true),
    sm.encbuf
  ]);
  return buf;
};

SMessage.decrypt = function(buf, toSKey) {
  var sm = SMessage().fromObject({
    toSKey: toSKey,
    receiveAddress: Address().fromObject({hashbuf: buf.slice(0, 20)}),
    fromKeypair: Keypair().fromObject({pubkey: Pubkey().fromDER(buf.slice(20, 20 + 33))}),
    encbuf: buf.slice(20 + 33)
  });
  return sm.decrypt().messagebuf;
};

SMessage.isForMe = function(buf, toSKey) {
  var sm = SMessage().fromObject({
    toSKey: toSKey,
    receiveAddress: Address().fromObject({hashbuf: buf.slice(0, 20)}),
    fromKeypair: Keypair().fromObject({pubkey: Pubkey().fromDER(buf.slice(20, 20 + 33))}),
    encbuf: buf.slice(20 + 33)
  });
  return sm.isForMe();
};

SMessage.prototype.encrypt = function(ivbuf) {
  if (!this.fromKeypair)
    this.fromKeypair = Keypair().fromRandom();
  var receivePubkey = this.toSAddress.getReceivePubkey(this.fromKeypair);
  this.receiveAddress = Address().fromPubkey(receivePubkey);
  this.encbuf = ECIES.encrypt(this.messagebuf, receivePubkey, this.fromKeypair, ivbuf);
  return this;
};

SMessage.prototype.decrypt = function() {
  var receiveKeypair = this.toSKey.getReceiveKeypair(this.fromKeypair.pubkey);
  this.messagebuf = ECIES.decrypt(this.encbuf, receiveKeypair.privkey);
  return this;
};

SMessage.prototype.isForMe = function() {
  var receivePubkey = this.toSKey.getReceivePubkey(this.fromKeypair.pubkey);
  var receiveAddress = Address().fromPubkey(receivePubkey);
  if (cmp.eq(receiveAddress.hashbuf, this.receiveAddress.hashbuf))
    return true;
  else
    return false;
};

module.exports = SMessage;
