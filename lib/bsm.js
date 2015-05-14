/**
 * Bitcoin Signed Message
 * ======================
 *
 * "Bitcoin Signed Message" just refers to a standard way of signing and
 * verifying an arbitrary message. The standard way to do this involves using a
 * "Bitcoin Signed Message:\n" prefix, which this code does. You are probably
 * interested in the static BSM.sign( ... ) and BSM.verify( ... ) functions,
 * which deal with a base64 string representing the compressed format of a
 * signature.
 */
"use strict";
var ECDSA = require('./ecdsa');
var Keypair = require('./keypair');
var Privkey = require('./privkey');
var Pubkey = require('./pubkey');
var BW = require('./bw');
var Hash = require('./hash');
var Address = require('./address');
var Sig = require('./sig');
var cmp = require('./cmp');

var BSM = function BSM(obj) {
  if (!(this instanceof BSM))
    return new BSM(obj);
  if (obj)
    this.set(obj);
};

BSM.prototype.set = function(obj) {
  this.messagebuf = obj.messagebuf || this.messagebuf;
  this.keypair = obj.keypair || this.keypair;
  this.sig = obj.sig || this.sig;
  this.address = obj.address || this.address;
  this.verified = typeof obj.verified !== 'undefined' ? obj.verified : this.verified;
  return this;
};

BSM.magicBytes = new Buffer('Bitcoin Signed Message:\n');

BSM.magicHash = function(messagebuf) {
  if (!Buffer.isBuffer(messagebuf))
    throw new Error('messagebuf must be a buffer');
  var bw = new BW();
  bw.writeVarintNum(BSM.magicBytes.length);
  bw.write(BSM.magicBytes);
  bw.writeVarintNum(messagebuf.length);
  bw.write(messagebuf);
  var buf = bw.concat();

  var hashbuf = Hash.sha256sha256(buf);

  return hashbuf;
};

BSM.sign = function(messagebuf, keypair) {
  var m = BSM({messagebuf: messagebuf, keypair: keypair});
  m.sign();
  var sigbuf = m.sig.toCompact();
  var sigstr = sigbuf.toString('base64');
  return sigstr;
};

BSM.verify = function(messagebuf, sigstr, address) {
  var sigbuf = new Buffer(sigstr, 'base64');
  var message = new BSM();
  message.messagebuf = messagebuf;
  message.sig = Sig().fromCompact(sigbuf);
  message.address = address;

  return message.verify().verified;
};

BSM.prototype.sign = function() {
  var hashbuf = BSM.magicHash(this.messagebuf);
  var ecdsa = ECDSA({hashbuf: hashbuf, keypair: this.keypair});
  ecdsa.signRandomK();
  ecdsa.calci();
  this.sig = ecdsa.sig;
  return this;
};

BSM.prototype.verify = function() {
  var hashbuf = BSM.magicHash(this.messagebuf);

  var ecdsa = new ECDSA();
  ecdsa.hashbuf = hashbuf;
  ecdsa.sig = this.sig;
  ecdsa.keypair = new Keypair();
  ecdsa.keypair.pubkey = ecdsa.sig2pubkey();

  if (!ecdsa.verify()) {
    this.verified = false;
    return this;
  }

  var address = Address().fromPubkey(ecdsa.keypair.pubkey, undefined, this.sig.compressed);
  //TODO: what if livenet/testnet mismatch?
  if (cmp.eq(address.hashbuf, this.address.hashbuf))
    this.verified = true;
  else
    this.verified = false;

  return this;
};

module.exports = BSM;
